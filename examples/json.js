var {AND,OR,MAYBE,MANY,MORE,JOIN,RECURSE,GROUP,TEXT,FAIL,LOG}  = require('../')

//white space
var _ = /^\s*/

//basic primitives
var boolean = TEXT(/^(?:true|false)/, function (t) { return 'true' === t })
var nul = TEXT(/^null/, () => null)

//numbers, fairly complex
var non_zero_int = /^[1-9][0-9]+/
var int = /^-?(?:0|[1-9][0-9]*)/
var fraction = /^\.[0-9]+/
var decimal = AND(int, MAYBE(fraction))
var number = TEXT(AND(decimal, MAYBE(AND('e', /^[+-]?/, non_zero_int))), Number)

//strings, including escaped literals
function join (ary) {
  return ary.join('')
}
var escaped = AND('\\', TEXT(/^./)), unescaped = TEXT(/^[^"\n\\]+/)
var string = AND('"', GROUP(MANY(OR(escaped, unescaped)), join), OR('"', FAIL('expected "')))

//note, matching unescaped string using "repeated non quote" because
//it makes it much much faster than matching each individual character
//then passing it to join.

//objects and arrays.
var value = RECURSE()
var sp_value = AND(_, value, _)

var array = AND('[', _, GROUP(MAYBE(JOIN(sp_value, ','))), _, OR(']', FAIL('expected ]')))

//parse each key value pair into a two element array, [key, value]
//then this is passed to toObject in the map for object.
var keyValue = GROUP(AND( _, string, _, OR(":", FAIL("expected :")), sp_value))

function toObject (ary) {
  var o = {}
  for(var i = 0; i < ary.length; i++)
    o[ary[i][0]] = ary[i][1]
  return o
}

var object = AND('{', _, GROUP(MAYBE(JOIN(keyValue, ',' )), toObject), _, OR('}', FAIL('expected }')))

//accept any valid json type at the top level.
value(OR(object, string, number, nul, boolean, array))

module.exports = OR(sp_value, FAIL('expected json value'))

//these might be useful in other parsers
module.exports.string = string
module.exports.number = number
module.exports.boolean = boolean
