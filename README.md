# Polo-Moleculer Module

The Polo-Moleculer module is a [Moleculer](https://github.com/moleculerjs/moleculer) mixin to enable services to exchange asyncronous integration messages, in a request/response fashion. Currently Polo supports AWS SQS but other transports may be added in the future.

# Configuration
Before using Polo-Moleculer you must have a configuration object or file with some information like credentials and sqs options. More details about this configuration can be found in [Polo Messaging in GitHub](https://github.com/dev-hunterco/polo-nodejs).

```json
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

# Broker Middleware

Polo-Moleculer will inject actions to your service based on the messages defined (see examples bellow). To enable this injection you have to set a middleware in your broker.

```javascript
const { PoloMoleculerMiddleware } = require('polo-moleculer')

var broker = new ServiceBroker({
  middlewares: [ PoloMoleculerMiddleware ]
})
```

# Service Provider

The following example creates a service that will receive _greetings_ requests. Notice that `onRequest` will be called when a new _greetings_ message is received.

```javascript
const { PoloMoleculerMixin } = require('polo-moleculer')
const sampleConfig = require('./sample_conf.json')

module.exports = {
  name: 'sample-server',
  mixins: [PoloMoleculerMixin],
  settings: {
    polo: Object.assign({app: 'Server'}, sampleConfig) // Identifies this app/service
  },

  messages: {
    greetings: {
      onRequest (ctx) {
        var message = ctx.params

        // Reads message's content and send a reply
        return message.reply({answer: `Hello ${message.body.name}`})
      }
    }
  }
}
```

# Service Consumer

To consume a service you'll need another service (likely in a remote app) that will send a _greetings_ message request and receive its response.

Polo-Moleculer will automatically create a `send<Message>Request` action that can be used to send a request to server (see [Using Service Consumer](#using-service-consumer)).
)

```javascript
const { PoloMoleculerMixin } = require('../src')
const sampleConfig = require('./sample_conf.json')

module.exports = {
  name: 'sample-client',
  mixins: [PoloMoleculerMixin],
  settings: {
    polo: Object.assign({app: 'Client'}, sampleConfig)
  },

  messages: {
    greetings: {
      target: 'Server', // Name of the target app (same defined in server's settings)

      onResponse (ctx) {
        var message = ctx.params
        // Could get some information from the message
        console.log(message.body.answer) // should print 'Hello <name>'

        return message.done()
      }
    }
  }
}
```

# Using Service Consumer

Once you have both services created, you can send messages to the server, through the client, like this:

```javascript
broker.call('sample-client.sendGreetingsRequest', {
  body: {
    name: 'Moleculer'
  }
})
  .then(receipt => console.log('Message sent !'))
```

# Receiving messages

All Polo-Moleculer services have a `receiveMessages` action that will load messages from the queue and start processing it (that is, call on<Message>Request or on<Message>Response actions). The number of messages read or waiting period can be set in the [Configurations](#configuration).

```javascript
broker.call('sample-server.receiveMessages')
  .then(numOfMessages => console.log(numOfMessages, 'were read/processed'))
```

You can also configure service to periodically read messages using a cron-like expression in settings:

```javascript
module.exports = {
  name: 'sample-server',
  mixins: [PoloMoleculerMixin],
  settings: {
    polo: Object.assign({app: 'Server'}, sampleConfig)
    readScheduling: '*/15 * * * * *', // checks queue every 15s
    autoRead = true // Automatically starts scheduling when service is created
  },
  ...

```

You can set `autoRead` to automatically start scheduler once service is started.
You can also start/stop scheduler by calling actions `startSchedule` and `stopSchedule`, respectively.
