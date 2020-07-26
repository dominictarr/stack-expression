var {And,Or,Maybe,Join,Recurse,Group,Text,Expect,EOF}  = require('../')

var __ = /^\s+/ //mandatory whitespace
var _  = /^\s*/ //optional whitespace

//note: json's string and number already captures.
var {string, number, boolean} = require('./json')
var sym = Text(/^[a-zA-Z_][a-zA-Z0-9_]*/, function (Text) { return Symbol(Text) })
var nil = Text(/^nil/, function () { return null })

module.exports = And(_, Recurse (function (value) {
  var list = And('(', _, Group(Maybe(Join(value, __))), _, Expect(')'))
  return Or(list, string, number, nil, boolean, sym)
}), _, EOF)

//note: the trickiest part of this is handling the optional whitespace, since it's also whitespace
//delimited. That means that the 