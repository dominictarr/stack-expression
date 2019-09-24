var assert = require('assert')
var lisp = require('../examples/lisp')

var input = [
  '()',
  '((()))',
  '123',
  '(1 2 3)',
  '(1 (2 (3)))',
  '(\n\n\n)'
]
var output = [
  [],
  [[[]]],
  123,
  [1,2,3],
  [1, [2, [3]]],
  []
]

//console.log(lisp('((()))', 0).groups[0])
//console.log(lisp('"hello"', 0).groups[0])

for(var i = 0; i < input.length; i++) {
  var parsed = lisp(input[i], 0).groups[0]
  assert.deepEqual(parsed, output[i])
}
