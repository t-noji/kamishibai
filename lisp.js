import {addIn, mix, duo} from './nl.js'

const
  even = n=> !(n%2),
  odd = n=> n%2,
  kv2obj = (keys, values, ori={})=>
    keys.reduce((pre,key,i)=>(pre[key] = values[i], pre), ori),
  typeOf = x=>
    x === null            ? 'null':
    x === undefined       ? 'undefined':
    typeof x === 'object' ? x.constructor.name
                            || Object.prototype.toString.call(x).slice(8, -1):
                            typeof x,
  isArray = a=> Array.isArray(a),
  isObject = (o,t)=>(t= typeof o, o !== null && (t === 'object' || t === 'function')), 
  _try = (t,c,f)=>{
    let tmp = undefined
    try { return tmp = t() } catch (e) { tmp = c && c(e) } finally { f && f() }
  },
  valueFreeze = obj=>
    Object.keys(obj).reduce((o,k)=>
      (o[k] = {value: obj[k], writable: false,
               enumerable: true, configurable: false}, o), {}),
  mkValFreezeObj = obj=> Object.create({}, valueFreeze(obj)),
  compose = (fn, ...fs)=> (...args)=> fs.reduce((r,f)=> f(r), fn(...args)),
  conjoin = (...fs)=> a=> fs.every(f=> f(a)),
  disjoin = (...fs)=> a=> fs.some(f=> f(a)),
  protoDigSetter = (o,p,v)=>
      o.hasOwnProperty(p) ?
        (o[p] = v) : protoDigSetter(Object.getPrototypeOf(o),p,v),
  keys = o=> Object.keys(o),
  inkeys = o=> {
    const keys = []
    for (const key in o) keys.push(key)
    return keys
  },
  digger = (obj, fn)=>
    (isObject(obj) ? keys(obj).length : obj.length) === 0 ?
      fn(obj) : keys(obj).reduce((r,k)=>
        (r[k] = objDigger(obj[k]), r), isArray(obj) ? [] : {}),
  isNativeFunc = f=> f.toString().indexOf('[native code]') !== -1

const args2env = (env, names=[], vals=[])=> {
  const slice_index = (names.indexOf('&') +1) || names.length
  const new_env = names.slice(0, slice_index).reduce((pre, name, i)=>
      (name === '&'
        ? pre[names[i+1]] = {value: vals.slice(i), writable: true} // & hoge<-
        : pre[name] = {value: vals[i], writable: true},
       pre),
      {})
  return Object.create(env, new_env)
}
const grobal_base = {
  'window': window,
  t: true,
  'true': true,
  'false': false,
  'undefined': undefined,
  nil: null,
  through: a=> a,
  '+': (x, ...args)=> args.reduce((p,a)=> p + a, x),
  '-': (x, ...args)=> args.reduce((p,a)=> p - a, x),
  '*': (x, ...args)=> args.reduce((p,a)=> p * a, x),
  '/': (x, ...args)=> args.reduce((p,a)=> p / a, x),
  '%': (a,b)=> a%b,
  '>': (a,b)=> a>b,
  '<': (a,b)=> a<b,
  'not': a=>!a,
  '=': (a,b)=> a===b,
  '>=': (a,b)=> a>=b,
  '<=': (a,b)=> a<=b,
  '!=': (a,b)=> a!==b,
  'in': (a,b)=> a in b,
  list: (...a)=> a,
  'make-array': (obj, fn)=>
    Array.from(Number.isInteger(obj)? {length: obj} : obj, fn),
  imlist: (...a)=> Object.freeze(a),
  string: String,
  'add-in': addIn,
  first: a=> a[0],
  second: a=> a[1],
  third: a=> a[2],
  nth: (obj, ...path)=> path.reduce((o,p)=> o && o[p] &&
                              (isNativeFunc(o[p]) ? o[p].bind(o) : o[p]), obj),
  set: (obj, ...args)=>{
    const value = args[args.length -1]
    const path = args.slice(0,-1)
    return path.slice(0,-1).reduce(
      (o,p)=> p in o ? o[p] : o[p] = {}, obj
    )[path[path.length -1]] = value
  },
  '.': (...args)=> grobal_base.nth(...args),
  get: (...args)=> grobal_base.nth(...args),
  'mix-kv': (o,k,v)=> Object.assign(o, {[k]: v}),
  even: even,
  odd: odd,
  mix: mix,
  duo: duo,
  apply: (f,b)=> f(...b),
  append: (...args)=> [].concat(...args),
  log: a=> (console.log(a), a),
  length: l=> l.length,
  slice: (...args)=> Array.prototype.slice.call(...args),
  obj: (...args)=> duo(args).reduce((pre,a)=> (pre[a[0]] = a[1], pre), {}),
  imobj: (...args)=> Object.freeze(grobal_base.obj(...args)),
  inheritance: (...args)=> Object.create(...args),
  'typeof': typeOf,
  'is-object': isObject,
  keys: keys,
  values: o=> Object.values(o),
  entries: o=> Object.entries(o),
  'is-array': isArray,
  reduce: (f,a, ...b)=> Array.prototype.reduce.call(a,f, ...b),
  map: (f,a)=> Array.prototype.map.call(a,f),
  each: (f,a)=> Array.prototype.forEach.call(a,f),
  filter: (f,a)=> Array.prototype.filter.call(a,f),
  some: (f,a)=> Array.prototype.some.call(a,f),
  every: (f,a)=> Array.prototype.every.call(a,f),
  find: (f,a)=> Array.prototype.find.call(a,f),
  'find-index': (f,a)=> Array.prototype.findIndex.call(a,f),
  join: (a,s)=> a.join(s),
  regexp: (str, op)=> new RegExp(str, op),
  'try': _try,
  compose: compose,
  conjoin: conjoin,
  disjoin: disjoin,
  'set-timeout': (fn, time)=> setTimeout(fn, time),
  pipef: (first, ...args)=> args.reduce((pre,f)=>
    Array.isArray(f) ? f[0](pre, ...f.slice(1)) : f(pre), first),
  '-chainf': (first, ...args)=> args.reduce((pre,m)=>
    Array.isArray(m) ? pre[m[0]](...m.slice(1)) : pre[m](), first)
}
const macro_base = {
  backquote: (()=>{
    const lflat = (l, key, f=x=>x)=>
      l.indexOf(key) === -1
        ? ['list', ...l.map(f)]
        : ['append', ...l.map((i,index)=>
            i === key
              ? false
              : l[index -1] === key
                ? i
                : ['list', f(i)])].filter(Boolean)
    const bq = s=>
       !Array.isArray(s)
         ? typeof s === 'string' && s !== '@'
           ? ['quote', s]
           : s
         : s.length === 0
           ? ['quote', []]
           : s[0] === 'unquote'
             ? s.length === 2
               ? s[1]
               : s.slice(1)
             : lflat(s, '@', bq)
    return (...args)=>
      args.length === 1
        ? ['quote', args[0]]
        : lflat(args, '@', bq)
  })()
}

export const mkLisp = ()=> {
/*{
  env, // lisp内で利用可能な関数リスト
  macro,  // lisp内で利用可能なマクロリスト
  reader_macro, // リーダマクロリスト
  exec // (String body)=>result / lisp実行用関数
}*/

const n_list = mkValFreezeObj(Object.assign({
  load (url) {
    if (!XMLHttpRequest) return str=> str
    const xhr = new XMLHttpRequest()
    xhr.open('GET', url, false) // sync //
    xhr.onload = ()=> xhr.status === 200 && exec(xhr.responseText)
    xhr.send()
  },
  'async-load' (url) {
    if (!XMLHttpRequest) return str=> str
    const xhr = new XMLHttpRequest()
    xhr.open('GET', url, true) // sync //
    xhr.onload = ()=> xhr.status === 200 && exec(xhr.responseText)
    xhr.send()
  },
  getGrobal: ()=> n_list
}, grobal_base))

const macro = mkValFreezeObj(Object.assign({
  defmacro (name, namelist, body) {
    this[name] = (...args)=>
      macroexpand(exe(args2env(n_list, namelist, args), body))
    return ['undefined']
  }
}, macro_base))

const
  macroexpand = b=> // ((a 1)) 
    !Array.isArray(b) || b.length === 0
      ? b
      : b[0] in macro
        ? macro[b[0]](... b.slice(1).map(macroexpand))
        : b.map(macroexpand)

const
  found = (env, str)=>{
    if (typeof str === 'function') return str
    if (!(str in env)) throw new Error(`無いよ: ${str} in [${inkeys(env)}]`)
    return env[str] && (env[str]['bind']
                          ? env[str].bind(env)
                          : env[str])
  },
  exe = (env, b)=>
    !Array.isArray(b)
      ? typeof b === 'string'
        ? found(env,b)
        : b
      : b[0] in special
          ? special[b[0]](env, ... b.slice(1))
          : (()=>{
              const f = (Array.isArray(b[0]) ? exe: found)(env, b[0])
              if (typeof f !== 'function') 
                throw new Error(`関数じゃないよ:${b[0]} from [${b}]`)
              else return f(... b.slice(1).map(b=> exe(env,b)))
            })()

// 特殊式
const special = Object.freeze({
  progn: (env, ...body)=> body.map((b)=>exe(env, b))[body.length - 1],
  eval: (env,body)=> special.progn(env, ...macroexpand(exe(env,body))),
  'if': (env,flag, tbody, fbody=[])=> exe(env, exe(env,flag) ? tbody : fbody),
  and: (env,a,b)=> exe(env,a) && exe(env,b),
  or:  (env,a,b)=> exe(env,a) || exe(env,b),
  cond: (env, ...args)=>
    (tmp=> (args.some(a=> exe(env,a[0]) && (tmp= exe(env,a[1]), true))
           ,tmp))(),
  lambda: (env, names, ...body)=>
    Object.assign((...args)=> special.progn(args2env(env, names, args), ...body),
                  {toString: ()=> `${names}-> `+ JSON.stringify(body)}),
  def: (env, ...arg)=>
    arg.forEach((a,i)=> !(i%2) && (n_list[a] = exe(env, arg[i+1]))),
  'let': (env, na, ...body)=>
      special.lambda(env, na.map(a=>a[0]), ...body)
        (...na.map(a=> exe(env, a[a.length -1]))),
  setq: (env, cobj, body)=> protoDigSetter(env, cobj, exe(env, body)),
  //'var': (env, name, body)=> env[name] = exe(env, body),
  quote: (env, ...s)=> s.length === 1 ? s[0] : s,
  str: (env, ...arg)=> String(...arg),
  'undefined': (env)=> undefined
})

// 評価
const
  search = (str, regex, l = [], count = -1, i = str.search(regex))=>
    i === -1
      ? l
      : search(str.slice(i + 1), regex, l.concat([[count + i + 1, str[i]]]), count + i + 1),
  allIndexOf = (str, val, is = [], i = 0)=>{
    while (i++ < str.length) if (str[i] === val) is.push(i)
    return is
  },
  escOne = (str, key, inFn =s=>s, outFn =s=>s)=>{
    const l = [-1, ...allIndexOf(str, '"')]
    return l.reduce((p,c,i)=> p + (i % 2 ? inFn : outFn)(str.slice(c + 1, l[i + 1])), '')
  },
  readerFirstMacroK = (marker,macro)=>
    str=> str.replace(RegExp(`${marker}\\(`, 'g'), `(${macro} `),
  readerFirstMacro = (marker,macro)=>
    str=> readerFirstMacroK(marker,macro)(str)
         .replace(RegExp(`${marker}(\\S+)`, 'g'), `(${macro} $1)`)

const in_reader_macro = [
  readerFirstMacro("'", 'quote'),
  readerFirstMacro('`', 'backquote'),
  s=> s.replace(/,@/g, '@ '), 
  s=> s.replace(/{/g, '(obj ').replace(/}/g, ')')
       .replace(/(\S+):/g, "(str $1)"),
  readerFirstMacro(',', 'unquote'),
  readerFirstMacroK('#', 'lambda'),
  //readerFirstMacroK('o', 'obj'),
  //readerFirstMacroK('f', 'lambda')
]
const reader_macros = []

const exec = str=>{
  const change = str=>
         in_reader_macro.reduce((p,f)=> f(p), str)
            .replace(/;.*$/gm, '') // commentout
            .replace(/\)\s+\(/g, '),(')
            .replace(/\(/g, '[')
            .replace(/\)/g, ']')
            .replace(/\s+/g, ',')
            .replace(/,+/g, ',')
            .replace(/(?!-?[\d\.]+)(?=[^\d,\[\]])[^,\[\]]*/g, '"$&"') //symbol
            //.replace(/(?<=[\[\],]+)\.(?=[\[\],]+)/g, '"."') // . symbol
            .replace(/[\[\],]+\.(?=[\[\],]+)/g, s=> s.slice(0,-1) +'"."') // . symbol
            .replace(/,+]/g, ']')
  const
   str_rmdo = reader_macros.reduce((p,f)=> f(p), str),
   str_esc_str = escOne(str_rmdo, /"/, s=>`["str","${s}"]`, change),
   json = str_esc_str.replace(/^,*/, '')
                     .replace(/,*$/, '')
  console.log('json:', json)
  const c_json = `[${json}]`
  let jp
  try { jp = JSON.parse(c_json) }
  catch (err) {
    console.error(err.name +': '+ err.message)
    if (/column/.test(err.message)) {
    }
    else {
      const posi = parseInt(err.message.replace(/[^-^0-9^\.]/g, ''))
      const start = posi - 25 < 0 ? 0 : posi - 25
      const end = posi + 25
      console.log(c_json.slice(start, end))
      console.log(' '.repeat(posi - start) + '^')
    }
  }
  const expanded = jp.map(macroexpand)
  console.log('expanded macro:', expanded)
  return special.progn(n_list, ...expanded)
}

// lisp //
exec(`
(defmacro defun (name arglist & body)
  \`(def ,name (lambda ,arglist ,@body)))
(defmacro incf (cobj)
  \`(setq ,cobj (+ ,cobj 1)))
`)

return {
  env: n_list,
  macro,
  reader_macros,
  exec,
}
}
