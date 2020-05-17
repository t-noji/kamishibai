const addIn = (obj, ...args) => (args.forEach(a => a && Object.entries(a).forEach(([k, v]) => v instanceof Object && typeof v !== 'function' && (!Array.isArray(v)) && !(v instanceof HTMLElement)
    ? k in obj
        ? addIn(obj[k], v)
        : addIn(obj[k] = {}, v)
    : obj[k] = v)),
    obj), eleAdd = (ele, ...objs) => (addIn(ele, ...objs), ele), mkEle = (type, ...args) => eleAdd(document.createElement(type), ...args), 
//mix = (...args: any[]): any=> addIn({}, ...args),
duo = (l, f = (x, y, index) => [x, y]) => l.reduce((pre, a, i) => pre.concat(i % 2 ? [] : [f(a, l[i + 1], i / 2)]), []), tee = (std) => (console.log(std), std), teeAll = (...args) => (console.log(...args), args), appendCss = (parent, href) => parent.appendChild(mkEle('link', { rel: 'stylesheet', href }));
const mix = (t, ...u) => addIn({}, t, ...u);
const arrayAllIndexOf = (arr, val) => arr.reduce((indexes, v, i) => v === val ? [...indexes, i] : indexes, []);
const arrayReplace = (arr, val, new_val) => arr.map(v => v === val ? new_val : v);
const arrayReplaceArray = (arr, val, new_vals, index = 0) => arr.map(v => v === val ? new_vals[index++] : v);
const $ARG = Symbol();
/*
type Curryed<T, U extends any[]> = {
  0: T extends typeof $ARG ? [] : [T];
  1: ((...t: U)=> any) extends ((head: infer Head, ...tail: infer Tail)=> any)
      ? T extends typeof $ARG
        ? Curryed<Head, Tail>
        : [T, ...Curryed<Head, Tail>]
      : never
}[U['length'] extends 0 ? 0 : 1]
*/
const curry = (fn, ...args) => (...arg) => fn(...arrayReplaceArray(args, $ARG, arg));
const curry1 = (fn, ...args) => (a) => fn(a, ...args);
const mkPipe = (...fns) => (start) => fns.reduce((mid, fn) => fn(mid), start);
const mkPipeT = (...fns) => (start) => fns.reduce((mid, fn) => fn(mid), start);
const cpipe = (start, ...fns) => mkPipe(...fns.map(fn => Array.isArray(fn) ? fn.includes($ARG) ? curry(fn[0], ...fn.slice(1))
    : curry1(fn[0], ...fn.slice(1))
    : fn))(start);
const cpipeT = (start, ...fns) => mkPipeT(...fns.map(fn => Array.isArray(fn) ? fn.includes($ARG) ? curry(fn[0], ...fn.slice(1))
    : curry1(fn[0], ...fn.slice(1))
    : fn))(start);
const pipeT = (start, ...fns) => mkPipeT(...fns)(start);
export { addIn, eleAdd, mkEle, mix, duo, tee, teeAll, appendCss };
//# sourceMappingURL=nl.js.map