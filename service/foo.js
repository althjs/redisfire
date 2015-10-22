'use strict';

exports.bar = function(req, res) {
  res.send('hi there~');
}


var redisfire = require('redisfire/lib/index'),
  socket,
  projectName = 'redisfire-test';

redisfire.getIO().then(function(_io) {
  var io = _io.of('/test');

  io.on('connection', function (_socket) {
    socket = _socket;
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
}

// restful path test
exports['rest/:param1/:param2'] = function(req, res) {
  var pathParam = req.query._pathParam;
  res.send(pathParam);
}

// service also can return promise
exports.promise = function(req, res) {
  var deferred = require('q').defer();
  setTimeout(function() {
    deferred.resolve('Deferred promise resolve() return Service TEST');
  }, 100);
  return deferred.promise;
}

exports.promise_reject = function(req, res) {
  var deferred = require('q').defer();
  setTimeout(function() {
    deferred.reject('Deferred promise reject() return Service TEST');
  }, 100);
  return deferred.promise;
}
