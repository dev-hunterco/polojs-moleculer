
function createActions(schema) {
  return Object.keys(schema.messages)
    .map(m => {
      var definition = schema.messages[m]
      if(definition.onResponse) {
        return createOutgoingActions(schema, m, definition)
      } else {
        return createIncommingActions(schema, m, definition)
      }
    })
    .reduce((a, b) => Object.assign(a, b), {})
}

/***
 * Creates one action:
 * on<MessageName>Request(ctx): receives source's message
 */
function createIncommingActions(schema, name, definition) {
  var pascalCaseName = name.split('')
  pascalCaseName[0] = pascalCaseName[0].toUpperCase()
  pascalCaseName = pascalCaseName.join('')

  var onRequest = function (ctx) {
    var targetFnc = definition.onRequest.bind(this)

    // return definition.onRequest ( ctx )
    return targetFnc ( ctx )
  }
  var actions = {}
  actions[`on${pascalCaseName}Request`] = onRequest
  return actions
}

/***
 * Creates two actions:
 * send<MessageName>Request(ctx) {body, payload, conversationId}: sends a message to the targetApp
 * on<MessageName>Response(ctx): receives target's response
 */
function createOutgoingActions(schema, name, definition) {
  var pascalCaseName = name.split('')
  pascalCaseName[0] = pascalCaseName[0].toUpperCase()
  pascalCaseName = pascalCaseName.join('')

  var sendRequest = function(ctx) {
    var targetApp = definition.target || schema.settings.polo.app
    return this.sendRequest(targetApp, 'greetings', ctx.params)
  }

  var onResponse = function (ctx) {
    var targetFnc = definition.onResponse.bind(this)
    return targetFnc ( ctx )
  }

  var actions = {}
  actions[`send${pascalCaseName}Request`] = sendRequest
  actions[`on${pascalCaseName}Response`] = onResponse

  return actions
}

module.exports = {
  createService(next) {
    return function(schema, schemaMods) {
      if(schema.mixins && 
         schema.mixins.filter(m => m.__polo_moleculer_flag).length > 0 &&
         schema.messages) {

        // Create actions based on messages definitions
        var newActions = createActions(schema)
        var current = schema.actions || {}
        var finalActions = Object.assign(current, newActions)
        schema.actions = finalActions

        schema.settings.__poloMiddlewareFound = true
      }
      return next(schema, schemaMods);
    };
  },
}