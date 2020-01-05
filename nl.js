const addIn = (obj, ...args) => (args.forEach(a => a && Object.entries(a).forEach(([k, v]) => v instanceof Object && typeof v !== 'function' && (!Array.isArray(v)) && !(v instanceof HTMLElement)
    ? k in obj
        ? addIn(obj[k], v)
        : addIn(obj[k] = {}, v)
    : obj[k] = v)),
    obj), eleAdd = (ele, ...objs) => (addIn(ele, ...objs), ele), mkEle = (type, ...args) => eleAdd(document.createElement(type), ...args), mix = (...args) => addIn({}, ...args), duo = (l, f = (x, y, index) => [x, y]) => l.reduce((pre, a, i) => pre.concat(i % 2 ? [] : [f(a, l[i + 1], i / 2)]), []), tee = (std) => (console.log(std), std), teeAll = (...args) => (console.log(...args), args);
export { addIn, eleAdd, mkEle, mix, duo, tee, teeAll };
//# sourceMappingURL=nl.js.map