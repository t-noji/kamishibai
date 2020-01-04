import {mkEle} from './nl.js'

class Terminal {
  private visible = true
  private std_out = <HTMLDivElement> mkEle('div', {className: 'std_out'})
  private term_ele = <HTMLDivElement> mkEle('div', {className: 'terminal'})
  private std_in = <HTMLTextAreaElement> mkEle('textarea', {className: 'std_in'})
  private onDataAction = (data: string): void=> { this.write(data) }
  constructor () {
    this.term_ele.appendChild(this.std_out)
    this.term_ele.appendChild(this.std_in)
    this.std_in.addEventListener('keydown', e=>
      (e.stopPropagation(),
      e.keyCode === 13 && (
        e.preventDefault(),
        this.onDataAction(this.std_in.value))))
  }
  setParent (parent: Element): void { parent.appendChild(this.term_ele) }
  hidden (): void {
    this.visible = !this.visible
    this.term_ele.style.display = this.visible ? 'block' : 'none'
  }
  private logWrite (out: Element): void {
    const s_in = mkEle('div', {textContent: this.std_in.value, className: 'in'})
    this.std_in.value = ''
    this.std_out.appendChild(s_in)
    this.std_out.appendChild(out)
    this.std_out.scrollTop = 999999
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
    this.std_out.scrollTop = 999999
  }
  stdAlert (data: string) {
    const out = mkEle('div', {textContent: data, className: 'in'})
    this.std_out.appendChild(out)
    this.std_out.scrollTop = 999999
  }
  onData (act: (data: string)=>void): void {
    this.onDataAction = act
  }
}

export const mkLispTerminal = (parent: Element, lisp: any): Terminal=> {
  const term = new Terminal()
  term.onData(data=> {
    try { term.write(lisp.exec(data)) }
    catch (e) { term.errWrite(e.toString()) }
  })
  term.setParent(parent)
  return term
}