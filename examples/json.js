var {AND,OR,MAYBE,MANY,MORE,JOIN,RECURSE,CATCH, GROUP, TEXT}  = require('../')

//white space
var _ = /^\s*/

//basic primitives
var boolean = TEXT(/^true|false/, Boolean)
var nul = TEXT(/^null/, () => null)

//numbers, fairly complex
var int = /^-?(?:0|[1-9][0-9]*)/
var fraction = /^\.[0-9]+/
var decimal = AND(int, MAYBE(fraction))
var number = TEXT(AND(decimal, MAYBE(AND('e', decimal))), Number)

//strings, including escaped literals
function join (ary) { return ary.join('') }
var escape = AND('\\', TEXT(/^./)), unescaped = TEXT(/^[^"]+/)
var string = AND('"', GROUP(MANY(OR(escape, unescaped)), join), '"')

//note, matching unescaped string using "repeated non quote" because
//it makes it much much faster than matching each individual character
//then passing it to join.

//objects and arrays.
var value = RECURSE()

var array = AND('[', _, GROUP(MAYBE(JOIN(AND(_, value, _), ','))),  _, ']')

//parse each key value pair into a two element array, [key, value]
//then this is passed to toObject in the map for object.
var keyValue = GROUP(AND( _, string, _, ":", _, value, _ ))

function toObject (ary) {
  var o = {}
  for(var i = 0; i < ary.length; i++)
    o[ary[i][0]] = ary[i][1]
  return o
}

var object = AND('{', _, GROUP(MAYBE(JOIN(keyValue, ',' )), toObject), _, '}')

//accept any valid json type at the top level.
value(OR(object, array, string, number, nul, boolean))

module.exports = value

//these might be useful in other parsers
module.exports.string = string
module.exports.number = number
