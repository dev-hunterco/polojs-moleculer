require('should')
const { ServiceBroker } = require("moleculer");
const { PoloMoleculerMiddleware } = require('../src')

describe('Messaging Tests',function() {  
  describe('Send and receive message', function() {
    var broker = new ServiceBroker({
      middlewares: [
        PoloMoleculerMiddleware
      ]
    })

    // Register SampleClient App
    broker.createService(require('./Sample-Client.js'))
    broker.createService(require('./Sample-Server.js'))

    before(() => broker.start());

    it('Send and receive message', function(done) {
      this.timeout(30000);

      broker.call('sample-client.sendGreetingsRequest', {
        body: {
            name: 'Moleculer'
        }
      })
      .then(_ => broker.call('sample-server.receiveMessages'))
      .then(qtd => {
        qtd.should.be.eql(1);
        return broker.call('sample-server.getReceivedMessages')
      })
      .then(msgs => {
        msgs.length.should.be.eql(1)
        return broker.call('sample-client.receiveMessages')
      })
      .then(qtd => {
        qtd.should.be.eql(1);
        return broker.stop()
      })
      .then(_ => broker.call('sample-client.getReceivedMessages'))
      .then(msgs => {
        msgs.length.should.be.eql(1);
        msgs[0].body.answer.should.be.eql('Hello Moleculer')
        done()
      })
      .catch(error => {
          done(error);
      });
    })
  })
})

