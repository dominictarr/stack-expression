var {AND,OR,MAYBE,MANY,MORE,JOIN,RECURSE,CATCH}  = require('../')

var _ = /^\s*/  //optional white space
var value = RECURSE()
var boolean = CATCH(/^true|false/)
var nul = CATCH(/^null/)
var int = /^-?(?:0|[1-9][0-9]*)/
var fraction = /^\.[0-9]+/
var decimal = AND(int, MAYBE(fraction))
var number = AND(decimal, MAYBE(AND('e', decimal)))
var string = AND('"', CATCH(MANY(OR('\\"', /^[^"]/))), '"')
var object = AND('{', _, MAYBE(JOIN(CATCH(AND( _, CATCH(string), _, ":", _, value, _ )), ',' )), _, '}')
var array = AND('[', _, MAYBE(JOIN(AND(_, value, _), ',')),  _, ']')
value(CATCH(OR(object, array, string, number, nul, boolean)))

var json = value

console.log(
  json(JSON.stringify({okay: [1,2,3], empty: {}}), 0).groups[0]
)

var fs = require('fs')
var path = require('path')
var pkg = JSON.stringify(require('../package.json'))//fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
var pkg = fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
//console.log(pkg)
console.log(
  JSON.stringify(json(pkg, 0).groups[0], null, 2)
)
