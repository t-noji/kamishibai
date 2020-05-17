import {mkEle, appendCss} from './nl.js'

class History {
  private history = <string[]>JSON.parse(localStorage.getItem('history') || '[]')
  private now = this.history.length
  constructor () {
    window.addEventListener('beforeunload', e=> {
      localStorage.setItem('history', JSON.stringify(this.history))
    })
  }
  getBack () {
    if (this.now) this.now--
    return this.history[this.now]
  }
  getNext () {
    if (this.now < this.history.length) this.now++
    return this.history[this.now] || ''
  }
  set (line: string) {
    if (line.length) this.history[this.now] = line
  }
  next (line: string) {
    if (line.length) {
      this.history = this.history.filter(l=> l !== line)
      this.history.push(line)
    }
    this.now = this.history.length
  }
}

const stopPropagation = (e: MouseEvent)=> e.stopPropagation()

class Terminal extends HTMLElement {
  private readonly history = new History()
  private visible = true
  private readonly std_out = mkEle('div', {
    className: 'std_out',
    onmousedown: stopPropagation,
    onmousemove: stopPropagation,
    onmouseup: stopPropagation
  })
  private readonly std_in = mkEle('textarea', {
    className: 'std_in',
    onmousedown: stopPropagation,
    onmousemove: stopPropagation,
    onmouseup: stopPropagation
  })
  private readonly hidden_but = mkEle('span', {className: 'hidden_but', textContent: 'hidden'})
  private onDataAction = (data: string): void=> { this.write(data) }
  constructor () {
    super()
    const shadow = this.attachShadow({mode: 'open'})
    this.std_out.contentEditable = "true"
    this.std_in.addEventListener('keydown', e=> this.keydown(e))
    this.hidden_but.addEventListener('click', e=> this.logHidden())
    appendCss(shadow, 'terminal.css')
    shadow.appendChild(this.hidden_but)
    shadow.appendChild(this.std_out)
    shadow.appendChild(this.std_in)
    if (this.visible) this.std_in.focus()
  }
  private logHidden () {
    this.std_out.classList.toggle('log_hidden')
  }
  private keydown (e: KeyboardEvent) {
    e.stopPropagation()
    if (e.keyCode === 38 && e.shiftKey) { // UP
      e.preventDefault()
      this.history.set(this.std_in.value)
      this.std_in.value = this.history.getBack()
    }
    else if (e.keyCode === 40 && e.shiftKey) { // DOWN
      e.preventDefault()
      this.history.set(this.std_in.value)
      this.std_in.value = this.history.getNext()
    }
    else if (e.keyCode === 13 && !e.shiftKey) {
      e.preventDefault()
      if (this.std_in.value === 'exit') {
        this.std_in.value = ''
        this.hide()
      }
      else {
        if ((this.std_in.value.match(/\n/g) || []).length < 10) {
          this.history.next(this.std_in.value)
        }
        this.onDataAction(this.std_in.value)
      }
    }
  }
  hide (): void {
    this.visible = !this.visible
    this.style.display = this.visible ? 'block' : 'none'
    if (this.visible) this.std_in.focus()
  }
  private logWrite (out: Element): void {
    const s_in = mkEle('div', {textContent: this.std_in.value, className: 'in'})
    this.std_in.value = ''
    this.std_out.appendChild(s_in)
    this.std_out.appendChild(out)
    this.std_out.scrollTop = 9999999
  }
  write (data: string): void {
    this.logWrite(mkEle('div', {textContent: data, className: 'out'}))
  }
  errWrite (data: string): void {
    this.logWrite(mkEle('div', {textContent: data, className: 'err'}))
  }
  errAlert (data: string): void {
    const out = mkEle('div', {textContent: data, className: 'err'})
    this.std_out.appendChild(out)
    this.std_out.scrollTop = 9999999
  }
  stdAlert (data: string) {
    const out = mkEle('div', {textContent: data, className: 'in'})
    this.std_out.appendChild(out)
    this.std_out.scrollTop = 9999999
  }
  onData (act: (data: string)=>void) {
    this.onDataAction = act
    return this
  }
}
customElements.define('n-term', Terminal)
