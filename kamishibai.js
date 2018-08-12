'use strict'
const kamishibai = parent=>{

const
  wrapper = $mk('div'),
  element = $mk('div',{style: {position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, userSelect: 'none'}}),
  background = $mk('img',{style:{position: 'absolute', height: '100%', width: '100%'}}),
  layer_ele = $mk('div',{className: 'layer', style:{position: 'absolute',overflow: 'hidden', height: '100%', width: '100%'}}),
  filter_ele = $mk('div',{className: 'filter', style:{position: 'absolute', height: '100%', width: '100%'}}),
  front_ele = $mk('div',{style:{position: 'absolute', height: '100%', width: '100%'}}),
  text_ele = $mk('div'),
  fukidasi = {className: 'fukidashi'},
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

n_list.show_now = {}
let title = ''
const makeSaveData = (...datas)=>
    ['chapter-now', 'chapter-now-num', ...datas]
      .reduce((pre,d)=> addIn(pre, {[d]: n_list[d]}), {})

addIn(n_list, {
  'this-box': element,
  hito: hito,
  front: front_ele,
  setParent: parent=> parent.appendChild(wrapper),
  title: s=> title = s,
  'aspect-ratio': ratio=>{
    wrapper.classList.remove('wide','standard','cinesco','rotate-wide')
    wrapper.classList.add(ratio)
  },
  'resize-box': (w,h)=>{
    wrapper.classList.remove('wide','standard','cinesco','rotate-wide')
    addIn(element.style, {width: w, height: h})
  },
  'resize-font': a=> element.style.fontSize = a,
  image: src=> addIn(new Image(), {src: src}),
  //video: src=> $mk('video',{src: src, loop: true, autoplay: true}),
  bg: (img, animation)=>{
    background.src = img.src
    background.style.animation = 'none'
    background.style.animation = animation || 'fadein 0.75s'
    n_list.bg_now = Object.keys(n_list).find(k=> (img === n_list[k]) && k)
  },
  make: (name, ...ks)=>
    hito[name] = duo(ks).reduce((pre,k)=>
      addIn(pre, {[k[0]]: addIn(k[1],
        {className: name, style: {position: 'absolute', width: 'auto'}})}), {}),
  filter: fil=>
    fil
      ? typeof fil === 'string'
        ? filter_ele.style.backgroundColor = fil || "rgba(0,0,0,0)"
        : filter_ele.style.backgroundImage = `url('${fil.src}')`
      : addIn(filter_ele,{style:{backgroundColor: 'transparent',
                                 backgroundImage: 'none'}}),
  clear:
    ((re= e=> e && (e.style.animation = 'none',
                    $remove(e)))=>
      (...arg)=>
        arg.length
          ? arg.forEach(a=> (re($getClass(layer_ele, a)),
                             delete n_list.show_now[a]))
          : ([... Array.prototype.slice.call(layer_ele.children),
              $getClass(element, 'select')]
              .forEach(re),
             filter(),
             n_list.show_now = {})
    )(),
  show: (name, ...ps)=>{
    clear(name)
    layer_ele.appendChild(addIn(...ps.map(p=> hito[name][p])))
    const c = $getClass(layer_ele, name)
    if (wrapper.classList.contains('rotate-wide') && c) {
      Array.prototype.slice.call(layer_ele.children).forEach(lc=> lc.classList.remove('talk'))
      c.classList.add('talk')
    }
    n_list.show_now[name] = ps
  },
  'now-show': ()=>[
    ... Object.keys(n_list.show_now).map(k=>["shows",k, ...n_list.show_now[k]]),
    ... (n_list.bg_now ? [["bg", n_list.bg_now]] : [])
  ],
  talk: (name,str)=>{
    const tc = {textContent: `${name}\n「${str}」`}
    const fd =  mix(fukidasi, tc)
    const c = $getClass(layer_ele, name)
    if (wrapper.classList.contains('rotate-wide') && c) {
      Array.prototype.slice.call(layer_ele.children).forEach(lc=> lc.classList.remove('talk'))
      c.classList.add('talk')
    }
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
  左右: {style: {animation: 'horizontal 0.5s ease infinite alternate'}},
  停止: {style: {animation: 'none'}},
  'quick-save': (...args)=>
    n_list['chapter-now']
      ? localStorage.setItem('quicksave-'+ title,
            JSON.stringify(makeSaveData(...args)))
      : alert('現在セーブはできません'),
  'quick-load': ()=>{
    const data = JSON.parse(localStorage.getItem('quicksave-'+ title))
    if (data) {
      const cn  = data['chapter-now']
      const cnn = data['chapter-now-num']
      exec(`(script-eval ${cn} ${cnn})`)
    }
    else alert('セーブデータが無いよ')
  }
})


const splitArray = (l,key,i)=>
  (i= l.indexOf(key)) === -1
    ? [l]
    : [].concat([l.slice(0, i)], splitArray(l.slice(i +1), key))

addIn(n_list, {'split-array': splitArray})

// マクロの順番に注意 / 展開タイミングに影響します /
exec(`
  (defmacro chapter (name & body)
   \`(def ,name (quote (def chapter-now (str ,name)) ,@body)))

  (defun script-eval (ll index)
    (let ((l (split-array ll "wt"))
          (i (or index 0)))
       (if (and index (< index (length l)))
         (forEach (slice l 0 index) #((a) (eval a))))
       (let ((sc #((i) (def chapter-now-num i)
                       (eval (nth l i)))))
         (setq front.onclick #(() (sc (incf i))))
         (defun onkeypress (e)
           (if (= e.keyCode 32) (sc (incf i))))
         (sc 0))))

  (defmacro shows (& body)
   \`(show ,@(map body #((b) (list 'str b)))))

  (defun wt () (undefined))

  (defun switch (& body)
    (setq front.onclick through)
    (def onkeypress through)
    (duo body #((o f)
                (append-child
                  front
                  (let ((sw ($mk "div" {className: "switch"} o)))
                    (setq sw.onclick #((e) (e.stopPropagation)
                                           (f e)))
                    sw)))))

  (defun select (& body)
    (setq front.onclick through)
    (def onkeypress through)
    (let ((ele (append-child front ($mk "div" {className: "select"}))))
      (duo body #((o f)
                  (append-child
                    ele
                    (let ((sw ($mk "div" {className: "switch"} o)))
                      (setq sw.onclick #((e) ($rm ele)
                                             (e.stopPropagation)
                                             (f e)))
                      sw))))))

  (defun reshow () (eval (now-show)))
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
