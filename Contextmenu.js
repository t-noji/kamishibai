import { mkEle, eleAdd, appendCss } from './nl.js';
const close = (ele) => document.body.removeChild(ele);
const addItem = (ele, name, act) => {
    const onclick = (e) => { act(); };
    const item = mkEle('div', { textContent: name, onclick, className: 'item' });
    ele.appendChild(item);
};
const addItems = (ele, list) => {
    list.forEach(({ name, act }) => addItem(ele, name, act));
};
export default function mkContextmenu(e, list) {
    const menu = mkEle('div');
    const shadow = menu.attachShadow({ mode: 'open' });
    appendCss(shadow, 'contextmenu.css');
    addItems(shadow, list);
    eleAdd(menu, { style: { left: e.pageX + 'px', top: e.pageY + 'px', display: 'block' } });
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', function clickFn(e) {
        close(menu);
        document.removeEventListener('click', clickFn);
    }), 100);
}
//# sourceMappingURL=Contextmenu.js.map