# Polo-Moleculer Module

The Polo-Moleculer module is a Moleculer mixin to enable services to exchange asyncronous integration messages, in a request/response fashion. Currently Polo supports AWS SQS but other transports may be added in the future.

# Getting Started

## Configuration
Before using Polo-Moleculer you must have a configuration object or file with some information like credentials and sqs options. More details about this configuration can be found in [Polo Messaging in GitHub](https://github.com/dev-hunterco/polo-nodejs).

```
{
  "stage":"test",
  "aws":{
    "api":{
      "accessKeyId": "foobar",
      "secretAccessKey": "foobar",
      "region": "us-east-1"
    },
    "sqs":{
      "create": true,
      "endpoint":"http://localhost:4576",
      "consume":{
        "MaxNumberOfMessages":1
      }             
    }
  }
}
```

## Broker Mixin

PoloMoleculer will inject actions to your service based on the messages defined (see examples bellow). To enable this injection you have to set a middleware in your broker.

```
const { PoloMoleculerMiddleware } = require('polo-moleculer')

var broker = new ServiceBroker({
  middlewares: [ PoloMoleculerMiddleware ]
})
```

## Service Provider


```
const { PoloMoleculerMixin } = require('polo-moleculer')
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
```