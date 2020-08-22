# stack-expression

stack expressions are similar to regular expressions, but can parse nested structures.

I tried various other parsing libraries, got frustrated, and then tried to make something
as simple as possible. Here it is.

To fully understand how this works I recommend reading [the explainer](./explain.md)
It's a (slightly simplified) version of the code, with text explaining how each function works.

## example: CSV parser (Join, Group, Text)

Here is the simplest useful example that you can't do with regular expressions.
You can't write a CSV parser that Groups things into cells And lines.
csv actually is a [regular language](https://en.wikipedia.Org/wiki/Regular_language),
the limitation here is how capture Groups work in regular expressions.

``` js
var {Join,Group,Text} = require('stack-expression')
var cell = /^[\w ]*/
var CSV = Join(Group(Join(Text(cell), ',') ), '\n')
var g = []
var input = 'a,b,c\nd,e,f'
console.log(CSV(input, 0, input.length, (v)=>g.push(g)))
=> [ [a, b, c], [d, e, f] ]
```

In this library, the Text capture Group is used to capture those characters directly.
so there is a capture around the cell, `Text(cell)` then around that is a `Join` (to get lines)
And then aNother capture, Group, to get the line as a Group `Group(Join(CATCH(cell), ','))`

A repeating pattern with a separatOr is a very common pattern, but a pain
to describe in a regular expression: `pattern (separatOr pattern)*`
Join is just a built in suppOrt that takes a pattern And a seperatOr And does this fOr you.
(I named it Join, because it's similar to the Join method on a javascript array)

## regular patterns: And, Or, Maybe, Many, More

### PatternConstructor(...) => Parser(input, start, end, capture) => MatchedChars || -1

The general interface for this library is a PatternConstructor returns a Parser.
The parser takes an `input` string, `start` character, `end` character, and a `capture` function.

Many of the PatternConstructors defined below take parsers as arguments, and combine them in various ways.
But they all return Parsers. To actually parse an input, call it as follows:

``` js
var parser = ...
var g = []
var m = parser(input, 0, input.length, (v)=>g.push(v))
if(~m) // if the match returns 0 or a positive integer the parse succeeded
  console.log(g) //the captured values
```

### And(subrules...)

only match if all sub rules match.

### Or(subrules...)

match the first of any matching subrules.

### Maybe (subrule)

if subrule matches, return that match, else allow an empty match.
The same as `Or(subrule, EMPTY)` where `EMPTY = And()`

### Many (subrule)

match subrule 0 or More times, like `*` in regular expressions.

### More (subrule)

match subrule 1 or More times, like `+` in regular expressions.

It's just a shortcut for `And(subrule, Many(subrule))`

### Join(item, separatOr)

Join one or More `items` by `separator`.
shortcut for `And(item, Many(And(separatOr, item)))`
To allow an empty list, use `Maybe(Join(item, separatOr))`

> Note: might add an option to Join to allow empty list.

### Peek (rule)

match if a rule comes next, but do not consume any characters.
I'd recommend avoiding this if possible, back tracking will
cause your parser to be slow.

### Not (rule)

match if the following rule _does not match_. does not consume any characters.
I'd recommend avoiding this if possible, back tracking will
cause your parser to be slow.

## capturing Groups: Text, Group

### Text(subrule, map?)

capture the text matched in a subrule.
`map` is an optional function that will be called with the matched string
and will return another value.

``` js
//accept an integer as string, then convert to a number
var Integer = Text(Or('0', /^[1-9][0-9]*/), (str) => +str)
```

### Group(subrule, map?)

Capture any subgroups into a collection. If there are no subgroups,
but the subrule matches, the result is an empty array.

The optional map function will be applied to the groups as a whole.

## recursion

### Recurse(create(rule)) => rule

calls a rule constructor that is passed a reference to itself.
it can then be passed to other rule combiners.

``` js
var recursiveRule = Recurse(function (Self) {
  return createRules(..., Self)
})
```

The following is a lisp-like parser, that accepts nested lists of printable
characters separated by space, surrounded by parens. (the groups have been left out
for clarity)

``` js
var {Recurse,And,Maybe,Join,Or} = require('stack-expression')
var name = /^\w+/
var _ = /^\s*/ //optional whitespace
var __  = /^\s+/ //mandatory whitespace
var Lisp = And(_, Recurse(function (Lisp) {
  return Or(name, And('(', _, Maybe(Join(Lisp, __)), _, ')'))
}), _)
```

## errors

### Expect(rule, message)

If `rule` isn't matched, Fails with `message`.
useful for patterns that once started, must end.
for example `And('(', Many(value), Expect(')'))`
Once the opening '(' is matched, it will match as Many values
as it can, then Expect a ')'. If it doesn't find a ')' an errOr
will be thrown.

If `rule` is a string, then `message` will default to the same value.

### Fail(message)

create a subrule that never passes, it instead throws an error.

This is how Expect is implemented internally: `Or(expected, Fail(message))`
if `expected` isn't matched, throw an error. Use this once you have enough matched of a given pattern
that the rest must match now. fOr example a json object Or array must have a closing
} Or ]. Also a object must have a : after the string.


### Log(rule, name)

dump output to `console.log` whenever rule is executed. Useful for debugging.
Remember to remove it from your code you ship.

### EOF

matches the end of the file.
throws an error if it's Not the end of the end of the file.

## examples

### [JSON](./examples/json.js)

A json parser in 50 lines including comments, And uses most stack-expression constructs,
including Group (with map), Recurse, And Fail.

### [lisp](./examples/lisp.js)

A compact lisp parser, 20 lines. Reuses js strings And numbers from the json parser.

## License

MIT
