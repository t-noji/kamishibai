'use strict'
const
  addIn = (obj, ...arg)=>
    (arg.forEach(a=>
      a && Object.keys(a).forEach(k=>
        a[k] instanceof Object && typeof a[k] !== 'function'
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
    l.reduce((pre,a,i)=> pre.concat(i%2 ? [] : [f(a, l[i+1])]) ,[])

const {
  n_list, // lisp内で利用可能な関数リスト
  macro,  // lisp内で利用可能なマクロリスト
  reader_macro, // リーダマクロリスト
  exec // (String body)=>result / lisp実行用関数
} = (()=>{

const n_list = addIn(window, {
  through: a=> a,
  '+': (a,b)=> a+b,
  '-': (a,b)=> a-b,
  '*': (a,b)=> a*b,
  '/': (a,b)=> a/b,
  '%': (a,b)=> a%b,
  '=': (a,b)=> a===b,
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
  object: (...args)=>
    duo(args).reduce((pre,a)=> addIn(pre, {[a[0]]: a[1]}), {})
})

const macro ={
  defmacro: (name, namelist, body)=>{
    macro[name] = (...args)=>
      macroexpand(exe(argsReplace(body, namelist, args)))
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
         ? (typeof s === 'string' && s !== '@') || s.closure === s.closure
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
  closure = {}, // closure_key
  macroexpand = b=> // ((a 1)) 
    !Array.isArray(b) || b.length === 0
      ? b.closure === closure
        ? b.name
        : b
      : b[0] in macro
        ? macro[b[0]](... b.slice(1).map(macroexpand))
        : b.map(macroexpand),
    
  found = str=>
    typeof str === 'function'
      ? str
      : str.closure === closure
        ? str.val
        : str.split('.').reduce((o,s)=>
            (o[s] === undefined
              && console.log('無いよ:', str),
             o[s].bind)
               ? o[s].bind(o) 
               : o[s], n_list),
  exe = b=>
    !Array.isArray(b)
      ? typeof b === 'string' || b.closure
        ? found(b)
        : b
      : b[0] in special
          ? special[b[0]](... b.slice(1))
          : ((f = (Array.isArray(b[0])
                   ? exe
                   : found)(b[0]))=>
              (typeof f !== 'function'
                 && console.log('関数じゃないよ:', b[0], 'from', b),
               f(... b.slice(1).map(exe))))()

const argsReplace = (l, names =[], vals)=>{
  const slice_index = (names.indexOf('&') +1) || names.length
  return names.slice(0, slice_index).reduce((pre,name,i)=>
    name === '&'
      ? replace(pre, names[i+1], vals.slice(i))
      : replace(pre, name, vals[i]),
    l)
}
const replace = (l,name,val)=>{
  const
    closure_obj = {name: name, closure: closure,
                   val: val.closure === closure ? val.val : val},
    re = l=>
      Array.isArray(l)
        ? l.map(re)
        : l === name || (l.closure === closure && l.name === name)
          ? closure_obj
          : l
  return re(l)
}
// 特殊式
const special = {
  progn: (...body)=> body.map(exe)[body.length - 1],
  'list-progn': body=> special.progn(...exe(body)),
  'if': (flag, tbody, fbody=[])=> exe(exe(flag) ? tbody : fbody),
  lambda: (names, ...body)=>{
    const f = (...args)=>
      special.progn(... argsReplace(body, names, args))
    f.toString = ()=> `${names}-> `+ JSON.stringify(body)
    return f
  },
  def: (...arg)=>
    arg.forEach((a,i)=>
      !(i%2) // hit 0 2 4 ...
      && (a.split('.').reduce(
        (pre,s,j,aa)=>
          pre[s] = aa[j+1]
                      ? pre[s] || {}
                      : exe(arg[i+1]),
        n_list))),
  'let': (na, ...body)=>
      special.lambda(na.map(a=>a[0]), ...body)
        (...na.map(a=> exe(a[a.length -1]))),
  setq: (cobj, body)=> exe(['quote', cobj]).val = exe(body),
  quote: (...s)=> s.length === 1 ? s[0] : s,
  str: String,
  'undefined': ()=> undefined
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
  readerFirstMacro(',', 'unquote')
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
  return special.progn(... expanded)
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
