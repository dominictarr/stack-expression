
## how it works

this module is very simple, it's more a pattern that a library.

The basic pattern is:

``` js
function createRule (args) {
  return function rule (input, start) {
    if(matched?)
      return length_of_match
  }
}
```

create functions that take some arguments, and return a rule. A rule is a function
that takes an input string, and a start position.

There are two types of rules we need to do anything interesting AND and OR.
Lets start with AND.

## AND

```
function AND (args...) {
  return function (input, start) {
    var c = 0
    for(var i = 0; i < args.length; i++) {
      var m = matches(args[i], input, start+c)
      if(m >= 0) c += m
      else return
    }
    return c
  }
}
```
AND takes a list of rules, and matches each of them in order.
If a rule matched, it returns the number of characters matched
(some rules can match zero, but that's later)

To actuall run this, we need to know what `matches` looks like.
(We'll add more to this later)

``` js
function matches (rule, input, start) {
  if('string' == typeof rule)
    if(input.startsWith(rule, start))
      return rule.length

  //returning -1 means we didn't match anything.
  return -1
}
```

With AND we can accept patterns that match all the elements in the rule.

``` js
var abc = AND('A', 'B', 'C')
console.log(abc('abc', 0))
// => 3
```

## OR

This isn't very useful yet, but it will be soon, we need OR.
Or looks similar, but it returns the first match it finds and fails if none match.

``` js
function OR (args...) {
  return function (input, start) {
    for(var i = 0; i < args.length; i++) {
      var m = matches(args[i], input, start+c)
      if(m => 0) return m
    }
  }
}
```

Now, we need to improve `matches`, so that rules can accept subrules.

``` js
function matches (rule, input, start) {
  if('string' == typeof rule)
    if(input.startsWith(rule, start))
      return rule.length

  if('function' === typeof rule)
    return rule(input, start)

  //returning -1 means we didn't match anything.
  return -1
}
```

Okay, now we are getting somewhere! we can do things like this:

``` js
var AbcD = AND('A', OR('B', 'C'), 'D')

AbcD('ABD', 0) // => 3
AbcD('ACD', 0) // => 3
```
Now we are actually expressing patterns and matching multiple patterns!

## MAYBE

we can already use these two simple things to define other useful things.

``` js
var EMPTY = AND() //matches an empty list!
var MAYBE = function (a) {
  return OR(a, EMPTY)
}

var AxB = AND('A', MAYBE('x'), 'B')

AxB('AB') // => 2 //matches 2
AxB('AxB') // => 3 //matches 3! with optional "x"
```

## MANY

many is similar again, but we want to match one rule many times.

``` js
function MANY (rule) {
  return function (input, start) {
    var m, c = 0
    while(0 <= (m = matches(rule, input, start+c)))
      c += m //increment starting position by matched amount
    return c
  }
}
```

just keep on increasing the start position until something doesn't match,
then return the characters matched.

``` js
var aaaB = AND(MANY('a'), 'B')
aaaB('aB') // => 2
aaaB('aaaB') // => 4
aaaB('B') // => 0
```
MANY matches zero or more items. If you are familiar with regular expressions,
you'll know the `+` operator, which matches one or more items.
That can be expressed using AND and MANY.

``` js
var more = function (rule) {
  return AND(rule, MANY(rule))
}
```
The MANY we wrote is greedy. It will match as many items as it can,
If you put it first it won't work, because it will also match the last item,
then the AND will fail.

To actually use this to match a complex real-worldy pattern such as a email address,
well that has lots of letters, we'd have to type out all the letters of the alphabet!
that doesn't sound like fun. Regular Expressions can already represent ranges, so
lets add that to `matches`

``` js
function matches (rule, input, start) {
  if('string' == typeof rule)
    if(input.startsWith(rule, start))
      return rule.length

  if('function' === typeof rule)
    return rule(input, start)

  if(rule.exec) {
    var m = rule.exec(input.substring(start))
    return m.length
  }
  //returning -1 means we didn't match anything.
  return -1
}
```

There are quite a few things you can match now!

### GROUPS

But we don't just want to parse patterns, we want to get data out.
