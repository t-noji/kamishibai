'use strict'
const
  addIn = (obj, ...arg)=>
    (arg.forEach(a=>
      a && Object.keys(a).forEach(k=>
        a[k] instanceof Object && typeof a[k] !== 'function'
          && (!Array.isArray(a[k])) && !(a[k] instanceof HTMLElement)
          ? k in obj
            ? addIn(obj[k], a[k])
            : addIn(obj[k] = {}, a[k])
          : obj[k] = a[k])),
     obj),
  mix = (...args) => addIn({}, ...args),
  addOn = (obj, ...arg)=>
    (arg.forEach(a=>
      a && Object.keys(a).forEach(k=> obj[k] = a[k])),
     obj),
  even = n=> !(n%2),
  odd = n=> n%2,
  duo = (l, f=(x,y,index)=>[x,y])=>
    l.reduce((pre,a,i)=> pre.concat(i%2 ? [] : [f(a, l[i+1], i/2)]) ,[]),
  kv2obj = (keys, values, ori={})=>
    keys.reduce((pre,key,i)=>(pre[key] = values[i], pre), ori),
  typeOf = x=>
    x === null            ? 'null':
    x === undefined       ? 'undefined':
    typeof x === 'object' ? x.constructor.name
                            || Object.prototype.toString.call(x).slice(8, -1):
                            typeof x,
  isObject = (o,t)=>(t= typeof o, o !== null && (t === 'object' || t === 'function')), 
  _try = (t,c,f)=>{
    let tmp = undefined
    try { tmp = t() } catch (e) { tmp = c && c(e) } finally { f && f() }
    return tmp
  },
  valueFreeze = obj=>
    Object.keys(obj).reduce((o,k)=>
      (o[k] = {value: obj[k], writable: false,
               enumerable: true, configurable: false}, o), {})

const {
  n_list, // lisp内で利用可能な関数リスト
  macro,  // lisp内で利用可能なマクロリスト
  reader_macro, // リーダマクロリスト
  exec // (String body)=>result / lisp実行用関数
} = (()=>{

const n_list = Object.create(Object, valueFreeze({
  grobal: this, 'window': this, // this is window or grobal or module
  t: true,
  'true': true,
  'false': false,
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
  imlist: (...a)=> Object.freeze(a),
  string: String,
  'add-in': addIn,
  'add-on': addOn,
  first: a=> a[1],
  second: a=> a[2],
  third: a=> a[3],
  nth: (obj, ...path)=> path.reduce((o,p)=> o && o[p], obj),
  set: (obj, ...args)=>{
    const value = args[args.length -1]
    const path = args.slice(0,-1)
    return path.slice(0,-1).reduce(
      (o,p)=> p in o ? o[p] : o[p] = {}, obj
    )[path[path.length -1]] = value
  },
  '.': (...args)=> n_list.nth(...args),
  'mix-kv': (o,k,v)=> Object.assign(o, {[k]: v}),
  even: even,
  odd: odd,
  mix: mix,
  duo: duo,
  apply: (f,b)=> f(...b),
  append: (...args)=> [].concat(...args),
  log: a=> (console.log(a), a),
  length: l=> l.length,
  obj: (...args)=> duo(args).reduce((pre,a)=> (pre[a[0]] = a[1], pre), {}),
  imobj: (...args)=> Object.freeze(n_list.obj(...args)),
  inheritance: (...args)=> Object.create(...args),
  'typeof': typeOf,
  'is-object': isObject,
  keys: o=> Object.keys(o),
  values: o=> Object.values(o),
  'is-array': a=> Array.isArray(a),
  reduce: (f,a,b)=> Array.prototype.reduce.call(f,a,b),
  map: (f,a)=> Array.prototype.map.call(f,a),
  each: (f,a)=> Array.prototype.forEach.call(f,a),
  filter: (f,a)=> Array.prototype.filter.call(f,a),
  some: (f,a)=> Array.prototype.some.call(f,a),
  every: (f,a)=> Array.prototype.every.call(f,a),
  find: (f,a)=> Array.prototype.find.call(f,a),
  'find-index': (f,a)=> Array.prototype.findIndex.call(f,a),
  join: (a,s)=> a.join(s),
  regexp: (str, op)=> new RegExp(str, op),
  load: url=> {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', url, false) // sync //
    xhr.onload = ()=> xhr.status === 200 && exec(xhr.responseText)
    xhr.send()
  },
  'try': _try
}))

const macro = {
  defmacro: (name, namelist, body)=>{
    macro[name] = (...args)=>
      macroexpand(exe(args2env(n_list, namelist, args), body))
    return ['undefined']
  },
  backquote:
   ((lflat = (l, key, f=x=>x)=>
      l.indexOf(key) === -1
        ? ['list', ...l.map(f)]
        : ['append', ...l.map((i,index)=>
            i === key
              ? false
              : l[index -1] === key
                ? i
                : ['list', f(i)])].filter(Boolean),
     bq = s=>
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
             : lflat(s, '@', bq))=>
    (...args)=>
      args.length === 1
        ? ['quote', args[0]]
        : lflat(args, '@', bq)
  )(),
}

const
  macroexpand = b=> // ((a 1)) 
    !Array.isArray(b) || b.length === 0
      ? b
      : b[0] in macro
        ? macro[b[0]](... b.slice(1).map(macroexpand))
        : b.map(macroexpand),
  found = 
    ((ff= (ss,base)=>
      ss.reduce(
          (o,s)=> s in o && (o[s]["bind"] // inの場合数字などに対応不可
                              ? o[s].bind(o)
                              : o[s]),
          base))=>
      (env,str)=>{
        if (typeof str === 'function') return str
        const ss = str.split('.')
        if (env[ss[0]] === undefined) console.log('無いよ:', str, '環境', env)
        return ff(ss.slice(1), env[ss[0]])
      })(),
  exe = (env,b)=>
    !Array.isArray(b)
      ? typeof b === 'string'
        ? found(env,b)
        : b
      : b[0] in special
          ? special[b[0]](env, ... b.slice(1))
          : ((f= (Array.isArray(b[0])
                   ? exe
                   : found)(env,b[0]))=>
              (typeof f !== 'function'
                 && console.log('関数じゃないよ:', b[0], 'from', b),
               f(... b.slice(1).map(b=>exe(env,b)))))()

const args2env = (env, names=[], vals=[])=>{
  const slice_index = (names.indexOf('&') +1) || names.length
  return Object.create(env,
    names.slice(0, slice_index).reduce((pre,name,i)=>
      (name === '&'
        ? pre[names[i+1]] = {value: vals.slice(i), writable: true} // & hoge<-
        : pre[name] = {value: vals[i], writable: true},
       pre),
      {}))
}

// 特殊式
const special = {
  progn: (env, ...body)=> body.map((b)=>exe(env, b))[body.length - 1],
  eval: (env,body)=> special.progn(env, ...macroexpand(exe(env,body))),
  'if': (env,flag, tbody, fbody=[])=> exe(env, exe(env,flag) ? tbody : fbody),
  and: (env,a,b)=> exe(env,a) && exe(env,b),
  or:  (env,a,b)=> exe(env,a) || exe(env,b),
  cond: (env, ...args)=>
    (tmp=> (args.some(a=> exe(env,a[0]) && (tmp= exe(env,a[1]), true))
           ,tmp))(),
  lambda: (env, names, ...body)=>
    addIn((...args)=> special.progn(args2env(env, names, args), ...body),
          {toString: ()=> `${names}-> `+ JSON.stringify(body)}),
  def: (env, ...arg)=>
    arg.forEach((a,i)=>
      !(i%2) // hit 0 2 4 ...
      && (a.split('.').reduce(
        (pre,s,j,aa)=>
          aa[j+1] ? pre[s] || (pre[s] = {})
                  : pre[s] = exe(env, arg[i+1]),
        n_list))),
  'let': (env, na, ...body)=>
      special.lambda(env, na.map(a=>a[0]), ...body)
        (...na.map(a=> exe(env, a[a.length -1]))),
  setq: (env, cobj, body)=>{
    const path = cobj.split('.')
    const protoDigSetter = (o,p,v)=>
      o.hasOwnProperty(p) ? o[p] = v : protoDigSetter(Object.getPrototypeOf(o),p,v) 
    return path.length ===1 ?
        protoDigSetter(env, [path[0]], exe(env, body))
      : n_list.set(env[path[0]], ...path.slice(1), exe(env, body))
  },
  quote: (env, ...s)=> s.length === 1 ? s[0] : s,
  str: (env, ...arg)=> String(...arg),
  'undefined': (env)=> undefined
}

// 評価
const
  search = (str, regex, count = -1, i)=>
     (i = str.search(regex),
      i === -1
        ? []
        : [[count + i + 1, str[i]]].concat(search(str.slice(i + 1), regex, count + i + 1))),
  escOne = (str, key, inFn =s=>s, outFn =s=>s)=>{
    const l = [-1, ...search(str, /"/).map(x=>x[0])]
    return l.reduce((p,c,i)=>p+ (i % 2 ? inFn : outFn)(str.slice(c+1, l[i+1])), '')
  },
  readerFirstMacroK = (marker,macro)=>
    str=> str.replace(RegExp(`${marker}\\(`, 'g'), `(${macro} `),
  readerFirstMacro = (marker,macro)=>
    str=> readerFirstMacroK(marker,macro)(str)
         .replace(RegExp(`${marker}(\\S+)`, 'g'), `(${macro} $1)`)

const reader_macro = [
  readerFirstMacro("'", 'quote'),
  readerFirstMacro('`', 'backquote'),
  s=> s.replace(/,@/g, '@ '), 
  s=> s.replace(/{/g, '(obj ').replace(/}/g, ')')
       .replace(/(\S+):/g, "(str $1)"),
  readerFirstMacro(',', 'unquote'),
  readerFirstMacroK('#', 'lambda'),
  readerFirstMacroK('o', 'obj'),
  readerFirstMacroK('f', 'lambda')
]

const exec = str=>{
  const change = str=>
         reader_macro.reduce((p,f)=> f(p), str)
            .replace(/;.*$/gm, '')
            .replace(/\)\s+\(/g, '),(')
            .replace(/\(/g, '[')
            .replace(/\)/g, ']')
            .replace(/\s+/g, ',')
            .replace(/,+/g, ',')
            .replace(/(?!-?[\d\.]+)(?=[^\d,\[\]])[^,\[\]]*/g, '"$&"') //symbol
            .replace(/,+]/g, ']')
  const
   str_esc_str = escOne(str, /"/, s=>`["str","${s}"]`, change),
   json = str_esc_str.replace(/^,*/, '')
                     .replace(/,*$/, '')
  console.log('json:', json)
  const c_json = `[${json}]`
  let jp
  try {
    jp = JSON.parse(c_json)
  }
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
  n_list: n_list,
  macro: macro,
  exec: exec,
  reader_macro: reader_macro,
}
})();
