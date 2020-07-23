//some formats have weird edge cases.
//for example, browsers accept html like <div><span></div>
//interpreting it as <div><span></span></div>
//I wouldn't recommend designing formats with this much redundency
//because it will end up more complicated. Make something simple
//that can only be parsed the right way, and error if not.
//But anyway, you might need
//to parse a format that works like this. for example, html.

var t = require('assert')
var {RECURSE, AND, MANY, OR, NOT, GROUP, FAIL, PEEK} = require('../')


var opening = ['(', '[', '<', '{']
var closing = [')', ']', '>', '}']

function createParens(op, cl, not) {
  return AND(
    op,
    MANY(parens),
    OR(
      cl,
      PEEK(OR(...not))
    )
  )
}

var parens = RECURSE()

var round  = createParens('(', ')', ['>', '}', ']'])
var angle  = createParens('<', '>', ['}', ']', ')'])
var curly  = createParens('{', '}', [']', ')', '>'])
var square = createParens('[', ']', [')', '>', '}'])

parens(GROUP(OR(round , square, curly, angle)))

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
  var data = parens(src, 0, src.length, g)
  console.log('data', data)
  t.deepEqual(g, [output[i]])
})
