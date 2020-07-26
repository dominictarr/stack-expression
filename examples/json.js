var {And,Or,Maybe,Many,More,Join,Recurse,Group,Text,Expect,EOF}  = require('../')

//white space
var _ = /^\s*/

//basic primitives
var boolean = Text(/^(?:true|false)/, function (t) { return 'true' === t })
var nul = Text(/^null/, () => null)

//numbers, fairly complex
var non_zero_int = /^[1-9][0-9]+/
var int = /^-?(?:0|[1-9][0-9]*)/
var fraction = /^\.[0-9]+/
var decimal = And(int, Maybe(fraction))
var number = Text(And(decimal, Maybe(And('e', /^[+-]?/, non_zero_int))), Number)

//strings, including escaped literals
function join (ary) {
  return ary.join('')
}
var escaped = And('\\', Text(/^./)), unescaped = Text(/^[^"\n\\]+/)
var string = And('"', Group(Many(Or(escaped, unescaped)), join), Expect('"'))

//note, matching unescaped string using "repeated non quote" because
//it makes it much much faster than matching each individual character
//then passing it to join.

function toObject (ary) {
  var o = {}
  for(var i = 0; i < ary.length; i++)
    o[ary[i][0]] = ary[i][1]
  return o
}

var value = Recurse(function (value) {
  //objects and arrays.
  var array = And('[', _, Group(Maybe(Join(value, ','))), _, Expect(']'))

  //parse each key value pair into a two element array, [key, value]
  //then this is passed to toObject in the map for object.
  var keyValue = Group(And(_, string, _, Expect(":"), value))

  var object = And('{', Group(Maybe(Join(keyValue, ',' )), toObject), Expect('}'))

  //accept any valid json type at the top level, allow surrounding spaces.
  return And(_, Or(object, string, number, nul, boolean, array), _)
})

module.exports = And(Expect(value, 'expected json value'), EOF)

//these might be useful in other parsers
module.exports.string = string
module.exports.number = number
module.exports.boolean = boolean
