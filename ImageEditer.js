import { addIn, eleAdd } from './nl.js';
import Movar from './Movar.js';
import { AlphaCheckers } from './AlphaChecker.js';
import mkContextmenu from './Contextmenu.js';
import './Character.js';
const relative_path = location.origin + location.pathname;
const convertURI = (uri) => decodeURI(uri).replace(RegExp('^' + relative_path), '');
export default class ImageEditer {
    constructor(lisp) {
        this.elements = [];
        this.overlaps = [];
        this.lisp = lisp;
    }
    click(ele, e) {
        const env = ele.images;
        const items = Object.keys(env).map(k => ({ name: k, act: () => ele.setImage(k) }));
        mkContextmenu(e, items);
    }
    wheel(ele, e) {
        e.preventDefault();
        const x = e.deltaY > 0 ? (1 / 1.1) : 1.1;
        const now_parsent = parseInt(ele.style.height) || 150;
        ele.style.height = now_parsent * x + '%';
    }
    editStart() {
        const kms = this.lisp.env.kamishibai;
        this.overlaps = [kms.log, kms.front_ele, kms.fukidasi, kms.filter_ele];
        this.overlaps.forEach(ele => addIn(ele, { style: { pointerEvents: 'none' } }));
        this.elements = Array.from(kms.layer_ele.children);
        this.movars = this.elements.map(ele => new Movar(ele, true));
        this.checkers = new AlphaCheckers(this.elements.map((ele, i) => {
            let x = 0;
            return ({ ele,
                click: e => e.pageX === x && this.click(ele, e),
                mousedown: e => (x = e.pageX, this.movars[i].start(e)),
                wheel: e => this.wheel(ele, e) });
        }));
        this.elements.forEach(ele => eleAdd(ele, { onclick: (e) => this.checkers.click(e),
            onmousedown: (e) => this.checkers.mousedown(e),
            onwheel: (e) => this.checkers.wheel(e) }));
    }
    editEnd() {
        this.overlaps.forEach(ele => addIn(ele, { style: { pointerEvents: 'auto' } }));
        this.elements.forEach(ele => addIn(ele, { onclick: undefined, onmousedown: undefined, onwheel: undefined }));
        this.movars.forEach(movar => movar.close());
        this.checkers.close();
        const eles = [...this.elements];
        this.elements = [];
        return eles.map(ele => `(show "${ele.name}" '${ele.image} (style 'top "${ele.style.top}" 'left "${ele.style.left}" 'height "${ele.style.height}"))`).join('\n');
    }
}
//# sourceMappingURL=ImageEditer.js.map