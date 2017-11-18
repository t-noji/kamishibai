'use strict'
const
  addIn = (obj, ...arg)=>
    (arg.forEach(a=>
      a && Object.keys(a).forEach(k=>
        a[k] instanceof Object && typeof a[k] !== 'function'
          && (!Array.isArray(a[k])) && !(a[k] instanceof HTMLElement)
          ? obj[k]
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
  duo = (l, f=(x,y)=>[x,y])=>
    l.reduce((pre,a,i)=> pre.concat(i%2 ? [] : [f(a, l[i+1])]) ,[]),
  kv2obj = (keys, values, ori={})=>
    keys.reduce((pre,key,i)=>(pre[key] = values[i], pre), ori)

const {
  n_list, // lisp内で利用可能な関数リスト
  macro,  // lisp内で利用可能なマクロリスト
  reader_macro, // リーダマクロリスト
  exec // (String body)=>result / lisp実行用関数
} = (()=>{

const n_list = addIn(window, {
  t: true,
  'true': true,
  'false': false,
  nil: null,
  through: a=> a,
  '+': (a,b)=> a+b,
  '-': (a,b)=> a-b,
  '*': (a,b)=> a*b,
  '/': (a,b)=> a/b,
  '%': (a,b)=> a%b,
  '>': (a,b)=> a>b,
  '<': (a,b)=> a<b,
  '=': (a,b)=> a===b,
  '>=': (a,b)=> a>=b,
  '<=': (a,b)=> a<=b,
  '!=': (a,b)=> a!==b,
  list: (...a)=> a,
  string: String,
  'add-in': addIn,
  'add-on': addOn,
  first: a=> a[1],
  second: a=> a[2],
  third: a=> a[3],
  nth: (a,n)=> a[n],
  even: even,
  odd: odd,
  mix: mix,
  duo: duo,
  apply: (f,b)=> f(...b),
  append: (...args)=> [].concat(...args),
  log: a=> (console.log(a), a),
  length: l=> l.length,
  object: (...args)=>
    duo(args).reduce((pre,a)=> addIn(pre, {[a[0]]: a[1]}), {})
})

const macro ={
  defmacro: (name, namelist, body)=>{
    macro[name] = (...args)=>
      macroexpand(exe(args2env([n_list], namelist, args), body))
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
    ((ff = (ss,base)=> ss.reduce((o,s)=>
          o[s] && (o[s].bind
                    ? o[s].bind(o) 
                    : o[s]), 
          base))=>
      (env,str)=>{
        if (typeof str === 'function') return str
        const ss = str.split('.')
        const ef = env.find(e=> ss[0] in e)
        if (ef === undefined) console.log('無いよ:', str, '環境', env)
        return ff(ss.slice(1), ef[ss[0]])
      })(),
  exe = (env,b)=>
    !Array.isArray(b)
      ? typeof b === 'string'
        ? found(env,b)
        : b
      : b[0] in special
          ? special[b[0]](env, ... b.slice(1))
          : ((f = (Array.isArray(b[0])
                   ? exe
                   : found)(env,b[0]))=>
              (typeof f !== 'function'
                 && console.log('関数じゃないよ:', b[0], 'from', b),
               f(... b.slice(1).map((b)=>exe(env,b)))))()

const args2env = (env, names=[], vals=[])=>{
  const slice_index = (names.indexOf('&') +1) || names.length
  return [names.slice(0, slice_index).reduce((pre,name,i)=>
    (name === '&'
      ? pre[names[i+1]] = vals.slice(i)
      : pre[name] = vals[i],
     pre),
    {})].concat(env)
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
  lambda: (env, names, ...body)=>{
    //console.log(env, body)
    const f = (...args)=>
      special.progn(args2env(env, names, args), ...body)
    f.toString = ()=> `${names}-> `+ JSON.stringify(body)
    return f
  },
  def: (env, ...arg)=>
    arg.forEach((a,i)=>
      !(i%2) // hit 0 2 4 ...
      && (a.split('.').reduce(
        (pre,s,j,aa)=>
          pre[s] = aa[j+1]
                      ? pre[s] || {}
                      : exe(env,arg[i+1]),
        n_list))),
  'let': (env,na, ...body)=>
      special.lambda(env, na.map(a=>a[0]), ...body)
        (...na.map(a=> exe(env, a[a.length -1]))),
  setq: (env, cobj, body)=> env.find(e=> cobj in e)[cobj] = exe(env, body),
  quote: (env, ...s)=> s.length === 1 ? s[0] : s,
  str: (env, ...arg)=> String(...arg),
  'undefined': (env)=> undefined
}

// 評価
const
  search = (str, regex, count = -1, i)=>
     (i = str.search(regex)) === -1
        ? []
        : [[count + i + 1, str[i]]].concat(search(str.slice(i + 1), regex, count + i + 1)),

  esc = (str, arg_obj)=>{
    const {start, count_start = start, start_replace = start,
           end = '\\)', end_replace = end.replace('\\',''), outFn =s=>s, inFn =s=>s}
             = arg_obj
    const se = new RegExp(start +'|'+ end)
    const ce = new RegExp(count_start +'|'+ end)
    const escf = (str, count = 0,  i,ss,sl,el)=>
       (i = str.search(count ? ce : se),
        ss = (count ? count_start : start).replace(/\\/g,''),
        sl = ss.length,
        el = end.replace(/\\/g,'').length,
          i === -1
               ? str && outFn(str)
               : str.slice(i, i+sl) === ss
                 ? count === 0
                   ? outFn(str.slice(0,i)) + start_replace + escf(str.slice(i+sl), 1)
                   : inFn(str.slice(0,i+sl)) + escf(str.slice(i+sl), count +1)
                 // end
                 : count === 0
                   ? outFn(str.slice(0,i+el)) + escf(str.slice(i+el), 0)
                   : count === 1
                     ? inFn(str.slice(0,i)) + end_replace + escf(str.slice(i+el), count -1)
                     : inFn(str.slice(0,i+el)) + escf(str.slice(i+el), count -1))
    return escf(str)
  },
  escOne = (str, key, inFn =s=>s, outFn =s=>s)=>{
    const l = [-1, ...search(str, /"/).map(x=>x[0])]
    return l.reduce((p,c,i)=>p+ (i % 2 ? inFn : outFn)(str.slice(c+1, l[i+1])), '')
  },
  readerFirstMacro = (marker,macro)=>
    str=>
      str.replace(RegExp(`${marker}\\(`, 'g'),`(${macro} `)
         .replace(RegExp(`${marker}(\\S+)`, 'g'), `(${macro} $1)`)

const reader_macro = [
  readerFirstMacro("'", 'quote'),
  readerFirstMacro('`', 'backquote'),
  str=> str.replace(/,@/g, '@ '),
  readerFirstMacro(',', 'unquote'),
  readerFirstMacro('#', 'lambda')
]

const exec = str=>{
  const change = str=>
         reader_macro.reduce((p,f)=>f(p), str)
            .replace(/\)\s+\(/g, '),(')
            .replace(/\(/g, '[')
            .replace(/\)/g, ']')
            .replace(/\s+/g, ',')
            .replace(/[^\d\[\],][^,\[\]]*/g, '"$&"') //simbol
            .replace(/,+]/g, ']')
  const
   comment_str = str.replace(/;.*$/gm, ''),
   object_esc_str =
     esc(comment_str, {start: '{', end: '}',
      outFn: s=>  /"/.test(s)
        ? escOne(s, /"/, s=>`["str","${s}"]`, change)
        : change(s),
      inFn: s=> s.replace(/[^\d:\s][^:\s]*(?=:)/g, '"$&"')}),
   json = object_esc_str.replace(/^,*/, '')
                        .replace(/,*$/, '')
  console.log('json:', json)
  const
   jp = JSON.parse(`[${json}]`),
   expanded = jp.map(macroexpand)
  console.log('expanded macro:',expanded)
  return special.progn([n_list], ...expanded)
}

// lisp //
exec(`
(defmacro defun (name arglist & body)
  \`(def ,name (lambda ,arglist ,@body)))

(defmacro incf (cobj)
  \`(setq ,cobj (+ ,cobj 1)))
`)

// 日本語命令 //
addIn(special, {
  もし: special["if"],
  代入: special.def,
  関数: special.lambda
})
addIn(n_list, {
  合成: n_list.mix
})

return {
  n_list: n_list,
  macro: macro,
  exec: exec,
  reader_macro: reader_macro,
}
})();
