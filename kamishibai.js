'use strict'
const script = parent=>{

const
  wrapper = $mk('div'),
  element = $mk('div',{style: {position: 'absolute', top: 0, bottom: 0, left: 0, right: 0}}),
  background = $mk('img',{style:{position: 'absolute', height: '100%', width: '100%'}}),
  layer_ele = $mk('div',{style:{position: 'absolute',overflow: 'hidden', height: '100%', width: '100%'}}),
  filter_ele = $mk('div',{style:{position: 'absolute', height: '100%', width: '100%'}}),
  front_ele = $mk('div',{style:{position: 'absolute', height: '100%', width: '100%'}}),
  text_ele = $mk('div',{style:{position: 'absolute', height: '100%', width: '100%'}}),
  fukidasi = {className: 'fukidashi',style:
        {position: 'absolute', bottom: '0px', left: '10%', width: '80%', height: '5em',
         color: 'white', textShadow: '0 1px 3px black', fontSize: '140%'}},
  log = $mk('div', {className: 'log'}),
  log_x = $mk('div', {className: 'log-x', textContent: 'x'}),
  hito = {}

element.appendChild(background)
element.appendChild(layer_ele)
element.appendChild(filter_ele)
element.appendChild(text_ele)
element.appendChild(front_ele)
 log.appendChild(log_x)
element.appendChild(log)
wrapper.appendChild(element)
parent.appendChild(wrapper)

addOn(n_list,{
  'this-box': element,
  'front-ele': front_ele,
  hito: hito,
  front: front_ele
})
addIn(n_list, {
  setParent: parent=> parent.appendChild(element),
  'aspect-ratio': ratio=> wrapper.classList.add(ratio),
  'resize-box': (w,h)=>{
    wrapper.classList.remove('wide','standard','cinesco')
    addIn(element.style, {width: w, height: h})
  },
  'resize-font': a=> element.style.fontSize = a,
  image: src=> addIn(new Image(), {src: src}),
  bg: (img,animation)=>{
    background.src = img.src
    background.style.animation = 'none'
    background.style.animation = animation || 'fadein 0.75s'
  },
  make: (name, ...ks)=>
    hito[name] = duo(ks).reduce((pre,k)=>
      addOn(pre, {[k[0]]: addIn(k[1],
        {className: name, style: {position: 'absolute', width: 'auto'}})}), {}),
  filter: fil=>
    fil
      ? typeof fil === 'string'
        ? filter_ele.style.backgroundColor = fil || "rgba(0,0,0,0)"
        : filter_ele.style.backgroundImage = `url('${fil.src}')`
      : addIn(filter_ele,{style:{backgroundColor: 'transparent',
                                 backgroundImage: 'none'}}),
  clear:
    ((re= e=> e && (e.style.animation = 'none', $remove(e)))=>
      (...arg)=>
        arg.length
          ? arg.forEach(a=> re(layer_ele.getElementsByClassName(a)[0]))
          :  [... layer_ele.children, $getClass(element, 'select')].forEach(re))(),
  show: (name, ...ps)=>{
    clear(name)
    layer_ele.appendChild(addIn(...ps.map(p=> hito[name][p])))
  },
  talk: (name,str)=>{
    const tc = {textContent: `${name}\n「${str}」`}
    const fd =  mix(fukidasi, tc)
    $getClass(layer_ele, name)
    addIn(text_ele, fd)
    log.appendChild($mk('div', tc))
    log.scrollTop = log.scrollHeight
  },
  text: str=>{
    const tc = {textContent: str}
    addIn(text_ele, mix(fukidasi, tc))
    log.appendChild($mk('div', tc))
    log.scrollTop = log.scrollHeight
  },
  logview: ()=>{
    text_ele.style.visibility = 'hidden'
    log.style.visibility = 'visible'
    log_x.onclick = e=>{
      text_ele.style.visibility = 'visible'
      log.style.visibility = 'hidden'
    }
  },
  右: {style: {left: '60%'}},
  左: {style: {right: '60%'}},
  中: {style: {top: 0, left: 0, right: 0, margin: 'auto'}},
  上下: {style: {animation: 'vertical 0.5s ease infinite alternate'}},
  停止: {style: {animation: 'none'}}
})


const splitArray = (l,key,i)=>
  (i= l.indexOf(key)) === -1
    ? [l]
    : concat([l.slice(0, i)], splitArray(l.slice(i +1), key))

addIn(n_list, {'split-array': splitArray})

// マクロの順番に注意 / 展開タイミングに影響します /
exec(`
  (defmacro chapter (name & body)
   \`(defun ,name (fn)
       (script-eval ,@body (if fn (fn)))))

  (defmacro script-eval (& body)
   \`(let ((l (quote ,@(split-array body "wt")))
           (i 0))
       (set front-ele "onclick"
         (lambda (e) (list-progn (nth l (incf i)))))
       (defun onkeypress (e)
         (if (eq (get e "keyCode") 32)
           (list-progn (nth l (incf i)))))
       (list-progn (first l))))

  (defmacro shows (& body)
   \`(show ,@(map body (lambda (b) (list 'str b)))))

  (defun wt () (undefined))

  (defun switch (& body)
    (set front-ele "onclick" through)
    (def onkeypress through)
    (duo body (lambda (o f)
                (append-child
                  front
                  (let ((sw ($mk "div" {className: "switch"} o)))
                    (set sw "onmouseup" f)
                    (set sw "ontouchend" f)
                    sw))
                (append-child front ($mk "br")))))

  (defun select (& body)
    (set front-ele "onclick" through)
    (def onkeypress through)
    (let ((ele (append-child front ($mk "div" {className: "select"}))))
      (duo body (lambda (o f)
                  (append-child
                    ele
                    (let ((sw ($mk "div" {className: "switch"} o))
                          (fe (lambda (e)
                                ($rm ele)
                                (f e))))
                      (set sw "onmouseup" fe)
                      (set sw "ontouchend" fe)
                      sw))
                  (append-child ele ($mk "br"))))))

`)

reader_macro.push(str=>
  str.replace(/^\s*([^\s(]+)「(.*)」/gm, '(talk (str $1) (str $2)) wt '))
reader_macro.push(str=>
  str.replace(/^\s*[　]([^\s]*)/gm, '(text (str $1)) wt '))

// 日本語別名登録 //
addIn(n_list, {
  人物: n_list.make,
  背景: n_list.bg,
  消去: n_list.crear,
  スイッチ: n_list['switch'],
  分岐: n_list['select']
})
addIn(macro, {
  表示: macro.shows,
  章: macro.chapter,
})

///init///
n_list['aspect-ratio']('wide')
}
