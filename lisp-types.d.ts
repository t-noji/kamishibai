type Lisp_ = {
  env: {[key: string]: any},
  macro: {[key: string]: (...args: any[])=>any},
  reader_macro: ((str: string)=>string)[],
  exec: (body: string)=>any
}
declare module 'lisp.js' {
  type Lisp = Lisp_
  function mkLisp (): Lisp
}
declare module 'kamishibai.js' {
  type Lisp = Lisp_
  function kamishibai(parent: HTMLElement, lisp: Lisp): Lisp
}