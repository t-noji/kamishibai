import {addIn, eleAdd} from './nl.js'
import Movar from './Movar.js'
import {AlphaCheckers} from './AlphaChecker.js'
import mkContextmenu from './Contextmenu.js'
import './Character.js'

const relative_path = location.origin + location.pathname
const convertURI = (uri: string)=> decodeURI(uri).replace(RegExp('^'+ relative_path), '')

export default class ImageEditer {
  private checkers!: AlphaCheckers
  private movars!: Array<Movar>
  private elements: Array<CharacterElement> = []
  private overlaps: Array<HTMLElement> = []
  private lisp: any
  
  private click (ele: CharacterElement, e: MouseEvent) {
    const env = ele.images
    const items = Object.keys(env).map(k=> ({name: k, act: ()=> ele.setImage(k)}))
    mkContextmenu(e, items)
  }
  private wheel (ele: HTMLElement, e: WheelEvent): void {
    e.preventDefault()
    const x = e.deltaY > 0 ? (1/1.1) : 1.1
    const now_parsent = parseInt(ele.style.height) || 150
    ele.style.height = now_parsent * x + '%'
  }

  constructor (lisp: any) { this.lisp = lisp }
  editStart (): void {
    const kms = this.lisp.env.kamishibai
    this.overlaps = [kms.log, kms.front_ele, kms.fukidasi, kms.filter_ele]
    this.overlaps.forEach(ele=> addIn(ele, {style: {pointerEvents: 'none'}}))
    this.elements = <[CharacterElement]>Array.from(kms.layer_ele.children)
    this.movars = this.elements.map(ele=> new Movar(ele, true))
    this.checkers = new AlphaCheckers(this.elements.map((ele, i)=> {
      let x = 0
      return ({ele,
        click: e=> e.pageX === x && this.click(ele, e),
        mousedown: e=> (x = e.pageX, this.movars[i].start(e)),
        wheel: e=> this.wheel(ele, e)})
    }))
    this.elements.forEach(ele=>
      eleAdd(ele, {onclick: (e: MouseEvent)=> this.checkers.click(e),
                   onmousedown: (e: MouseEvent)=> this.checkers.mousedown(e),
                   onwheel: (e: WheelEvent)=> this.checkers.wheel(e)}))
  }
  editEnd (): string {
    this.overlaps.forEach(ele=> addIn(ele, {style: {pointerEvents: 'auto'}}))
    this.elements.forEach(ele=> addIn(ele, {onclick: undefined, onmousedown: undefined, onwheel: undefined}))
    this.movars.forEach(movar=> movar.close())
    this.checkers.close()
    const eles = [...this.elements]
    this.elements = []
    return eles.map(ele=> `(show "${ele.name}" '${ele.image} (style 'top "${ele.style.top}" 'left "${ele.style.left}" 'height "${ele.style.height}"))`).join('\n')
  }   
}