import { mkEle, appendCss } from './nl.js';
class History {
    constructor() {
        this.history = JSON.parse(localStorage.getItem('history') || '[]');
        this.now = this.history.length;
        window.addEventListener('beforeunload', e => {
            localStorage.setItem('history', JSON.stringify(this.history));
        });
    }
    getBack() {
        if (this.now)
            this.now--;
        return this.history[this.now];
    }
    getNext() {
        if (this.now < this.history.length)
            this.now++;
        return this.history[this.now] || '';
    }
    set(line) {
        if (line.length)
            this.history[this.now] = line;
    }
    next(line) {
        if (line.length) {
            this.history = this.history.filter(l => l !== line);
            this.history.push(line);
        }
        this.now = this.history.length;
    }
}
const stopPropagation = (e) => e.stopPropagation();
class Terminal extends HTMLElement {
    constructor() {
        super();
        this.history = new History();
        this.visible = true;
        this.std_out = mkEle('div', {
            className: 'std_out',
            onmousedown: stopPropagation,
            onmousemove: stopPropagation,
            onmouseup: stopPropagation
        });
        this.std_in = mkEle('textarea', {
            className: 'std_in',
            onmousedown: stopPropagation,
            onmousemove: stopPropagation,
            onmouseup: stopPropagation
        });
        this.hidden_but = mkEle('span', { className: 'hidden_but', textContent: 'hidden' });
        this.onDataAction = (data) => { this.write(data); };
        const shadow = this.attachShadow({ mode: 'open' });
        this.std_out.contentEditable = "true";
        this.std_in.addEventListener('keydown', e => this.keydown(e));
        this.hidden_but.addEventListener('click', e => this.logHidden());
        appendCss(shadow, 'terminal.css');
        shadow.appendChild(this.hidden_but);
        shadow.appendChild(this.std_out);
        shadow.appendChild(this.std_in);
        if (this.visible)
            this.std_in.focus();
    }
    logHidden() {
        this.std_out.classList.toggle('log_hidden');
    }
    keydown(e) {
        e.stopPropagation();
        if (e.keyCode === 38 && e.shiftKey) { // UP
            e.preventDefault();
            this.history.set(this.std_in.value);
            this.std_in.value = this.history.getBack();
        }
        else if (e.keyCode === 40 && e.shiftKey) { // DOWN
            e.preventDefault();
            this.history.set(this.std_in.value);
            this.std_in.value = this.history.getNext();
        }
        else if (e.keyCode === 13 && !e.shiftKey) {
            e.preventDefault();
            if (this.std_in.value === 'exit') {
                this.std_in.value = '';
                this.hide();
            }
            else {
                if ((this.std_in.value.match(/\n/g) || []).length < 10) {
                    this.history.next(this.std_in.value);
                }
                this.onDataAction(this.std_in.value);
            }
        }
    }
    hide() {
        this.visible = !this.visible;
        this.style.display = this.visible ? 'block' : 'none';
        if (this.visible)
            this.std_in.focus();
    }
    logWrite(out) {
        const s_in = mkEle('div', { textContent: this.std_in.value, className: 'in' });
        this.std_in.value = '';
        this.std_out.appendChild(s_in);
        this.std_out.appendChild(out);
        this.std_out.scrollTop = 9999999;
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
        this.std_out.scrollTop = 9999999;
    }
    stdAlert(data) {
        const out = mkEle('div', { textContent: data, className: 'in' });
        this.std_out.appendChild(out);
        this.std_out.scrollTop = 9999999;
    }
    onData(act) {
        this.onDataAction = act;
        return this;
    }
}
customElements.define('n-term', Terminal);
//# sourceMappingURL=terminal.js.map