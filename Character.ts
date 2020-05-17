type images = {[key: string]: HTMLImageElement}
type style = {style: CSSStyleDeclaration}
type styles = {[key: string]: style}

class CharacterElement extends HTMLImageElement {
  name = ''
  image = ''
  readonly images: images = {}
  readonly positions: styles = {}
  setImage (name: string) {
    this.src = this.images[name].src
    this.image = name
  }
  getStyle (position: string | style) {
    return typeof(position) === 'string' ? this.positions[position].style : position.style
  }
  setPositions (positions: [string | style]) {
    Object.assign(this, {style: {}})
    Object.assign(this.style, {position: 'absolute', width: 'auto'}, ...positions.map(p=> this.getStyle(p)))
  }
  addImage (name: string, img: HTMLImageElement) {
    this.images[name] = img
  }
  addPosition (name: string, style: style) {
    this.positions[name] = style
  }
  show (parent: HTMLElement, image: string, ...positions: [string | style]){
    this.setImage(image)
    this.setPositions(positions)
    parent.appendChild(this)
  }
  init (name: string, args: [[string, HTMLImageElement | style]]) {
    this.name = name
    for (const [key, val] of args)
      if (val instanceof HTMLImageElement) this.images[key] = val
      else this.positions[key] = val
    return this
  }
  constructor () { super() }
}
customElements.define('char-actor', CharacterElement, {extends: 'img'})