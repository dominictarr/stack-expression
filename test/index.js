var assert = require('assert')
var {AND,OR,MAYBE,MANY,MORE,JOIN,RECURSE,CATCH}  = require('../')

var aORb = OR(/^a/, /^b/)

assert.equal(aORb('a', 0).length, 1)
assert.equal(aORb('b', 0).length, 1)
assert.equal(aORb('c', 0), null)

var aANDb = AND(/^a/, /^b/)

assert.equal(aANDb('ab', 0).length, 2)
assert.equal(aANDb('ba', 0), null)

var MAYBEb = MAYBE(/^b/)

assert.equal(MAYBEb('ba', 0).length, 1)
assert.equal(MAYBEb('ab', 0).length, 0)

var MANYa = MANY(/^a/)

assert.equal(MANYa('ab', 0).length, 1)
assert.equal(MANYa('aaab', 0).length, 3)
assert.equal(MANYa('b', 0).length, 0)

var MOREa = MORE(/^a/)

assert.equal(MOREa('aaab', 0).length, 3)
assert.equal(MOREa('b', 0), null)

var aCOMMAS = JOIN(/^a/, /^,/)

assert.equal(aCOMMAS('a,a,a',0).length, 5)
assert.equal(aCOMMAS('a,a,',0).length, 3)

var abcSPACES = JOIN(/^[abc]+/, /^\s+/)

assert.equal(abcSPACES('a b c',0).length, 5)
assert.equal(abcSPACES('aaa bbb   c',0).length, 11)

var LIST = RECURSE()

var name = /^\w+/, space = /^\s+/
LIST(AND('(', CATCH(MAYBE(JOIN(OR(CATCH(name), LIST), space))), ')'))

assert.equal(LIST('(a)', 0).length, 3)
assert.equal(LIST('((a))', 0).length, 5)
assert.equal(LIST('((a b c))', 0).length, 9)
assert.equal(LIST('((()))', 0).length, 6)
console.log(LIST('(foo (bar baz))', 0).groups)


//And(Catch(/^\w+/), '@', Catch(/^\w+\.[a-z]+/))

var EMAIL = AND(CATCH(/^\w+/), '@', CATCH(/^\w+\.[a-z]+/))

var email = EMAIL('foo@bar.baz', 0)

assert.deepEqual(email, {length: 11, groups: ['foo', 'bar.baz']})

var CSV = JOIN(CATCH( JOIN(CATCH(/^\w+/), ',') ), '\n')

assert.deepEqual(
  CSV('a,b,c\nd,e,f', 0),
  {length: 11, groups: [['a','b','c'], ['d', 'e', 'f']]}
)
