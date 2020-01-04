export default class AlphaChecer {
    constructor(img) {
        this.width = 0;
        this.img = img;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context)
            throw Error('Canvas Error!');
        this.context = context;
        this.reflesh();
    }
    reflesh() {
        const style = getComputedStyle(this.img, '');
        this.width = parseInt(style.width);
        const height = parseInt(style.height);
        this.context.canvas.width = this.width;
        this.context.canvas.height = height;
        this.context.drawImage(this.img, 0, 0, this.width, height);
        this.imageData = this.context.getImageData(0, 0, this.width, height);
    }
    isOnPixel(event) {
        const style = getComputedStyle(this.img, '');
        if (parseInt(style.width) !== this.width)
            this.reflesh();
        const rect = this.img.getBoundingClientRect();
        const coords = { x: Math.floor(event.clientX - rect.left), y: Math.floor(event.clientY - rect.top) };
        if (coords.x < 0 || coords.x > parseInt(style.width) ||
            coords.y < 0 || coords.y > parseInt(style.height))
            return false;
        const alpha_p = (coords.x + coords.y * this.width) * 4 + 3;
        const alpha = this.imageData.data[alpha_p];
        return alpha >= 8;
    }
}
//# sourceMappingURL=AlphaChecker.js.map