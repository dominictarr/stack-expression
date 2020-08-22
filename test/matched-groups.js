//some formats have weird edge cases.
//for example, browsers accept html like <div><span></div>
//interpreting it as <div><span></span></div>
//I wouldn't recommend designing formats with this much redundency
//because it will end up more complicated. Make something simple
//that can only be parsed the right way, and error if not.
//But anyway, you might need
//to parse a format that works like this. for example, html.

var t = require('assert')
var {Recurse, And, Many, Or, Not, Group, Fail, Peek} = require('../')


var opening = ['(', '[', '<', '{']
var closing = [')', ']', '>', '}']


var parens = Recurse(function (parens) {
  function createParens(op, cl, not) {
    return And(
      op,
      Many(parens),
      Or(
        cl,
        Peek(Or(...not))
      )
    )
  }

  var round  = createParens('(', ')', ['>', '}', ']'])
  var angle  = createParens('<', '>', ['}', ']', ')'])
  var curly  = createParens('{', '}', [']', ')', '>'])
  var square = createParens('[', ']', [')', '>', '}'])

  return Group(Or(round, square, curly, angle))
})
var input = [
  '()',
  '(())',
  '([])',
  '([<{}>])',

  '([)',
  '({[<])',
  '([]<>{})'
]

var output = [
  [],
  [[]],
  [[]],
  [[[[]]]],

  [[]],
  [[[[]]]],
  [[],[],[]]
]

input.forEach(function (src, i) {
  console.log('src', src)
  var g = []
  var data = parens(src, 0, src.length, v=>g.push(v))
  console.log('data', data)
  t.deepEqual(g, [output[i]])
})
