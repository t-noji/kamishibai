import { addIn } from './nl.js';
import AlphaChecker from './AlphaChecker.js';
const pixToPar = (ele, point) => {
    const parent = ele.parentElement;
    ele.style.left = 100 * point.x / parent.clientWidth + '%';
    ele.style.top = 100 * point.y / parent.clientHeight + '%';
};
export default class Mover {
    constructor(lisp) {
        this.elements = [];
        this.overlaps = [];
        this.target = null;
        this.ondragover = (e) => {
            if (!this.target)
                return;
            pixToPar(this.target.ele, { x: e.pageX - this.target.start_x,
                y: e.pageY - this.target.start_y });
        };
        this.ondragend = (e) => { this.target = null; };
        this.lisp = lisp;
    }
    mkDragstart(checker) {
        const self = this;
        return function (e, inloop) {
            if (!inloop)
                for (const ele of [...self.elements].reverse())
                    ele.ondragstart(e, true);
            else if (!self.target && checker.isOnPixel(e)) {
                this.style.left = this.offsetLeft + 'px';
                this.style.top = this.offsetTop + 'px';
                this.style.margin = '';
                self.target = { ele: this, start_x: e.pageX - this.offsetLeft, start_y: e.pageY - this.offsetTop };
            }
        };
    }
    mkOnweel(checker) {
        const self = this;
        return function (e, inloop) {
            if (!inloop)
                for (const ele of [...self.elements].reverse())
                    ele.onwheel(e, true);
            else if (checker.isOnPixel(e)) {
                const x = e.deltaY > 0 ? (1 / 1.1) : 1.1;
                const now_parsent = parseInt(this.style.height);
                this.style.height = now_parsent * x + '%';
                e.preventDefault();
            }
        };
    }
    editStart() {
        const kms = this.lisp.env.kamishibai;
        this.overlaps = [kms.log_ele, kms.front_ele, kms.fukidasi, kms.filter_ele];
        this.overlaps.forEach(ele => addIn(ele, { style: { pointerEvents: 'none' } }));
        this.elements = Array.from(kms.layer_ele.children);
        this.elements.forEach(ele => {
            const checker = new AlphaChecker(ele);
            addIn(ele, { draggable: true, ondragstart: this.mkDragstart(checker), ondragend, onwheel: this.mkOnweel(checker) });
        });
        kms.layer_ele.addEventListener('dragover', this.ondragover);
        kms.layer_ele.addEventListener('dragend', this.ondragend);
    }
    editEnd() {
        this.overlaps.forEach(ele => addIn(ele, { style: { pointerEvents: 'auto' } }));
        this.elements.forEach(ele => addIn(ele, { draggable: undefined, ondragstart: undefined, onwheel: undefined }));
        const eles = [...this.elements];
        this.elements = [];
        this.lisp.env.kamishibai.layer_ele.removeEventListener('dragover', this.ondragover);
        this.lisp.env.kamishibai.layer_ele.removeEventListener('dragend', this.ondragend);
        return eles.map(ele => `${ele.className} (style 'top "${ele.style.top}" 'left "${ele.style.left}" 'height "${ele.style.height}")`).join('\n');
    }
}
//# sourceMappingURL=Movar.js.map