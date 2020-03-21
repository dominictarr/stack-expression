var assert = require('assert')
var lisp = require('../examples/lisp')

var isArray = Array.isArray

function equals(actual, expected) {
  if(actual === expected) return
  if(isArray(expected))
    assert.equal(isArray(actual), true, 'expected :'+JSON.stringify(actual) + 'to be an array')
  if('symbol' === typeof expected)
    return assert.equal(typeof actual, 'symbol') && assert.equal(String(actual), String(expected))
  assert.equal(actual.length, expected.length)
  for(var i = 0; i < expected.length; i++)
    equals(actual[i], expected[i])
}

var input = [
  '()',
  '((()))',
  '123',
  '(1 2 3)',
  '(1 (2 (3)))',
  '(\n\n\n)',
  '"hello world"',
  '("hello world")',
  'list',
  '(list 1 2 3 4)'
]
var output = [
  [],
  [[[]]],
  123,
  [1,2,3],
  [1, [2, [3]]],
  [],
  "hello world",
  ["hello world"],
  Symbol('list'),
  [Symbol('list'), 1, 2, 3, 4]
]

//console.log(lisp('((()))', 0).groups[0])
//console.log(lisp('"hello"', 0).groups[0])

for(var i = 0; i < input.length; i++) {
  var parsed = lisp(input[i], 0)
  console.error(parsed)
  var g = parsed.groups[0]
  equals(g, output[i])
}
