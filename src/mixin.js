const PoloMessaging = require('hunterco-polo');
const schedule = require('node-schedule')
const { MoleculerError } = require("moleculer").Errors;

module.exports = {
  __polo_moleculer_flag: true,
  created () {
    if (!this.settings.polo) {
      this.logger.error('No configuration for PoloMessaging found. Service cannot be used')
      throw new MoleculerError("PoloConfiguration not set", 1, "POLO_MESSAGING_NOT_FOUND");
    }
    // Check if middleware is set
    if (!(this.settings || {}).__poloMiddlewareFound) {
      this.logger.error('PoloMoleculer Middleware not set on broker.')
      throw new MoleculerError("PoloMiddleware not set", 1, "POLO_MIDDLEWARE_NOT_SET");
    }

    this.settings.polo.app = this.settings.polo.app || this.name
    this.logger.info('Loading Polo Message for app ' + this.settings.polo.app)
    this.messagingAPI = new PoloMessaging(this.settings.polo);

    this.readMsgJob = null
    this.readingInProgress = false
  },

  started(ctx) {
    return this.messagingAPI.initializeSQS()
      .then(_ => {
        this.logger.info('Queue initialized');
        var messages = this.detectMessages()

        messages.input.forEach(m => {
          this.messagingAPI.onRequest (m, this.receiveIncomingMessage.bind(this))
          var targetAction = `on${this.changeFirstChar(m, c => c.toUpperCase())}Request`
          this.logger.info(targetAction, 'configured to input message', m)
        })
        messages.output.forEach(m => {
          this.messagingAPI.onResponse (m, this.receiveIncomingMessage.bind(this))
          var targetAction = `on${this.changeFirstChar(m, c => c.toUpperCase())}Response`
          this.logger.info(targetAction, 'configured to output message', m)
        })
      })
      // Check if should start scheduler
      .then(_ => {
        if (this.settings.readScheduling && this.settings.autoRead) {
          this.logger.info(`Auto Reading schedule: ${this.settings.readScheduling}. Starting Job`)
          this.actions.startSchedule()
        }
      })
  },

  actions: {
    receiveMessages (ctx) {
      if(this.readingInProgress) {
        this.logger.info('Still reading messages, aborting new loop')
      } else {
        this.logger.debug('Reading incoming messages...')
        this.readingInProgress = true
        return this.messagingAPI.readMessages()
          .then(qtd => {
            this.readingInProgress = false
            return qtd
          })
      }
    },

    startSchedule (ctx) {
      var scheduleExpr = (ctx||{params: {}}).params.scheduling || this.settings.readScheduling
      if(!scheduleExpr) {
        this.logger.warn('No Schedulling expression was set. Job will not be started.')
        return
      }

      // Stops job if is already set
      if(this.readMsgJob) {
        this.readMsgJob.cancel()
      }

      var _this = this
      this.readMsgJob = schedule.scheduleJob(scheduleExpr, function() {
        _this.broker.call(`${_this.name}.receiveMessages`)
          .then(qtd => {
            if(qtd > 0) {
              _this.logger.info(qtd, 'messages read')
            }
          })
      });
    },

    stopSchedule (ctx) {
      if(this.readMsgJob) {
        this.readMsgJob.cancel()
      }
    }
  },

  methods: {
    changeFirstChar(stringValue, fnc) {
      var msgArray = stringValue.split('')
      msgArray[0] = fnc(msgArray[0])
      return msgArray.join('')
    },

    detectMessages () {
      // Detectores de chamadas a serviços externos
      const requestDetector = /^send(\S+)Request$/
      const requestResponseDetector = /^on(\S+)Response$/

      // Detectores de métodos de resposta
      const serviceDetector = /^on(\S+)Request$/

      const detector = (regex, actions) => Object.keys(actions)
        .filter(action => regex.test(action))
        .map(action => regex.exec(action)[1])
        .map(message => this.changeFirstChar(message, c => c.toLowerCase()))

      var requestMessages = detector(requestDetector, this.actions)
      var requestResponseMessages = detector(requestResponseDetector, this.actions)
      var serviceMessages = detector(serviceDetector, this.actions)
      var requestMethods = requestMessages.filter(m => requestResponseMessages.indexOf(m) >= 0)

      // Loga caso algum método não tenha sido definido com os dois métodos
      // Como o requestMethods sempre vai ter o que bate nos dois, 
      // o que sobra no request é falta de response e o que sobra no response é falta de request
      if(requestMethods.length !== requestResponseMessages.length) {
        requestResponseMessages.filter(m => requestMethods.indexOf(m) <= 0)
          .forEach(m => {
            this.logger.warn(`Could not find send${this.changeFirstChar(m, c => c.toUpperCase())}Request action. The following output message wil be ignored:`, m)
          })
      }
      if(requestMethods.length !== requestMessages.length) {
        requestMessages.filter(m => requestMethods.indexOf(m) <= 0)
          .forEach(m => {
            this.logger.warn(`Could not find on${this.changeFirstChar(m, c => c.toUpperCase())}Response action. The following output message wil be ignored:`, m)
          })
      }

      return {
        input: serviceMessages,
        output: requestMethods
      }
    },

    sendRequest(targetApp, event, message) {
      return this.messagingAPI.sendRequest(targetApp, event, message.body, message.payload, message.conversationId)
    },

    receiveIncomingMessage(message) {
      switch (message.type) {
        case 'request':
          var targetAction = `on${this.changeFirstChar(message.service, c => c.toUpperCase())}Request`
          this.logger.info('Invoking', targetAction)
          return this.broker.call(this.name + '.' + targetAction, message)
        case 'response':
          var targetAction = `on${this.changeFirstChar(message.service, c => c.toUpperCase())}Response`
          this.logger.info('Invoking', targetAction)
          return this.broker.call(this.name + '.' + targetAction, message)
      
        default:
          this.logger.error('Received error message:', message)
          break;
      }
      if(message.type === 'request') {

      } else {

      }
    }
  }
}