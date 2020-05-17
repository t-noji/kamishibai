const pixToPar = (ele: HTMLElement, point: {x: number, y: number}): void=> {
  const parent = <HTMLElement>ele.parentElement
  ele.style.left = 100 * point.x / parent.clientWidth + '%'
  ele.style.top  = 100 * point.y / parent.clientHeight + '%'
}

export default class Movar {
  readonly ele: HTMLElement
  target: {start_x: number, start_y: number} | null = null
  readonly start = (e: MouseEvent)=> this.dragstart(e)
  readonly over = (e: MouseEvent)=> this.dragover(e)
  readonly end = (e: MouseEvent)=> this.dragend(e)

  private dragstart (e: MouseEvent): void {
    e.preventDefault()
    this.ele.style.left = this.ele.offsetLeft + 'px'
    this.ele.style.top  = this.ele.offsetTop + 'px'
    this.ele.style.margin = ''
    this.target = {start_x: e.pageX - this.ele.offsetLeft,
                   start_y: e.pageY - this.ele.offsetTop}
  }
  private dragover = (e: MouseEvent)=> {
    e.preventDefault()
    if (!this.target) return
    pixToPar(this.ele, {x: e.pageX - this.target.start_x,
                        y: e.pageY - this.target.start_y})
  }
  private dragend = (e: MouseEvent)=> {
    e.preventDefault()
    this.target = null
  }

  constructor (ele: HTMLElement, no_start_listener?: boolean) {
    this.ele = ele
    if (!no_start_listener) ele.addEventListener('mousedown', this.start)
    ele.parentElement?.addEventListener('mousemove', this.over)
    ele.parentElement?.addEventListener('mouseup', this.end)
    ele.parentElement?.addEventListener('mouseleave', this.end)
  }
  close () {
    this.ele.removeEventListener('mousedown', this.start)
    this.ele.parentElement?.removeEventListener('mousemove', this.over)
    this.ele.parentElement?.removeEventListener('mouseup', this.end)
    this.ele.parentElement?.removeEventListener('mouseleave', this.end)
  }
}