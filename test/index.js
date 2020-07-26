var assert = require('assert')
var eq = assert.equal
assert.equal = function (a, b) {
   console.log('eq', a , b)
   eq(a, b)
}
var {AND,OR,MAYBE,MANY,MORE,JOIN,RECURSE,TEXT,GROUP}  = require('../')

var aORb = OR(/^a/, /^b/)

assert.equal(aORb('a', 0), 1)
assert.equal(aORb('b', 0), 1)
assert.equal(aORb('c', 0), -1)

var aANDb = AND(/^a/, /^b/)

assert.equal(aANDb('ab', 0), 2)
assert.equal(aANDb('ba', 0), -1)

var MAYBEb = MAYBE(/^b/)

assert.equal(MAYBEb('ba', 0), 1)
assert.equal(MAYBEb('ab', 0), 0)

var MANYa = MANY(/^a/)

assert.equal(MANYa('ab', 0), 1)
assert.equal(MANYa('aaab', 0), 3)
assert.equal(MANYa('b', 0), 0)

var MOREa = MORE(/^a/)

assert.equal(MOREa('aaab', 0), 3)
assert.equal(MOREa('b', 0), -1)

var aCOMMAS = JOIN(/^a/, /^,/)

assert.equal(aCOMMAS('a,a,a',0), 5)
assert.equal(aCOMMAS('a,a,',0), 3)

var aGROUPS = JOIN(TEXT(/^a/), /^,/)

var g = []
assert.equal(aGROUPS('a,a,a', 0, 5, g), 5)
assert.deepEqual(g, ['a', 'a', 'a'])

var abcSPACES = JOIN(/^[abc]+/, /^\s+/)

assert.equal(abcSPACES('a b c',0), 5)
assert.equal(abcSPACES('aaa bbb   c',0), 11)

function match(rule, input, matched, groups) {
  var g = []
	var m = rule(input, 0, input.length, g)
  assert.equal(m, matched)
  assert.deepEqual(g, groups)
}
var name = /^\w+/, space = /^\s+/

var LIST = RECURSE(function (LIST) {
  return AND('(', GROUP(MAYBE(JOIN(OR(TEXT(name), LIST), space))), ')')
})

match(LIST, '(a)'      , 3, [['a']])
match(LIST, '((a))'    , 5, [[['a']]])
match(LIST, '((a b c))', 9, [[['a', 'b', 'c']]])
match(LIST, '((()))'   , 6, [[[[]]]])


//And(Catch(/^\w+/), '@', Catch(/^\w+\.[a-z]+/))
var EMAIL = AND(TEXT(/^\w+/), '@', TEXT(/^\w+\.[a-z]+/))

//var email = EMAIL('foo@bar.baz', 0, 11, [])

match(EMAIL, 'foo@bar.baz', 11, ['foo', 'bar.baz'])

var CSV = JOIN(GROUP(JOIN(TEXT(/^\w+/),',')),'\n')

match(CSV, 'a,b,c\nd,e,f', 11, [['a','b','c'], ['d', 'e', 'f']])
