#!/usr/bin/env node
var http = require('http')
var util = require('util')
var logger = require('loge')

var optimist = require('optimist')
.describe({
  hostname: 'hostname to listen on',
  port: 'port to listen on',

  help: 'print this help message',
  verbose: 'print extra output',
  version: 'print version',
})
.boolean(['help', 'verbose', 'version'])
.alias({verbose: 'v'})
.default({
  hostname: '127.0.0.1',
  port: 1443,
})

var argv = optimist.argv
logger.level = argv.verbose ? 'debug' : 'info'

if (argv.help) {
  optimist.showHelp()
}
else if (argv.version) {
  console.log(require('./package').version)
}
else {
  var controller = require('./controller')
  http.createServer(function(req, res) {
    var req_id = util.format('%s %s', req.method, req.url)
    console.time(req_id)
    req.on('end', function() {
      console.timeEnd(req_id)
    })

    res.setHeader('Access-Control-Allow-Origin', '*')
    // res.setHeader('Access-Control-Allow-Headers', 'X-Args');
    res.setHeader('Access-Control-Allow-Methods', '*')
    controller(req, res)
  }).listen(argv.port, argv.hostname, function() {
    logger.info('listening on http://%s:%d', argv.hostname, argv.port)
  })
}
