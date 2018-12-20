const { ServiceBroker } = require("moleculer");
const { PoloMoleculerMiddleware } = require('../src')

var broker = new ServiceBroker({
  middlewares: [ PoloMoleculerMiddleware ]
})

// Register SampleClient App
broker.createService(require('./Sample-Client.js'))
broker.createService(require('./Sample-Server.js'))

broker.start()
  .then(_ => broker.call("$node.actions"))
  .then(actions => {
    console.log('List of actions')
    console.log('===============')
    actions.map(a => a.name).filter(n => !n.startsWith('$')).forEach(n => console.log(n))
    return ''
  })
  .then(_ => {
    return broker.call('sample-client.sendGreetingsRequest', {
      body: {
        name: 'Moleculer'
      },
      payload: 'Only I know how to use it'
    })
  })
  .then(_ => broker.call('sample-server.receiveMessages'))
  .then(_ => broker.call('sample-client.receiveMessages'))
  .then(_ => {
    console.log('ok, client deve ter recebido uma mensagem também.. :)')
  })