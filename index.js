function isDefined (m) {
  return 'undefined' !== typeof m
}

function concat (groups, m) {
  if(m.groups == null) return groups
  if(groups) {
    if(Array.isArray(groups))
      return groups.concat(m.groups)
    else return [groups].concat(m.groups)
  }
  return m.groups
}

function matches (rule, input, start, end, groups) {
  if('string' === typeof rule)
    return input.startsWith(rule, start) ? rule.length : -1

  if('function' === typeof rule)
    return rule(input, start, end, groups)

  //regular expressions must have ^(?:...) around them.
  //but what is the fast way to ensure that is there?
  var m = rule.exec(input.substring(start))
  return m ? m[0].length : -1
}

function AND () {
  var args = [].slice.call(arguments)
  return function (input, start, end, groups) {
    var c = 0, m
    for(var i = 0; i < args.length; i++)
      if(~(m = matches(args[i], input, start + c, end, groups))) {
        c += m
      }
      else
        return -1
    return c //{length: c, groups: groups}
  }
}

function OR () {
  var args = [].slice.call(arguments)
  return function (input, start, end, groups) {
    var m
    for(var i = 0; i < args.length; i++) {
      if(~(m = matches(args[i], input, start, end, groups))) {
        return m
      }
    }
    return -1
  }
}

const EMPTY = AND()
const MAYBE = function (a) {
  return OR(a, EMPTY)
}

function MANY (a) {
  return function (input, start, end, groups) {
    var c = 0, m
    while(~(m = matches(a, input, start + c, end, groups)))
      c += m
    return c
  }
}

function MORE (a) {
  return AND(a, MANY(a))
}

function JOIN (a, separate) {
  return AND(a, MANY(AND(separate, a)))
}

// function RECURSE () {
  // var rule
  // return function recurse (input, start, end, groups) {
    // if(!rule) {
      // rule = input
      // return recurse
    // }
    
    // return rule(input, start, end, groups)
  // }
// }

function RECURSE (create) {
  var rule
  function wrapper (input, start, end, groups) {
    return rule(input, start, end, groups)
  }
  rule = create(wrapper)
  return wrapper
}


function id (e) { return e }

// function init (group, map, def, start) {
  // return [(map || id)(group || def, start)]
// }

function TEXT (rule, map) {
  return function (input, start, end, groups) {
    var m
    if(~(m = matches(rule, input, start, end, groups))) {
      groups.push((map || id)(input.substring(start, start + m)))
    }
    return m
  }
}

//note, initialize with a double array [[]] because they'll be concatenated
//so an empty group will remain an empty array.
function GROUP (rule, map) {
  return function (input, start, end, groups) {
    var _groups = []
    var m
    if(~(m = matches(rule, input, start, end, _groups))) {
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

function FAIL (message) {
  return function (input, start) {
    throw new Error(message+' but found:'+position(input, start))
  }
}

function EXPECT(rule, message) {
  if('string' === typeof rule)
    message = message || 'expected:'+rule
  return OR(rule, FAIL(message))
}

function LOG (rule, name) {
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

function NOT (rule) {
  return function (input, start) {
    return ~rule(input, start) ? -1 : 0
  }
}

function PEEK (rule) {
  return function (input, start) {
    return ~rule(input, start) ? 0 : -1
  }
}

function EOF (input, start) {
  if(start < input.length)
    throw new Error('expected end of file, found:'+position(input, start))
  else return 0
}

module.exports = {AND, OR, EMPTY, MAYBE, MANY, MORE, JOIN, TEXT, GROUP, RECURSE, FAIL, LOG, NOT, PEEK, EXPECT, EOF}
