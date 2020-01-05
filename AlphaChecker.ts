class AlphaCheckers {
  private checkers: Array<AlphaChecker>
  constructor (objs: Array<{ele: HTMLImageElement, click: ((e:MouseEvent)=>void) | undefined, dragstart: ((e:DragEvent)=>void) | undefined, wheel: ((e:WheelEvent)=>void) | undefined}>) {
    this.checkers = objs.map(o=> new AlphaChecker(o.ele, o.click, o.dragstart, o.wheel))
  }
  private check (e: MouseEvent): AlphaChecker | undefined {
    return [...this.checkers].reverse().find(c=> c.isOnPixel(e))
  }
  click (e: MouseEvent) { this.check(e)?.click(e) }
  dragstart (e: DragEvent) { this.check(e)?.dragstart(e) }
  wheel (e: WheelEvent) { this.check(e)?.wheel(e) }
}

class AlphaChecker {
  img: HTMLImageElement
  private width: number = 0
  private context: CanvasRenderingContext2D
  private imageData!: ImageData
  click: (e: MouseEvent)=> void
  dragstart: (e: DragEvent)=> void
  wheel: (e: WheelEvent)=>void
  constructor (img: HTMLImageElement, click= (e:MouseEvent)=>{}, dragstart= (e:DragEvent)=>{}, wheel= (e:WheelEvent)=>{}) {
    this.img = img
    this.click = click
    this.dragstart = dragstart
    this.wheel = wheel
	  const canvas = document.createElement('canvas')
	  const context = canvas.getContext('2d')
    if (!context) throw Error('Canvas Error!')
	  this.context = context
	  this.reflesh()
  }

  reflesh () {
    const style = getComputedStyle(this.img, '')
    this.width  = parseInt(style.width)
    const height = parseInt(style.height)
    this.context.canvas.width = this.width
	  this.context.canvas.height = height
    this.context.drawImage(this.img, 0, 0, this.width, height)
    this.imageData = this.context.getImageData(0, 0, this.width, height)
  }

  isOnPixel (event: MouseEvent): boolean {
    const style = getComputedStyle(this.img, '')
    if (parseInt(style.width) !== this.width) this.reflesh()
    const rect = this.img.getBoundingClientRect()
	  const coords = {x: Math.floor(event.clientX - rect.left), y: Math.floor(event.clientY - rect.top)}
	  if (coords.x < 0 || coords.x > parseInt(style.width) ||
	      coords.y < 0 || coords.y > parseInt(style.height)) return false
    const alpha_p = (coords.x + coords.y * this.width) * 4 + 3
    const alpha = this.imageData.data[alpha_p]
    return alpha >= 8
  }
}
export {AlphaChecker, AlphaCheckers}