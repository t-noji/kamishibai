import { mkEle } from './nl.js';
class Terminal {
    constructor() {
        this.visible = true;
        this.std_out = mkEle('div', { className: 'std_out' });
        this.term_ele = mkEle('div', { className: 'terminal' });
        this.std_in = mkEle('textarea', { className: 'std_in' });
        this.onDataAction = (data) => { this.write(data); };
        this.term_ele.appendChild(this.std_out);
        this.term_ele.appendChild(this.std_in);
        this.std_in.addEventListener('keydown', e => (e.stopPropagation(),
            e.keyCode === 13 && !e.shiftKey && (e.preventDefault(),
                this.onDataAction(this.std_in.value))));
    }
    setParent(parent) { parent.appendChild(this.term_ele); }
    hidden() {
        this.visible = !this.visible;
        this.term_ele.style.display = this.visible ? 'block' : 'none';
    }
    logWrite(out) {
        const s_in = mkEle('div', { textContent: this.std_in.value, className: 'in' });
        this.std_in.value = '';
        this.std_out.appendChild(s_in);
        this.std_out.appendChild(out);
        this.std_out.scrollTop = 999999;
    }
    write(data) {
        this.logWrite(mkEle('div', { textContent: data, className: 'out' }));
    }
    errWrite(data) {
        this.logWrite(mkEle('div', { textContent: data, className: 'err' }));
    }
    errAlert(data) {
        const out = mkEle('div', { textContent: data, className: 'err' });
        this.std_out.appendChild(out);
        this.std_out.scrollTop = 999999;
    }
    stdAlert(data) {
        const out = mkEle('div', { textContent: data, className: 'in' });
        this.std_out.appendChild(out);
        this.std_out.scrollTop = 999999;
    }
    onData(act) {
        this.onDataAction = act;
    }
}
export const mkLispTerminal = (parent, lisp) => {
    const term = new Terminal();
    term.onData(data => {
        try {
            term.write(lisp.exec(data));
        }
        catch (e) {
            term.errWrite(e.toString());
        }
    });
    term.setParent(parent);
    return term;
};
//# sourceMappingURL=terminal.js.map