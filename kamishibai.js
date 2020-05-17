import {addIn, mix, eleAdd, appendCss} from './nl.js'
import './Character.js'

const
  $id = id=> document.getElementById(id),
  $classes = c=> document.getElementsByClassName(c),
  $mk = (type, ...objs)=> addIn(document.createElement(type), ...objs),
  $remove = e=> e && e.parentNode && e.parentNode.removeChild(e),
  $getClass = (e,c)=> e.getElementsByClassName(c)[0],
  $getTags = (e,t)=> [...e.getElementsByTagName(t)]

class KamishibaiElement extends HTMLElement {
  element = $mk('div',
    {style: {position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, userSelect: 'none'}})
  background = $mk('img', {style:{position: 'absolute', height: '100%', width: '100%'}})
  layer_ele = $mk('div',
    {className: 'layer',
     style:{position: 'absolute',overflow: 'hidden', height: '100%', width: '100%'}})
  filter_ele = $mk('div',
    {className: 'filter', style:{position: 'absolute', height: '100%', width: '100%', opacity: 1}})
  front_ele = $mk('div',{style:{position: 'absolute', height: '100%', width: '100%'}})
  text_ele = $mk('div')
  fukidasi = {className: 'fukidashi'}
  log = $mk('div', {className: 'log'})
  log_x = $mk('div', {className: 'log-x', textContent: 'x'})
  bgm_ele = $mk('audio', {autoplay: true, loop: true})
  voice_ele = $mk('audio', {autoplay: true})
  shadow = this.attachShadow({mode: 'open'})
  constructor () {
    super()
    this.element.appendChild(this.background)
    this.element.appendChild(this.layer_ele)
    this.element.appendChild(this.filter_ele)
    this.element.appendChild(this.text_ele)
    this.element.appendChild(this.front_ele)
    this.log.appendChild(this.log_x)
    this.element.appendChild(this.log)
    appendCss(this.shadow, 'kamishibai.css')
    this.shadow.appendChild(this.element)
  }
  setLisp (lisp) {
    Object.assign(lisp.env, {
      kamishibai: this,
      kamishibaiError: e=> { throw e }, // defaultではただエラーを投げる
      show_now: {},
      auto_mode: false,
      voice_path: '',
      _title: '',
    }, base_env)
    lisp.exec(lisp_str)
    lisp.env['aspect-ratio']('wide')
    lisp.reader_macros.push(str=> str.replace(/^\s*([^\s(]+)「(.*)」$/gm, '(talk "$1" "$2") wt '))
    lisp.reader_macros.push(str=> str.replace(/^\s*[　](.*)$/gm, '(text "$1") wt '))
    return this
  }
}
customElements.define('kami-shibai', KamishibaiElement)

const makeSaveData = (...datas)=>
    ['chapter-now', 'chapter-now-num', ...datas]
      .reduce((pre,d)=> addIn(pre, {[d]: n_list[d]}), {})
const splitArray = (l,key,i)=>
  (i= l.indexOf(key)) === -1
    ? [l]
    : [].concat([l.slice(0, i)], splitArray(l.slice(i +1), key))

const base_env = {
  $id: $id,
  $classes: $classes,
  $mk: $mk,
  $rm: $remove,
  'append-child': (e,c)=> e.appendChild(c),
  'split-array': splitArray,
  右: {style: {left: '60%'}},
  左: {style: {right: '60%'}},
  中: {style: {left: '0', right: '0', top: '0', margin: 'auto'}},
  上下: {style: {animation: 'vertical 0.5s ease infinite alternate'}},
  上下早: {style: {animation: 'vertical 0.25s ease infinite alternate'}},
  左右: {style: {animation: 'horizontal 0.5s ease infinite alternate'}},
  停止: {style: {animation: 'none'}},

  image (src) {
    return addIn(new Image(), {src, onerror (e) { this.kamishibaiError(e) }})
  },
  title (s) { this._title = s },
  'aspect-ratio' (ratio) {
    this.kamishibai.classList.remove('wide','standard','cinesco','rotate-wide')
    this.kamishibai.classList.add(ratio)
  },
  'resize-box' (w, h) {
    this.kamishibai.element.classList.remove('wide','standard','cinesco','rotate-wide')
    addIn(this.kamishibai.element.style, {width: w, height: h})
  },
  'set-row-chars' (a) {
    this.kamishibai.fukidasi.style = {fontSize: `calc(69vw / ${a})`}
  },
  //video: src=> $mk('video',{src: src, loop: true, autoplay: true}),
  bg (img, animation) {
    this.kamishibai.background.style.animation = 'none'
    setTimeout(e=>
        addIn(this.kamishibai.background, {src: img.src,
                                           style:{animation: animation || 'fadein 0.75s'}}),
      0)
    this.bg_now = Object.keys(this).find(k=> (img === this[k]) && k)
  },
  make (name, ...ks) {
    const splitArray = (array, part)=>
      Array.from({length: Math.floor(array.length / part)}).map((_,i)=> array.slice(i * part, (i+1) * part))
    this.getGrobal()[name] = document.createElement('img',{is:'char-actor'}).init(name, splitArray(ks, 2))
    //this.getGrobal()[name] = duo(ks).reduce((pre,[k,v])=>
    //  addIn(pre, {[k]: addIn(v,
    //    {className: name, style: {position: 'absolute', width: 'auto'}})}), {})
  },
  'add-position' (char, p_name, position) {
    char.addPosition(p_name, position)
  },
  'add-image' (char, i_name, img) {
    char.addImage(i_name, img)
  },
  film (fil) {
    fil
      ? typeof fil === 'string'
        ? this.kamishibai.filter_ele.style.backgroundColor = fil || "rgba(0,0,0,0)"
        : this.kamishibai.filter_ele.style.backgroundImage = `url('${fil.src}')`
      : addIn(this.kamishibai.filter_ele, {style: {backgroundColor: 'transparent',
                                                   backgroundImage: 'none'}})
  },
  clear (...arg) {
    const re= e=> e && (e.style.animation = 'none', $remove(e))
    if (arg.length)
      arg.forEach(a=> (re($getClass(this.kamishibai.layer_ele, a)),
                       delete this.show_now[a]))
    else {
      [...this.kamishibai.layer_ele.children, $getClass(this.kamishibai.element, 'select')].forEach(re),
      this.film(),
      this.show_now = {}
    }
  },
  show (name, img_name, ...ps) {
    this.clear(name)
    const char = this[name]
    char.show(this.kamishibai.layer_ele, img_name, ...ps)
    //const img = new Image()
    //this.kamishibai.layer_ele.appendChild(addIn(img, ...ps))
    //const c = $getClass(this.kamishibai.layer_ele, name)
    if (this.kamishibai.classList.contains('rotate-wide') && c) {
      Array.from(this.kamishibai.layer_ele.children)
           .forEach(lc=> lc.classList.remove('talk'))
      c.classList.add('talk')
    }
    this.show_now[name] = [img_name, ...ps]
    return char
  },
  'now-show' () {
    return [
      ... Object.keys(this.show_now).map(k=>["shows",k, ...this.show_now[k]]),
      ... (this.bg_now ? [["bg", this.bg_now]] : [])
    ]
  },
  talk (name, str) {
    const tc = {textContent: `${name}\n「${str}」`, style: {color: 'white'}}
    const fd = mix(this.kamishibai.fukidasi, tc)
    const c = $getClass(this.kamishibai.layer_ele, name)
    if (this.kamishibai.classList.contains('rotate-wide') && c) {
      Array.prototype.slice.call(this.kamishibai.layer_ele.children)
                           .forEach(lc=> lc.classList.remove('talk'))
      c.classList.add('talk')
    }
    this.voice_path && this.voice(name + '「'+ str +'」.mp3')
    addIn(this.kamishibai.text_ele, fd)
    this.kamishibai.log.appendChild($mk('div', tc))
    this.kamishibai.log.scrollTop = this.kamishibai.log.scrollHeight
    if (this.auto_mode && !this.voice_path) setTimeout(this.kamishibai.front_ele.onclick, 1800)
  },
  preLoadVoice (name, str) {
    $mk('audio', {src: this.voice_path + name + '「'+ str +'」.mp3'})
  },
  text (str, option) {
    const tc = mix({textContent: '\n'+ str, style: {color: 'white'}},
                   option && {style: option})
    addIn(this.kamishibai.text_ele, mix(this.kamishibai.fukidasi, tc))
    this.kamishibai.log.appendChild($mk('div', tc))
    this.kamishibai.log.scrollTop = this.kamishibai.log.scrollHeight
    if (this.auto_mode) setTimeout(this.kamishibai.front_ele.onclick, 1800)
  },
  logview () {
    this.kamishibai.text_ele.style.visibility = 'hidden'
    this.kamishibai.log.style.visibility = 'visible'
    this.kamishibai.log_x.onclick = e=>{
      this.kamishibai.text_ele.style.visibility = 'visible'
      this.kamishibai.log.style.visibility = 'hidden'
    }
  },
  voice (url) {
    this.kamishibai.voice_ele.src = this.voice_path + url
    this.kamishibai.voice_ele.onended = e=> this.auto_mode && setTimeout(this.kamishibai.front_ele.onclick, 700)
  },
  'voice-path' (path) {
    this.getGrobal().voice_path = this.voice_path = path
  },
  bgm (src, volume= 1) {
    this.kamishibai.bgm_ele.volume = volume
    this.kamishibai.bgm_ele.src = src
  },
  'quick-save' (...args) {
    n_list['chapter-now']
      ? localStorage.setItem('quicksave-'+ this._title,
            JSON.stringify(makeSaveData(...args)))
      : alert('現在セーブはできません')
  },
  'quick-load' () {
    const data = JSON.parse(localStorage.getItem('quicksave-'+ this._title))
    if (data) {
      const cn  = data['chapter-now']
      const cnn = data['chapter-now-num']
      lisp.exec(`(script-eval ${cn} ${cnn})`)
    }
    else alert('セーブデータが無いよ')
  },
  's-try' (t) {
    try { return t() }
    catch (e) { this.kamishibaiError(e) }
  }
}

// マクロの順番に注意 / 展開タイミングに影響します /
const lisp_str = `
  (defmacro chapter (name & body)
   \`(def ,name (quote (def chapter-now (str ,name)) ,@body)))

  (defun script-eval (lines index)
    (if voice_path
      (each #((l) (if (= (first l) "talk")
                    (preLoadVoice (. l 1 1) (. l 2 1))))
            lines))
    (let ((l (split-array lines "wt"))
          (i (or index 0)))
       (if (and index (< index (length l)))
         (each #((a) (eval a)) (slice l 0 index)))
       (let ((sc #((i) (s-try #(() (if (< i (length l))
                                     (progn (def chapter-now-num i)
                                            (eval (nth l i)))))
                              #((e) (log e))))))
         (set kamishibai 'front_ele 'onclick #(() (sc (incf i))))
         (set window 'onkeydown
              #((e) (if (= (. e 'keyCode) 32)
                          (progn ((. e 'preventDefault))
                                 (sc (incf i))))))
         (sc 0))))

  (defmacro shows (hito & params)
   \`(show (str ,hito) ,@(map #((p) \`(str ,p)) params)))

  (def wt undefined)

  (defun switch (& body)
    (set (. kamishibai 'front_ele) 'onclick through)
    (set window 'onkeypress through)
    (duo body #((o f)
                (append-child
                  (. kamishibai 'front_ele)
                  ($mk "div" (obj 'className "switch"
                                  'onclick #((e) ((. e 'stopPropagation))
                                                 (f e)))
                             o)))))

  (defun select (& body)
    (set (. kamishibai 'front_ele) 'onclick through)
    (set window 'onkeypress through)
    (let ((ele (append-child (. kamishibai 'front_ele) ($mk "div" (obj 'className "select")))))
      (duo body #((o f)
                  (append-child
                    ele
                    ($mk "div" (obj 'className "switch"
                                    'onclick #((e) ($rm ele)
                                                   ((. e 'stopPropagation))
                                                   (f e)))
                               o))))))

  (defun reshow () (eval (now-show)))
  (defun style (& args) (obj 'style (apply obj args)))
`