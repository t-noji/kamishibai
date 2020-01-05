import {addIn, eleAdd} from './nl.js'
import {AlphaCheckers} from './AlphaChecker.js'
import mkContextmenu from './Contextmenu.js'

const pixToPar = (ele: HTMLElement, point: {x: number, y: number}): void=> {
  const parent = <HTMLElement>ele.parentElement
  ele.style.left = 100 * point.x / parent.clientWidth + '%'
  ele.style.top  = 100 * point.y / parent.clientHeight + '%'
}
const relative_path = location.origin + location.pathname
const convertURI = (uri: string)=> decodeURI(uri).replace(RegExp('^'+ relative_path), '')

export default class Mover {
  private checkers!: AlphaCheckers
  private elements: Array<HTMLImageElement> = []
  private overlaps: Array<HTMLElement> = []
  private lisp: any
  private target: {ele: HTMLElement, start_x: number, start_y: number} | null = null
  private ondragover = (e: DragEvent)=> {
    if (!this.target) return
    pixToPar(this.target.ele, {x: e.pageX - this.target.start_x,
                               y: e.pageY - this.target.start_y})
  }
  private ondragend = (e: DragEvent)=> { this.target = null }
  constructor (lisp: any) { this.lisp = lisp }
  click (ele: HTMLElement, e: MouseEvent) {
    const name = ele.className
    const env = this.lisp.env[name]
    const items = Object.entries(env).filter(([k, v]:[string, any])=> v.src)
                        .map(([k, v]:[string, any])=> ({name: k, act: ()=> eleAdd(ele, v)}))
    mkContextmenu(e, items)
  }
  dragstart (ele: HTMLElement, e: DragEvent): void {
    ele.style.left = ele.offsetLeft + 'px'
    ele.style.top  = ele.offsetTop + 'px'
    ele.style.margin = ''
    this.target = {ele, start_x: e.pageX - ele.offsetLeft, start_y: e.pageY - ele.offsetTop}
  }
  wheel (ele: HTMLElement, e: WheelEvent): void {
    const x = e.deltaY > 0 ? (1/1.1) : 1.1
    const now_parsent = parseInt(ele.style.height) || 150
    ele.style.height = now_parsent * x + '%'
    e.preventDefault()
  }
  editStart (): void {
    const kms = this.lisp.env.kamishibai
    this.overlaps = [kms.log_ele, kms.front_ele, kms.fukidasi, kms.filter_ele]
    this.overlaps.forEach(ele=> addIn(ele, {style: {pointerEvents: 'none'}}))
    this.elements = <Array<HTMLImageElement>>Array.from(kms.layer_ele.children)
    this.checkers = new AlphaCheckers(this.elements.map(ele=> ({ele, click: e=> this.click(ele, e), dragstart: e=> this.dragstart(ele, e), wheel: e=> this.wheel(ele, e)})))
    this.elements.forEach(ele=> eleAdd(ele, {draggable: true, onclick: (e: MouseEvent)=> this.checkers.click(e), ondragstart: (e: DragEvent)=> this.checkers.dragstart(e), onwheel: (e: WheelEvent)=> this.checkers.wheel(e)}))
    kms.layer_ele.addEventListener('dragover', this.ondragover)
    kms.layer_ele.addEventListener('dragend', this.ondragend)
  }
  editEnd (): string {
    this.overlaps.forEach(ele=> addIn(ele, {style: {pointerEvents: 'auto'}}))
    this.elements.forEach(ele=> addIn(ele, {draggable: undefined, ondragstart: undefined, onwheel: undefined}))
    const eles = [...this.elements]
    this.elements = []
    this.lisp.env.kamishibai.layer_ele.removeEventListener('dragover', this.ondragover)
    this.lisp.env.kamishibai.layer_ele.removeEventListener('dragend', this.ondragend)
    return eles.map(ele=> `(show "${ele.className}" (. ${ele.className} '${Object.entries(this.lisp.env[ele.className]).find(([k,v]: [string, any])=> v.src === convertURI(ele.src))?.[0]}) (style 'top "${ele.style.top}" 'left "${ele.style.left}" 'height "${ele.style.height}"))`).join('\n')
  }   
}