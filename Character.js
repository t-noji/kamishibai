"use strict";
class CharacterElement extends HTMLImageElement {
    constructor() {
        super();
        this.name = '';
        this.image = '';
        this.images = {};
        this.positions = {};
    }
    setImage(name) {
        this.src = this.images[name].src;
        this.image = name;
    }
    getStyle(position) {
        return typeof (position) === 'string' ? this.positions[position].style : position.style;
    }
    setPositions(positions) {
        Object.assign(this, { style: {} });
        Object.assign(this.style, { position: 'absolute', width: 'auto' }, ...positions.map(p => this.getStyle(p)));
    }
    addImage(name, img) {
        this.images[name] = img;
    }
    addPosition(name, style) {
        this.positions[name] = style;
    }
    show(parent, image, ...positions) {
        this.setImage(image);
        this.setPositions(positions);
        parent.appendChild(this);
    }
    init(name, args) {
        this.name = name;
        for (const [key, val] of args)
            if (val instanceof HTMLImageElement)
                this.images[key] = val;
            else
                this.positions[key] = val;
        return this;
    }
}
customElements.define('char-actor', CharacterElement, { extends: 'img' });
//# sourceMappingURL=Character.js.map