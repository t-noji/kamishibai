const pixToPar = (ele, point) => {
    const parent = ele.parentElement;
    ele.style.left = 100 * point.x / parent.clientWidth + '%';
    ele.style.top = 100 * point.y / parent.clientHeight + '%';
};
export default class Movar {
    constructor(ele, no_start_listener) {
        var _a, _b, _c;
        this.target = null;
        this.start = (e) => this.dragstart(e);
        this.over = (e) => this.dragover(e);
        this.end = (e) => this.dragend(e);
        this.dragover = (e) => {
            e.preventDefault();
            if (!this.target)
                return;
            pixToPar(this.ele, { x: e.pageX - this.target.start_x,
                y: e.pageY - this.target.start_y });
        };
        this.dragend = (e) => {
            e.preventDefault();
            this.target = null;
        };
        this.ele = ele;
        if (!no_start_listener)
            ele.addEventListener('mousedown', this.start);
        (_a = ele.parentElement) === null || _a === void 0 ? void 0 : _a.addEventListener('mousemove', this.over);
        (_b = ele.parentElement) === null || _b === void 0 ? void 0 : _b.addEventListener('mouseup', this.end);
        (_c = ele.parentElement) === null || _c === void 0 ? void 0 : _c.addEventListener('mouseleave', this.end);
    }
    dragstart(e) {
        e.preventDefault();
        this.ele.style.left = this.ele.offsetLeft + 'px';
        this.ele.style.top = this.ele.offsetTop + 'px';
        this.ele.style.margin = '';
        this.target = { start_x: e.pageX - this.ele.offsetLeft,
            start_y: e.pageY - this.ele.offsetTop };
    }
    close() {
        var _a, _b, _c;
        this.ele.removeEventListener('mousedown', this.start);
        (_a = this.ele.parentElement) === null || _a === void 0 ? void 0 : _a.removeEventListener('mousemove', this.over);
        (_b = this.ele.parentElement) === null || _b === void 0 ? void 0 : _b.removeEventListener('mouseup', this.end);
        (_c = this.ele.parentElement) === null || _c === void 0 ? void 0 : _c.removeEventListener('mouseleave', this.end);
    }
}
//# sourceMappingURL=Movar.js.map