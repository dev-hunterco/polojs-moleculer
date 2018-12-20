const { PoloMoleculerMixin } = require('../src')
const sampleConfig = require('./sample_conf.json')

module.exports = {
  name: 'sample-server',
  mixins: [PoloMoleculerMixin],
  settings: {
    polo: Object.assign({app: 'Server'}, sampleConfig)
  },

  created () {
    this.receivedMessages = []
  },

  messages: {
    greetings: {
      onRequest (ctx) {
        this.receivedMessages.push(ctx.params)
        
        var message = ctx.params
        return message.reply({answer: `Hello ${message.body.name}`})
        }
    }
  },

  actions: {
    getReceivedMessages () {
      return this.receivedMessages
    }
  }
}