const { PoloMoleculerMixin } = require('../src')
const sampleConfig = require('./sample_conf.json')

module.exports = {
  name: 'sample-client',
  mixins: [PoloMoleculerMixin],
  settings: {
    polo: Object.assign({app: 'Client'}, sampleConfig)
  },

  created () {
    this.receivedMessages = []
  },

  messages: {
    greetings: {
      target: 'Server',

      onResponse (ctx) {
        this.receivedMessages.push(ctx.params)
        return ctx.params.done()
      }
    }
  },

  actions: {
    getReceivedMessages () {
      return this.receivedMessages || []
    },
  }
}