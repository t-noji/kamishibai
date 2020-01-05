import {eleAdd} from './nl.js'
const close = (ele: HTMLElement)=> document.body.removeChild(ele)
const addItem = (ele: HTMLElement, name: string, act: () => void): void=> {
  const onclick = (e: MouseEvent): void=> { act() }
  const item = eleAdd(document.createElement('div'), {textContent: name, onclick, className: 'item'})
  ele.appendChild(item)
}
const addItems = (ele: HTMLElement, list: {name: string, act: ()=> void}[]): void=> {
  list.forEach(({name, act})=> addItem(ele, name, act))
}
export default function mkContextmenu (e: MouseEvent, list: {name: string, act: ()=> void}[]) {
  const menu = eleAdd(document.createElement('div'), {className: 'contextmenu'})
  addItems(menu, list)
  eleAdd(menu, {style: {left: e.pageX + 'px', top: e.pageY + 'px', display: 'block'}})
  document.body.appendChild(menu)
  setTimeout(()=> document.addEventListener('click', function clickFn (e) {
    close(menu)
    document.removeEventListener('click', clickFn)
  }), 100)
}