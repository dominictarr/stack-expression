var assert = require('assert')
var lisp = require('../examples/lisp')

var isArray = Array.isArray

function equals(actual, expected) {
  if('symbol' === typeof expected)
    return assert.equal(typeof actual, 'symbol') && assert.equal(String(actual), String(expected))
  else if(isArray(expected)) {
    assert.equal(isArray(actual), true, 'expected: '+JSON.stringify(actual) + ' to be an array')
    assert.equal(actual.length, expected.length)
    for(var i = 0; i < expected.length; i++)
      equals(actual[i], expected[i])
  }
  else
    assert.equal(actual, expected)
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
  '(list 1 2 3 4)',
  '(-1 0 1 true false nil)',
  '(false)',
  '(if false 1 0)'
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
  [Symbol('list'), 1, 2, 3, 4],
  [-1, 0, 1, true, false, null],
  [false],
  [Symbol('if'), false, 1, 0]
]

//console.log(lisp('((()))', 0).groups[0])
//console.log(lisp('"hello"', 0).groups[0])

for(var i = 0; i < input.length; i++) {
  var g = []
  var m = lisp(input[i], 0, input[i].length, g.push.bind(g))
  console.error('test', i, input[i])
  equals(g[0], output[i])
}
