function Match (string) {
  return function (input, start, end) {
    return (
      end - start < string.length ? -1
    : input.startsWith(string, start) ? string.length
    : -1
    )
  }
}
function MatchRegexp (rule) {
  return function (input, start, end) {
    var m = rule.exec(input.substring(start, end))
    return m ? m[0].length : -1
  }
}

function toRule (r) {
  if('function' === typeof r) return r
  if('string'   === typeof r) return Match(r)
  if(r.exec)                  return MatchRegexp(r) //note, regexp must match start with ^
  throw new Error('not a valid rule:' + r)  
}

function And () {
  var args = [].map.call(arguments, toRule)
  return function (input, start, end, groups) {
    var c = 0, m
    for(var i = 0; i < args.length; i++)
      if(~(m = args[i](input, start + c, end, groups))) {
        c += m
      }
      else
        return -1
    return c //{length: c, groups: groups}
  }
}

function Or () {
  var args = [].map.call(arguments, toRule)
  return function (input, start, end, groups) {
    var m
    for(var i = 0; i < args.length; i++) {
      if(~(m = args[i](input, start, end, groups))) {
        return m
      }
    }
    return -1
  }
}

const Empty = And()
const Maybe = function (a) {
  return Or(a, Empty)
}

function Many (rule) {
  rule = toRule(rule)
  return function (input, start, end, groups) {
    var c = 0, m
    while(~(m = rule(input, start + c, end, groups)))
      c += m
    return c
  }
}

function More (a) {
  return And(a, Many(a))
}

function Join (a, separate) {
  return And(a, Many(And(separate, a)))
}

function Recurse (create) {
  var rule
  function wrapper (input, start, end, groups) {
    return rule(input, start, end, groups)
  }
  rule = create(wrapper)
  return wrapper
}


function id (e) { return e }

function Text (rule, map) {
  rule = toRule(rule)
  return function (input, start, end, groups) {
    var m
    if(~(m = rule(input, start, end, groups))) {
      groups.push((map || id)(input.substring(start, start + m)))
    }
    return m
  }
}

//note, initialize with a double array [[]] because they'll be concatenated
//so an empty group will remain an empty array.
function Group (rule, map) {
  rule = toRule(rule)
  return function (input, start, end, groups) {
    var _groups = []
    var m
    if(~(m = rule(input, start, end, _groups))) {
        groups.push((map || id)(_groups))
    }
    return m
  }
}

function line_col (input, start) {
  var lines = input.substring(0, start).split(/\r?\n/)
  //text editors seem to use 1-indexed lines and columns
  return (lines.length+1) + ':' + (lines.pop().length + 1)
}

function position (input, start) {
  var end = input.indexOf('\n', start+20)
  return input
    .substring(
      start, ~end ? end : Math.min(input.length, start + 1000)
    ).trim() +
    (~end ? '...' :'') + '\n at:'+line_col(input, start)+
    ', ('+start+')'
}

function Fail (message) {
  return function (input, start) {
    throw new Error(message+' but found:'+position(input, start))
  }
}

function Expect (rule, message) {
  if('string' === typeof rule)
    message = message || 'expected:'+rule
  return OR(rule, FAIL(message))
}

function Log (rule, name) {
  return function (input, start) {
    console.log('<'+name, input.substring(start, start+20)+'...')
    var m = matches(rule, input, start)
    if(~m)
      console.log('>', input.substring(start, start + m.length), m)
    else
      console.log('> no match')
    return m
  }
}

function Not (rule) {
  return function (input, start) {
    return ~rule(input, start) ? -1 : 0
  }
}

function Peek (rule) {
  return function (input, start) {
    return ~rule(input, start) ? 0 : -1
  }
}

function EOF (input, start) {
  if(start < input.length)
    throw new Error('expected end of file, found:'+position(input, start))
  else return 0
}

module.exports = {And, Or, Empty, Maybe, Many, More, Join, Text, Group, Recurse, Fail, Log, Not, Peek, Expect, EOF}
