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

function MAYBE (a) {
  return function (input, start) {
    var m
    if(m = matches(a, input, start))
      return m
    return {length: 0, groups: null}
  }
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

exports.OR = OR
exports.AND = AND
exports.MAYBE = MAYBE
exports.MANY = MANY
exports.MORE = function (a) {
  return AND(a, MANY(a))
}

exports.JOIN = function (a, separate) {
  return AND(a, MANY(AND(separate, a)))
}

exports.RECURSE = function () {
  var rule
  return function recurse (input, start) {
    if(!rule) {
      rule = input
      return recurse
    }
    return rule(input, start)
  }
}

exports.CATCH = function (rule) {
  return function (input, start) {
    var m
    if(m = matches(rule, input, start)) {
      if(m.groups) m = {length: m.length, groups: [m.groups]}
      else m = {length: m.length, groups: input.substring(start, start+m.length)}
      return m
    }
  }
}
