const { ServiceBroker } = require("moleculer");
const { PoloMoleculerMiddleware } = require('../src')
const term = require( 'terminal-kit' ).terminal ;

var broker = new ServiceBroker({
  middlewares: [ PoloMoleculerMiddleware ]
})

// Register SampleClient App
var services = [require('./Sample-Client.js'), require('./Sample-Server.js')]

// Configure autoread schedule
services.forEach(s => {
  s.settings.autoRead = true,
  s.settings.readScheduling = '*/15 * * * * *'

  broker.createService(s)
})

var menuOptions = [
  {
    label: "Clear Screen",
    action: _ => term.clear()
  },
  {
    label: "Start Broker",
    action: _ => broker.start().then(_ => {
      term('broker is running\n');
    })
  },
  {
    label: "Send Message",
    action: _ => {
      var requestName = 'Request ' + parseInt(Math.random() * 100)
      broker.call('sample-client.sendGreetingsRequest', {body: {name: requestName}})
        .then(_ => {
          term.clear()
          term.moveTo(1, 5)
          term('Message Sent ! ' + requestName + '\n' )
        })
    }
  },
  {
    label: "Quit!",
    action: _ => process.exit(0)
  }
]

function showMenu() {
  term.moveTo( 1 , 1 )

  term.singleColumnMenu( menuOptions.map(o => o.label) , function( error , response ) {
    var action = menuOptions[response.selectedIndex].action

    term.moveTo(1, menuOptions.length + 3)

    action()
    showMenu()
  } ) ;
}

term.clear()
showMenu()

// broker.start()
//   .then(_ => go)
//   .then(_ => {
//     return broker.call('sample-client.sendGreetingsRequest', {
//       body: {
//         name: 'Moleculer'
//       },
//       payload: 'Only I know how to use it'
//     })
//   })
//   .then(_ => broker.call('sample-server.receiveMessages'))
//   .then(_ => broker.call('sample-client.receiveMessages'))
//   .then(_ => {
//     console.log('ok, client deve ter recebido uma mensagem também.. :)')
//   })