import {addIn} from './nl.js'
import AlphaChecker from './AlphaChecker.js'

const pixToPar = (ele: HTMLElement, point: {x: number, y: number}): void=> {
  const parent = <HTMLElement>ele.parentElement
  ele.style.left = 100 * point.x / parent.clientWidth + '%'
  ele.style.top  = 100 * point.y / parent.clientHeight + '%'
}

export default class Mover {
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
  mkDragstart (checker: AlphaChecker) {
    const self = this
    return function (this: HTMLElement, e: DragEvent, inloop: boolean): void {
      if (!inloop) for (const ele of [...self.elements].reverse()) (<Function>ele.ondragstart)(e, true)
      else if (!self.target && checker.isOnPixel(e)) {
        this.style.left = this.offsetLeft + 'px'
        this.style.top  = this.offsetTop + 'px'
        this.style.margin = ''
        self.target = {ele: this, start_x: e.pageX - this.offsetLeft, start_y: e.pageY - this.offsetTop}
      }
    }
  }
  mkOnweel (checker: AlphaChecker) {
    const self = this
    return function (this: HTMLElement, e: WheelEvent, inloop: boolean): void {
      if (!inloop) for (const ele of [...self.elements].reverse()) (<Function>ele.onwheel)(e, true)
      else if (checker.isOnPixel(e)) {
        const x = e.deltaY > 0 ? (1/1.1) : 1.1
        const now_parsent = parseInt(this.style.height)
        this.style.height = now_parsent * x + '%'
        e.preventDefault()
      }
    }
  }
  editStart (): void {
    const kms = this.lisp.env.kamishibai
    this.overlaps = [kms.log_ele, kms.front_ele, kms.fukidasi, kms.filter_ele]
    this.overlaps.forEach(ele=> addIn(ele, {style: {pointerEvents: 'none'}}))
    this.elements = <Array<HTMLImageElement>>Array.from(kms.layer_ele.children)
    this.elements.forEach(ele=> {
      const checker = new AlphaChecker(ele)
      addIn(ele, {draggable: true, ondragstart: this.mkDragstart(checker), ondragend, onwheel: this.mkOnweel(checker)})
    })
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
    return eles.map(ele=> `${ele.className} (style 'top "${ele.style.top}" 'left "${ele.style.left}" 'height "${ele.style.height}")`).join('\n')
  }   
}