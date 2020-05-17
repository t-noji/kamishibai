const
 addIn = (obj: any, ...args: object[]): any=>
    (args.forEach(a=>
      a && Object.entries(a).forEach(([k, v])=>
        v instanceof Object && typeof v !== 'function' && (!Array.isArray(v)) && !(v instanceof HTMLElement)
          ? k in obj
            ? addIn(obj[k], v)
            : addIn(obj[k] = {}, v)
          : obj[k] = v)),
     obj),
 eleAdd = <E extends HTMLElement>(ele: E, ...objs: object[]): E=> (addIn(ele, ...objs), ele),
 mkEle: {
   <K extends keyof HTMLElementTagNameMap>(type: K, ...args: object[]): HTMLElementTagNameMap[K],
   (type: string, ...args: object[]): HTMLElement
  } = (type: string, ...args: object[])=> eleAdd(document.createElement(type), ...args),
 //mix = (...args: any[]): any=> addIn({}, ...args),
 duo = <T>(l: Array<T>, f=(x: T,y: T, index: number): any=>[x,y]): any =>
  l.reduce((pre,a,i)=> pre.concat(i%2 ? [] : [f(a, l[i+1], i/2)]) , <Array<any>>[]),
 tee = <T>(std: T)=> (console.log(std), std),
 teeAll = <Ts extends any[]>(...args: Ts)=> (console.log(...args), args),
 appendCss = (parent: HTMLElement | ShadowRoot, href: string)=>
  parent.appendChild(mkEle('link', {rel: 'stylesheet', href}))

type Assigned<T, U extends any[]> = {
  0: T;
  1: ((...t: U)=> any) extends ((head: infer Head, ...tail: infer Tail)=> any)
      ? Assigned<Omit<T, keyof Head> & Head, Tail>
      : never
}[U['length'] extends 0 ? 0 : 1]
const mix = <T extends object, U extends any[]>(t: T, ...u: U): Assigned<T, U> => addIn({}, t, ...u)
const arrayAllIndexOf = (arr: any[], val: any) => 
  arr.reduce((indexes: number[], v, i)=> v === val ? [...indexes, i] : indexes, [])
const arrayReplace = (arr: any[], val: any, new_val: any) =>
  arr.map(v=> v === val ? new_val : v)
const arrayReplaceArray = (arr: any[], val: any, new_vals: any[], index = 0) =>
  arr.map(v=> v === val ? new_vals[index++] : v)
const $ARG = Symbol()
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
const curry = <T>(fn: (...arg: any[])=>T, ...args: (any | typeof $ARG)[]) =>
  (...arg: any[]) => fn(...arrayReplaceArray(args, $ARG, arg))
const curry1 = <A1, R, As extends any[]>(fn: (a: A1, ...arg: As)=>R, ...args: As)=>
  (a: A1) => fn(a, ...args)
const mkPipe = (...fns: ((...arg: any[])=>any)[]) =>
  (start: any) => fns.reduce((mid, fn)=> fn(mid), start)
const mkPipeT = <T>(...fns: ((t: T, ...arg: any[])=>T)[]) =>
  (start: T) => fns.reduce((mid, fn)=> fn(mid), start)
const cpipe = (start: any, ...fns: (((...arg: any[])=>any) | [(...arg: any[])=>any, ...any[]])[]) =>
  mkPipe(...fns.map(fn=>
    Array.isArray(fn) ? fn.includes($ARG) ? curry (fn[0], ...fn.slice(1))
                                          : curry1(fn[0], ...fn.slice(1))
                      : fn)
  )(start)
const cpipeT = <T>(start: T, ...fns: (((t: T, ...arg: any[])=>T) | [(t: T, ...arg: any[])=>T, ...any[]])[]) =>
  mkPipeT(...fns.map(fn=>
    Array.isArray(fn) ? fn.includes($ARG) ? curry (fn[0], ...fn.slice(1))
                                          : curry1(fn[0], ...fn.slice(1))
                      : fn)
  )(start)
const pipeT = <T>(start: T, ...fns: ((t: T, ...arg: any[])=>T)[]) =>
  mkPipeT(...fns)(start)
export {addIn, eleAdd, mkEle, mix, duo, tee, teeAll, appendCss}