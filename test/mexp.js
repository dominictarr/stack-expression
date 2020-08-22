var assert = require('assert')
var inspect = require('util').inspect
function equal(a, b) {
  if(a && 'object' === typeof a) {
    if(typeof a != typeof b) return false
    for(var k in a) //check b is not missing fields from a
      if(!equal(a[k], b[k])) return false
    for(var k in b) //check a is not missing fields from b
      if(!equal(a[k], b[k])) return false
    return true
  }
  else if('symbol' === typeof a && 'symbol' === typeof b)
    return a.description == b.description
  else //handles all other types...
    return a === b
}

var inputs = [
  'a(b c)',
  'a(b c)(d e)',
  'a.b',
  'a.b.c',
//  'a.b = 1'
]

function S(s) { return Symbol(s) }

var call = S('call'), a = S('a'), b = S('b'), c = S('c'), d = S('d'), e = S('e')

var expected = [
  {type: call, value: a, args: [b, c]},
  {type: call, value: {type: call, value: a, args: [b, c]}, args: [d, e]},
  {type: call, value: a, args: [b]},
  {type: call, value: {type: call, value: a, args: [b]}, args: [c]},
]

var mexp = require('../examples/mexp')

function parse (str) {
  var g = []
  return ~mexp(str, 0, str.length, v=>g.push(v)) ? g : null
}

for(var i = 0; i < inputs.length; i++) {
  var actual = parse(inputs[i])[0]
  console.log(inspect(actual, {depth: 100}))
  console.log(inspect(expected[i], {depth: 100}))
  assert.ok(equal(actual, expected[i]))
}
