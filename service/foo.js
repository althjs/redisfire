'use strict';

exports.bar = function(req, res) {
  res.send('hi there~');
};

var redisfirePath = (require('fs').existsSync(require('path').join(__dirname + './../lib/index.js')) ? './../lib/index' : 'redisfire/lib/index');
var redisfire = require(redisfirePath),
  projectName = 'redisfire-test',
  socket_client,
  $q = require('q');

redisfire.getIO().then(function(_io) {
  var io = _io.of('/redis');

  console.log('FOO SOCKET /test initialized');

  var socketHost = 'http://localhost:' + (/(instrument|travis)/.test(__dirname) ? '3001' : process.env.PORT) + '/redis';
  socket_client = require('socket.io-client')(socketHost);
  socket_client.on('connect', function(){
    console.log('FOO SOCKET connected');
  });
});


// init redisfire mocha test
exports.init_test = function(req, res) {
  // STEP1: clean & ready redifire mock database (projectName: redisfire-test)
  redisfire.redis_helper.getHashAllData(projectName).then(function(o) {
    var k,
      keys = [];

    for (k in o) {
      keys.push(k);
    }
    redisfire.redis_helper.redisHDEL(projectName, keys).then(function(o) {

      var exec = require('child_process').exec,
        command = 'node ' + require('path').join(__dirname +
          (require('fs').existsSync(require('path').join(__dirname + './../bin/redisfire-import')) ? './../bin/redisfire-import' : './../redisfire/bin/redisfire-import')) +
            ' _sample_data/theverge.json redisfire-test';


      exec(command, function(error, stdout, stderr) {
        if (error) {
          console.log(error);
          res.send('FAIL');
          return;
        }
        redisfire.redis_helper.redisHKEYS(projectName);
        res.send('SUCCESS');
      });

    }, function(err) {
      console.log(err);
      res.send('FAIL');
    });

  }, function(err) {
    res.send(err);
  });
};

// restful path test
exports['rest/:param1/:param2'] = function(req, res) {
  var pathParam = req.query._pathParam;
  res.send(pathParam);
};

// service also can return promise
exports.promise = function(req, res) {
  var deferred = require('q').defer();
  setTimeout(function() {
    deferred.resolve('Deferred promise resolve() return Service TEST');
  }, 100);
  return deferred.promise;
};

exports.promise_reject = function(req, res) {
  var deferred = require('q').defer();
  setTimeout(function() {
    deferred.reject('Deferred promise reject() return Service TEST');
  }, 100);
  return deferred.promise;
};



function socketGetTest() {
  var deferred = $q.defer();
  socket_client.emit('GET', 'redisfire-test/feed/entry/2/author/name', {foo:'bar'});
  socket_client.on('redisfire', function(eventType, sres, params){
    if (eventType === 'GET') {
      deferred.resolve({
        res: sres,
        params: params
      });
    }
  });
  return deferred.promise;
}

function socketPostTest() {
  var deferred = $q.defer();
  socket_client.emit('POST', 'redisfire-test/feed/entry/2/author/name2', {hello: 'WORLD'}, {foo:'bar'});
  socket_client.on('redisfire', function(eventType, sres, params){
    if (eventType === 'POST') {
      deferred.resolve({
        res: sres,
        params: params
      });
    }
  });
  return deferred.promise;
}

function socketPutTest() {
  var deferred = $q.defer();
  socket_client.emit('PUT', 'redisfire-test/feed/entry/2/author', {name: 'Jongsoon'}, {foo:'bar'});
  socket_client.on('redisfire', function(eventType, sres, params){
    if (eventType === 'PUT') {
      deferred.resolve({
        res: sres,
        params: params
      });
    }
  });
  return deferred.promise;
}

function socketDeleteTest() {
  var deferred = $q.defer();
  socket_client.emit('DELETE', 'redisfire-test/feed/entry/2/author/name2', {foo:'bar'});
  socket_client.on('redisfire', function(eventType, sres, params){
    if (eventType === 'DELETE') {
      deferred.resolve({
        res: sres,
        params: params
      });
    }
  });
  return deferred.promise;
}

exports.socket_test = function(req, res) {

  var type = req.query.type || 'GET';

  switch(type) {
    case 'GET':
      socketGetTest().then(function(o) {
        res.send(o);
      });
      break;
  case 'POST':
      socketPostTest().then(function(o) {
        res.send(o);
      });
      break;
  case 'PUT':
      socketPutTest().then(function(o) {
        res.send(o);
      });
      break;
  case 'DELETE':
      socketDeleteTest().then(function(o) {
        res.send(o);
      });
      break;
  }
};
