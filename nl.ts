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
 mkEle = (type: string, ...args: object[]): HTMLElement=> eleAdd(document.createElement(type), ...args),
 mix = (...args: any[]): any=> addIn({}, ...args),
 duo = <T>(l: Array<T>, f=(x: T,y: T, index: number): any=>[x,y]): any =>
  l.reduce((pre,a,i)=> pre.concat(i%2 ? [] : [f(a, l[i+1], i/2)]) , <Array<any>>[]),
 tee = <T>(std: T)=> (console.log(std), std),
 teeAll = <Ts extends any[]>(...args: Ts)=> (console.log(...args), args)

export {addIn, eleAdd, mkEle, mix, duo, tee, teeAll}