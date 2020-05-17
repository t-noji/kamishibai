class AlphaCheckers {
    constructor(objs) {
        this.checkers = objs.map(o => new AlphaChecker(o.ele, o.click, o.mousedown, o.dragstart, o.wheel));
    }
    check(e) {
        return [...this.checkers].reverse().find(c => c.isOnPixel(e));
    }
    click(e) { var _a; (_a = this.check(e)) === null || _a === void 0 ? void 0 : _a.click(e); }
    mousedown(e) { var _a; (_a = this.check(e)) === null || _a === void 0 ? void 0 : _a.mousedown(e); }
    dragstart(e) { var _a; (_a = this.check(e)) === null || _a === void 0 ? void 0 : _a.dragstart(e); }
    wheel(e) { var _a; (_a = this.check(e)) === null || _a === void 0 ? void 0 : _a.wheel(e); }
    close() {
        for (const checker of this.checkers)
            checker.close();
    }
}
const imageDataToAlphaArray = (idata) => {
    const len = idata.width * idata.height;
    const start = performance.now();
    const alpha = new Uint8Array(len >> 3);
    for (let i = 0; i < len; i++) {
        const byte = idata.data[i * 4 + 3];
        //const bit0 = byte >>7 // if bit128 is 1 ->   1
        //const bit1 = byte >>6 // if bit64  is 1 ->  x1
        //const bit2 = byte >>5 // if bit32  is 1 -> xx1
        //const bit = (bit0 | bit1 | bit2) & 1
        const bit = byte > 31 ? 1 : 0;
        const shift = 7 - i & 7;
        const flagbit = bit << shift;
        alpha[i >> 3] |= flagbit;
        //alpha[i] = idata.data[i * 4 + 3]
    }
    console.log(`time: ${performance.now() - start}ms`);
    return alpha;
};
/*
const imageDataToAlphaArrayMulti = (()=> {
  const thread_size = 4
  const workers = Array.from({length: thread_size}).map(()=>
         new Worker('worker/imageDataToAlphaArrayWorkerWasm.js'))
  let id = 0
  return async (idata: ImageData) => {
    const len = idata.width * idata.height
    const thread_len_draft = Math.floor(len / thread_size)
    const minus8 = thread_len_draft % 8
    const thread_len = thread_len_draft - minus8
    const threads = workers.map((worker, i)=>
      new Promise<Uint8Array>(resolve => {
        const length = (i + 1 ===  thread_size) ? thread_len + i * minus8
                                                : thread_len
        const uint8 = new Uint8Array(idata.data, i * thread_len, length)
        const w_id = id++
        const getResult = (e: MessageEvent) => {
          const [id, alpha] = <[number,Uint8Array]>e.data
          if (id === w_id) {
            resolve(alpha)
            worker.removeEventListener('message', getResult)
          }
        }
        worker.addEventListener('message', getResult)
        worker.postMessage([w_id, uint8], [uint8.buffer])
      }))
    const alphas = await Promise.all(threads)
    const alpha_all = new Uint8Array(alphas.reduce((sum, a)=> sum + a.length, 0))
    alphas.forEach((alpha, i)=> alpha_all.set(alpha, i * thread_len >>1))
    return alpha_all
  }
})()*/
const alphaArrayGetPoint = (alphas, point) => {
    if (!alphas.length)
        return false;
    const alpha = alphas[point >> 3];
    const shift = 7 - point % 8;
    return Boolean(alpha >> shift & 1);
};
class AlphaChecker {
    constructor(img, click = (e) => { }, mousedown = (e) => { }, dragstart = (e) => { }, wheel = (e) => { }) {
        this.width = 0;
        this.img = img;
        this.click = click;
        this.dragstart = dragstart;
        this.mousedown = mousedown;
        this.wheel = wheel;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context)
            throw Error('Canvas Error!');
        this.context = context;
        this.reflesh();
        this.observer = new ResizeObserver(entries => this.reflesh());
        this.observer.observe(img);
        this.imgOnload = (e) => this.reflesh();
        img.addEventListener('load', this.imgOnload);
    }
    close() {
        this.img.removeEventListener('load', this.imgOnload);
        this.observer.disconnect();
    }
    /*async*/ reflesh() {
        const style = getComputedStyle(this.img, '');
        this.width = parseInt(style.width);
        const height = parseInt(style.height);
        const half_width = this.width >> 1;
        const half_height = height >> 1;
        this.context.canvas.width = half_width;
        this.context.canvas.height = half_height;
        this.context.drawImage(this.img, 0, 0, half_width, half_height);
        const imageData = this.context.getImageData(0, 0, half_width, half_height);
        //this.alphaArray = await imageDataToAlphaArrayMulti(imageData)
        this.alphaArray = imageDataToAlphaArray(imageData);
        this.context.canvas.width = 0;
        this.context.canvas.height = 0;
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
        const point = (coords.x >> 1) + (coords.y >> 1) * (this.width >> 1);
        //const alpha = this.alphaArray[point]
        const alpha = alphaArrayGetPoint(this.alphaArray, point);
        return alpha; //>= 8
    }
}
export { AlphaChecker, AlphaCheckers };
//# sourceMappingURL=AlphaChecker.js.map