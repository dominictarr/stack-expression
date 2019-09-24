function concat (groups, m) {
  if(!m.groups) return groups
  if(groups) {
    if(Array.isArray(groups))
      return groups.concat(m.groups)
    else return [groups].concat(m.groups)
  }
  return m.groups
}

function matches (rule, input, start) {
  if('string' === typeof rule) {
    if(input.substring(start, start + rule.length) == rule)
      return {length: rule.length}
    return null
  }

  if('function' === typeof rule)
    return rule(input, start)

  var m = rule.exec(input.substring(start))
  if(m)
    return {length: m[0].length, groups: null}

  return null
}

function AND () {
  var args = [].slice.call(arguments)
  return function (input, start) {
    var groups = null, c = 0, m
    for(var i = 0; i < args.length; i++)
      if(m = matches(args[i], input, start + c)) {
        c += m.length
        groups = concat(groups, m)
      }
      else
        return null
    return {length: c, groups: groups}
  }
}

function OR () {
  var args = [].slice.call(arguments)
  return function (input, start) {
    var m
    for(var i = 0; i < args.length; i++)
      if(m = matches(args[i], input, start)) {
        return m
      }
    return null
  }
}

const EMPTY = AND()
const MAYBE = function (a) {
  return OR(a, EMPTY)
}

function MANY (a) {
  return function (input, start) {
    var c = 0, groups, m
    while(m = matches(a, input, start + c)) {
      c += m.length
      groups = concat(groups, m)
    }
    return {length: c, groups: groups}
  }
}

function MORE (a) {
  return AND(a, MANY(a))
}

function JOIN (a, separate) {
  return AND(a, MANY(AND(separate, a)))
}

function RECURSE () {
  var rule
  return function recurse (input, start) {
    if(!rule) {
      rule = input
      return recurse
    }
    return rule(input, start)
  }
}


function id (e) { return e }

function init (group, map, def) {
  return [(map || id)(group || def)]
}

function TEXT (rule, map) {
  return function (input, start) {
    var m
    if(m = matches(rule, input, start)) {
      return {length: m.length, groups: init(input.substring(start, start+m.length), map)}
    }
  }
}

//note, initialize with a double array [[]] because they'll be concatenated
//so an empty group will remain an empty array.
function GROUP (rule, map) {
  return function (input, start) {
    var m
    if(m = matches(rule, input, start)) {
      return {length: m.length, groups: init(m.groups, map, [])}
    }
  }
}

function line_col (input, start) {
  var lines = input.substring(0, start).split(/\r?\n/)
  //text editors seem to use 1-indexed lines and columns
  return (lines.length+1) + ':' + (lines.pop().length + 1)
}

function FAIL (message) {
  return function (input, start) {
    var end = input.indexOf('\n', start+20)
    throw new Error(message+' but found:'+(
      input.substring(start, ~end ? input.length : end).trim()
    )+(~end ? '...' :'') + '\n at position:'+start+'('+line_col(input, start)+')')
  }
}

module.exports = {AND, OR, EMPTY, MAYBE, MANY, MORE, JOIN, TEXT, GROUP, RECURSE, FAIL}
