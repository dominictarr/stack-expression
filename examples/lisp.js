var {AND,OR,MAYBE,JOIN,RECURSE,GROUP,TEXT}  = require('../')

//mandatory whitespace
var __ = /^\s+/

//optional whitespace
var _ = /^\s*/

var value = RECURSE ()

//note: json's string and number already captures.
var {string, number} = require('./json')
var nil = TEXT(/^nil/, function () { return null })
var list = AND('(', _, GROUP(MAYBE(JOIN(value, __))), _, ')')
value(OR(list, string, number, nil))

module.exports = value
