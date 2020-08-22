var {And,Or,Maybe,Many,Join,Recurse,Group,Text,Expect,EOF}  = require('../')

// m-expressions where an alternate form of lisp that they never got around to
// implementing, but is basically what js, c, and most other languages look like.
// https://en.wikipedia.org/wiki/M-expression

// except I'm sticking with space separation, adding a 
var __ = /^\s+/ //mandatory whitespace
var _  = /^\s*/ //optional whitespace

//note: json's string and number already captures.
var {string, number, boolean} = require('./json')
var sym = Text(/^[a-zA-Z_][a-zA-Z0-9_]*/, function (Text) { return Symbol(Text) })
var nil = Text(/^nil/, function () { return null })

function OpenClose (op, item, cl, map) {
  return And(op, _, Group(Maybe(Join(item, __)), map), _, Expect(cl))
}

var call = Symbol('call')

module.exports = And(_, Recurse (function (value) {
  var invocation = Or(
    //foo.bar=baz is just the same as foo(/bar baz) but only if bar is a literal symbol.
    And('.', _, Group(And(sym, Maybe(And(_, '=', _, value))))),
    OpenClose('(', value, ')')
  )
  var object = OpenClose('{', And(sym, _, ':', _, value), '}', function (pairs) {
    var obj = {}
    pairs.forEach(function (kv) {
      obj[kv[0]] = kv[1]
    })
    return Object.seal(obj) //prevent adding new fields (but allow mutation of current fields)
  })
  return Or(string, number, nil, object, Group(And(sym, Many(invocation)), function (calls) {
    if(calls.length === 1) return calls[0]
    return calls.reduce((val, args) => ({type: call, value: val, args: args}))
  }))
}), _, EOF)

//note: the trickiest part of this is handling the optional whitespace, since it's also whitespace
//delimited. That means that the 