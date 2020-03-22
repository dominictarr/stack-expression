var {AND,OR,MAYBE,JOIN,RECURSE,GROUP,TEXT}  = require('../')

//mandatory whitespace
var __ = /^\s+/

//optional whitespace
var _ = /^\s*/

var value = RECURSE ()

//note: json's string and number already captures.
var {string, number, boolean} = require('./json')
var sym = TEXT(/^[a-zA-Z_][a-zA-Z0-9_]*/, function (text) { return Symbol(text) })
var nil = TEXT(/^nil/, function () { return null })
var list = AND('(', _, GROUP(MAYBE(JOIN(value, __))), _, ')')
value(OR(list, string, number, nil, boolean, sym))

module.exports = AND(_, value, _)
