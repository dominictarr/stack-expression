# stack-expression

stack expressions are similar to regular expressions, but can parse nested structures.

I had tried out a few parsing libraries. I tried nearley, it was easy to write
the grammar but hard to debug the ast. chevotrain looked, good, but then it had a silly
DSL and looked like way too much code. Another time I had played around with PEGjs
but the parser it generated was way too slow.

How hard could it really be?

(update, looks like this is a [Parsing Expression Grammar](https://en.wikipedia.org/wiki/Parsing_expression_grammar))

To understand how this _really works_ I recommend reading [the explainer](./explain.md)
(and also the code, of course!)

## example: CSV parser (JOIN, GROUP, TEXT)

Here is the simplest useful example that you can't do with regular expressions.
You can't write a CSV parser that groups things into cells and lines.
csv actually is a [regular language](https://en.wikipedia.org/wiki/Regular_language),
the limitation here is how capture groups work in regular expressions.

``` js
var {JOIN,GROUP,TEXT} = require('stack-expression')
var cell = /^[\w ]*/
var CSV = JOIN(GROUP( JOIN(TEXT(cell), ',') ), '\n')
console.log(CSV('a,b,c\nd,e,f', 0).groups)
=> [ [a, b, c], [d, e, f] ]
```

In this library, the TEXT capture group is used to capture those characters directly.
so there is a capture around the cell, `TEXT(cell)` then around that is a `JOIN` (to get lines)
and then another capture, GROUP, to get the line as a group `GROUP(JOIN(CATCH(cell), ','))`

A repeating pattern with a separator is a very common pattern, but a pain
to describe in a regular expression: `pattern (separator pattern)*`
JOIN is just a built in support that takes a pattern and a seperator and does this for you.
(I named it join, because it's similar to the join method on a javascript array)

## regular patterns: AND, OR, MAYBE, MANY, MORE

### AND(subrules...)

only match if all sub rules match.

### OR(subrules...)

match the first of any matching subrules.

### MAYBE (subrule)

if subrule matches, return that match, else allow an empty match.
The same as `OR(subrule, EMPTY)` where `EMPTY = AND()`

### MANY (subrule)

match subrule 0 or more times, like `*` in regular expressions.

### MORE (subrule)

match subrule 1 or more times, like `+` in regular expressions.

It's just a shortcut for `AND(subrule, MANY(subrule))`

### JOIN(item, separator)

join one or more `items` by `separator`.
shortcut for `AND(item, MANY(AND(separator, item)))`
To allow an empty list, use `MAYBE(JOIN(item, separator))`

> note: might add an option to join to allow empty list.

## capturing groups: TEXT, GROUP

### TEXT(subrule, map?)

capture the text matched in a subrule.
map is an optional function that will be applied to a matched group.

### GROUP(subrule, map?)

capture any subgroups into a collection. If there are no subgroups,
but the subrule matches, an empty array is returned.

the optional map function will be applied to the groups as a whole.

## recursion

### RECURSE() => subrule

return a subrule that may refer to itself. It's necessary to declare the recursive rule
at the start, so that you can pass the rule to itself as a subrule.

> The clauses above all return a function that does they thing. To define a recursive
stack expression we need to call the function, and also pass that function to itself
as an argument.

The following is a lisp-like parser, that accepts nested lists of printable
characters separated by space, surrounded by parens. (the CATCHes have been left out
for clarity)

``` js
var {RECURSE,AND,MAYBE,JOIN,OR} = require('stack-expression')
var list = RECURSE()
var value = /^\w+/
list(AND('(', MAYBE(JOIN(OR(value | list), space)), ')'))
```

## errors

### FAIL(message)

create a subrule that never passes, it instead throws an error.

to use, put inside a `OR(expected, FAIL(message))` if expected isn't matched,
throw an error. Use this once you have enough matched of a given pattern
that the rest must match now. for example a json object or array must have a closing
} or ]. Also a object must have a : after the string.

### LOG(rule, name)

dump output to `console.log` whenever rule is executed. Useful for debugging.
Remember to remove it from your code you ship.

## examples

### [JSON](./examples/json.js)

A json parser in 50 lines including comments, and uses most stack-expression constructs,
including GROUP (with map), RECURSE, and FAIL.

### [lisp](./examples/lisp.js)

A compact lisp parser, 20 lines. Reuses js strings and numbers from the json parser.


## License

MIT
