
## how it works

this module is very simple, it's more a pattern that a library.

The basic pattern is:

``` js
function createRule (args) {
  return function rule (input, start, end, group) {
    if(matched?)
      return length_of_match
    else
      return -1
  }
}
```

create functions that take some arguments, and return a rule. A rule is a function
that takes an input string, and `start` and `end` positions, and a `group` capture array.

If the rule matches the `input` at the `start` position, then the number of characters
matched is returned. some patterns can match 0 characters. failure to match is signified
by -1. the `group` array is explained later.

## Match a string

The simplest rule is just to match a string.

``` js
function Match (string) {
  return function (input, start, end) {
    return (
      //-1 if start...end isn't big enough to contain string
      end - start < string.length ? -1
      //else check if string matches.
    : input.startsWith(string, start) ? string.length : -1
    )
  }
}
```
And we'll use the `startsWith` function because [it's fastest](https://jsperf.com/es5-vs-es6-regexp-vs-startswith/3)

But to make something interesting we need ways to combine rules.

## Or

Or is the simplest way to combine rules. It takes a list of rules,
it tries each of them (at the same start position) and returns the first match (or -1 if none match)

``` js
function Or (rules...) {
  return function (input, start) {
    for(var i = 0; i < rules.length; i++) {
      var m = rules[i](input, start, end, group)
      if(~m) return m
    }
    return -1
  }
}
```

with that we can create a pattern like `Or(Match('bar'), Match('baz'))`
which will accept strings `'bar'` or `'baz'`


## And

and is just slightly more complicated, because it returns a match if all it's subrules
match, and the rules match end to end, so if the first rule matches 3 chars, the second
rule starts at `start+3`

```
function And (rules...) {
  return function (input, start, end, group) {
    var m_and = 0
    for(var i = 0; i < rules.length; i++) {
      var m = rules[i](input, start + m_and, end, group)
      if(~m) m_and += m
      else return -1
    }
    return m_and
  }
}
```

Now we can make a more interesting pattern like:
``` js
var AbcD = And(Match('A'), Or(Match('B'), Match('C')), Match('D'))

AbcD('ABD', 0, 3) // => 3
AbcD('ACD', 0, 3) // => 3
```
Now we are actually expressing patterns and matching multiple patterns!

But to make things a little more readable, lets remove the need for `Match`,
if you pass a string as a rule, interpret that as `Match(string)`

``` js
function toRule (m) {
  if('function' === typeof m) return m
  if('string' === typeof m) return Match(m)
  throw new Error('not a valid rule:'+m)
}
```
then we can add this to the top of a rule
``` js
function Rule (rules...) {
  rules = rules.map(toRule)
  ...
}
//and to And...
//then we can do:

var AbcD = And('A', Or('B', 'C'), 'D')

```

## Maybe

Although we have only created some very simple ways to combine rules,
we can already use those to describe other useful things, for example,
a matcher for an empty string (this just always returns a zero length match)
and a Maybe - for optional patterns.

``` js
var Empty = And() //matches an empty list!
var Maybe = function (a) {
  return Or(a, Empty)
}

var AxB = And('A', Maybe('x'), 'B')

AxB('AB') // => 2 //matches 2
AxB('AxB') // => 3 //matches 3, with optional "x"!
```

## Many

`Many` is like `And`, but applies one rule inside a loop.

``` js
function Many (rule) {
  rule = toRule(rule) //interpret a string as a rule.
  return function (input, start) {
    var m, m_many = 0
    while(0 <= (m = matches(rule, input, start+m_many)))
      m_many += m //increment starting position by matched amount
    return m_many
  }
}
```

just keep on increasing the start position until something doesn't match,
then return the characters matched.

``` js
var aaaB = And(Many('a'), 'B')
aaaB('aB') // => 2
aaaB('aaaB') // => 4
aaaB('B') // => 0
```
`Many` matches zero or more items. If you are familiar with regular expressions,
you'll know the `+` operator, which matches one or more items.
That can be expressed using `And` and `Many`.

``` js
function More (rule) {
  return And(rule, Many(rule))
}
```

To actually use this to match a complex real-worldy pattern such as a email address,
well that has lots of letters, we'd have to type out all the letters of the alphabet!
that doesn't sound like fun. Regular Expressions can already represent ranges, so
lets make a Matcher for that, and extend toRule also.

``` js
function MatchRegexp (rule) {
  return function (input, start, end) {
    var m = rule.exec(input.substring(start, end))
    return m ? m[0].length : -1
  }
}

function toRule (r) {
  if('function' === typeof r) return r
  if('string' === typeof r)   return Match(r)
  if(r.exec)                  return MatchRegexp(r) //note, regexp must match start with ^
  throw new Error('not a valid rule:' + r)  
}
```
(unfortunately, there isn't a way check a regexp match at a given start, so we need to use substring)

use this to make a rule that matches any word characters - for example to match an email address.
```
var word = /^\w+/
var email = And(word, '@', word, '.', word) //for example, foo@bar.com
```
(note, this is actually too simple to match real world addresses, but good enough for an example)

There are quite a few things you can match now!
But what about a way to get data out of our matched patterns?

### Text

We don't just want to parse patterns, we want to get data out. Usually there is surrounding syntax
that we don't actually care about, so we want to be explicit about what we capture.

`group` is an array for collecting captures. `Text` takes a rule, and if it matches,
it saves the matched text in the groups array.
(all the previous rules need to also add `group` argument, and pass it on to subrules)

``` js
function Text (rule) {
  rule = toRule(rule)
  return function (input, start, end, group) {
    var m = rule(input, start, end, group)
    if(~m) group.push(input.substring(start, start + m))
    return m
  }
}
```

so `Text(More("A"))` matches a string of one or more `"A"` but also returns the text.

for this to work, when we call the pattern, we must pass a `group` array, as well as
a `start` and `end`.

``` js
var As = Text(More('A'))

var group = []
console.log(As('AAAAA', 0, 5, group)) => 5
console.log(g) => ['AAAAA']

var word = Text(/^\w+/)
var email = And(word, '@', word, '.', word) //for example, foo@bar.com
var group2 = []
email('foo@bar.com', 0, 11, group2)
console.log(group2) // => ['foo', 'bar.com']
```
this mutates the `group` array, but we must return the number of matched chars,
for everything else to work right, so this is simplest.

#### Group

Regular expressions also has captures, marked with parentheses,
but I'd always wished I could have nested groups. That's actually very easy to add.

if we pass a different group array to a subrule, it's `Text` captures will be stored there.
the `Group` rule captures captures. It can hold an array of text or an array of arrays.

``` js
function Group (rule) {
  return function (input, start, end, group) {
    var subgroup = []
    var m = rule(input, start, end, subgroup)
    if(~m) group.push(subgroup)
    return m
  }
}
```

If the rule does not match, then the subgroup is discarded.
Now we could express structures that have a fixed level of nesting,
such as CSV having rows and lines.

``` js
var cell = Text(/^[^,\n]*/) //any character except , or newline
function Join(rule, separator) {
  return And(rule, Many(And(separator, rule)))
}
var line = Group(Join(cell, ','))
var CSV = Group(Join(line, '\n'))

var g = []
CSV('foo,bar,baz\n1,2,3', 0, 17, g)
console.log(g) // => [['foo', 'bar', 'baz'], ['1','2','3']]
```

## Recurse

Since we can capture nested groups, how about recursive structures? This is the point
where we step beyond regular expressions. [Regular languages](https://en.wikipedia.org/wiki/Regular_language)
are _defined_ as not being recursive. This library is called `stack-expression` _because_
we want to be able to handle recursive structures.

``` js
function Recurse (create) {
  var rule
  function wrapper (input, start, end, group) {
    return rule(input, start, end, group)
  }
  return rule = create(wrapper)  
}
```

A recursive rule must be able to refer to itself. So `RECURSE` takes a function that creates the rule.
It's passed `wrapper` as an argument, which will call the rule it returns.

``` js
Recurse(function (value) {
  return Or(Text('A'), And('(', Group(Many(value)), ')'))
})
```
this rule accepts a single A, or parens with zero or more A's or sub parens.
``` js
A         -> 'A'
(AAA)     -> ['A', 'A', 'A']
(((A)))   -> [[['A']]]
(A(A(A))) -> ['A', ['A', ['A']]]
```

# some usable examples

see [lisp](./examples/lisp.js) and [json](./examples/json.js) for examples of parsers
using this library that are both very simple, performant, and reusable!