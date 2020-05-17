import {mkEle, eleAdd, appendCss} from './nl.js'
const close = (ele: HTMLElement)=> document.body.removeChild(ele)
const addItem = (ele: ShadowRoot, name: string, act: () => void): void=> {
  const onclick = (e: MouseEvent): void=> { act() }
  const item = mkEle('div', {textContent: name, onclick, className: 'item'})
  ele.appendChild(item)
}
const addItems = (ele: ShadowRoot, list: {name: string, act: ()=> void}[]): void=> {
  list.forEach(({name, act})=> addItem(ele, name, act))
}
export default function mkContextmenu (e: MouseEvent, list: {name: string, act: ()=> void}[]) {
  const menu = mkEle('div')
  const shadow =  menu.attachShadow({mode: 'open'})
  appendCss(shadow, 'contextmenu.css')
  addItems(shadow, list)
  eleAdd(menu, {style: {left: e.pageX + 'px', top: e.pageY + 'px', display: 'block'}})
  document.body.appendChild(menu)
  setTimeout(()=> document.addEventListener('click', function clickFn (e) {
    close(menu)
    document.removeEventListener('click', clickFn)
  }), 100)
}