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
      schema: {
        name: "string"
      },

      onResponse (ctx) {
        this.logger.info('Received server greetings:', ctx.params.body.answer)
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