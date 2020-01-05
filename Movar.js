import { addIn, eleAdd } from './nl.js';
import { AlphaCheckers } from './AlphaChecker.js';
import mkContextmenu from './Contextmenu.js';
const pixToPar = (ele, point) => {
    const parent = ele.parentElement;
    ele.style.left = 100 * point.x / parent.clientWidth + '%';
    ele.style.top = 100 * point.y / parent.clientHeight + '%';
};
const relative_path = location.origin + location.pathname;
const convertURI = (uri) => decodeURI(uri).replace(RegExp('^' + relative_path), '');
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
    click(ele, e) {
        const name = ele.className;
        const env = this.lisp.env[name];
        const items = Object.entries(env).filter(([k, v]) => v.src)
            .map(([k, v]) => ({ name: k, act: () => eleAdd(ele, v) }));
        mkContextmenu(e, items);
    }
    dragstart(ele, e) {
        ele.style.left = ele.offsetLeft + 'px';
        ele.style.top = ele.offsetTop + 'px';
        ele.style.margin = '';
        this.target = { ele, start_x: e.pageX - ele.offsetLeft, start_y: e.pageY - ele.offsetTop };
    }
    wheel(ele, e) {
        const x = e.deltaY > 0 ? (1 / 1.1) : 1.1;
        const now_parsent = parseInt(ele.style.height) || 150;
        ele.style.height = now_parsent * x + '%';
        e.preventDefault();
    }
    editStart() {
        const kms = this.lisp.env.kamishibai;
        this.overlaps = [kms.log_ele, kms.front_ele, kms.fukidasi, kms.filter_ele];
        this.overlaps.forEach(ele => addIn(ele, { style: { pointerEvents: 'none' } }));
        this.elements = Array.from(kms.layer_ele.children);
        this.checkers = new AlphaCheckers(this.elements.map(ele => ({ ele, click: e => this.click(ele, e), dragstart: e => this.dragstart(ele, e), wheel: e => this.wheel(ele, e) })));
        this.elements.forEach(ele => eleAdd(ele, { draggable: true, onclick: (e) => this.checkers.click(e), ondragstart: (e) => this.checkers.dragstart(e), onwheel: (e) => this.checkers.wheel(e) }));
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
        return eles.map(ele => { var _a; return `(show "${ele.className}" (. ${ele.className} '${(_a = Object.entries(this.lisp.env[ele.className]).find(([k, v]) => v.src === convertURI(ele.src))) === null || _a === void 0 ? void 0 : _a[0]}) (style 'top "${ele.style.top}" 'left "${ele.style.left}" 'height "${ele.style.height}"))`; }).join('\n');
    }
}
//# sourceMappingURL=Movar.js.map