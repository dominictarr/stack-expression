var assert = require('assert')
var json = require('../examples/json')
var getError = require('../').getError
// --------------------

var inputs = [
  [1],
  [1,2,3],
  [],
  {},
  1.2,
  100,
  1e+300,
  1.32e-123,
  {foo: 'bar'},
  '"{\"foo\":\"bar\"}"'
]

// console.log(
  // json(JSON.stringify({okay: [1,2,3], empty: {}}), 0).groups[0]
// )

var fs = require('fs')
var path = require('path')
var pkg = JSON.stringify(require('../package.json'))
//var pkg = fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')

var start = Date.now()
var N = 10000, custom, builtin
for(var i = 0; i < N; i++) {
  var g = []
  json(pkg, 0, pkg.length, g.push.bind(g))
  parsed = g[0]
}
console.log('json.parse', custom = (Date.now() - start)/N)

assert.deepEqual(parsed, require('../package.json'))

var start = Date.now()
for(var i = 0; i < N; i++)
  var parsed = JSON.parse(pkg)
console.log('JSON.parse', builtin = (Date.now() - start)/N)

console.log('ratio:', custom/builtin)

console.log(
  JSON.stringify(parsed, null, 2)
)

assert.deepEqual(parsed, require('../package.json'))

//invalid tests
for(var i = 0; i < 10; i++) {
  //insert 'X"{]' should break any json object...
  var r = ~~(Math.random()*pkg.length)
  var r2 = r + ~~(Math.random()*(pkg.length-r))
  var partial = pkg.substring(0, r) + 'X"{]' + pkg.substring(r2)
  var fail
  try {
    var v = json(partial, 0, partial.length, [])
    fail = true
  } catch (err) {
    //NOTE: _sometimes_ this fails to error, somehow the string is still valid.
    if(~v) console.log('INPUT:', partial)
    fail = false
  }
  assert.equal(fail, false)
}

//  assert.deepEqual(json('[ ]', 0).groups[0], [])


for(var k in inputs) {
  var str = JSON.stringify(inputs[k])
  console.log('string:', str)
  var g = [], g2 = []
  assert.ok(~json(str, 0, str.length, g.push.bind(g)))
  assert.deepEqual(g[0], inputs[k])
  var str = JSON.stringify(inputs[k], null, 2)
  json(str, 0, str.length, g2.push.bind(g2))
  assert.deepEqual(g2[0], inputs[k])
}

var str = JSON.stringify(inputs), g3 = []

console.log('string:', str)
assert.equal(json(str, 0, str.length, g3.push.bind(g3)), str.length)
assert.deepEqual(g3[0], inputs)
