'use strict';

exports.bar = function(req, res) {
  res.send('hi there~');
};

var fs = require('fs'),
  path = require('path');

var redisfirePath = (fs.existsSync(path.join(__dirname + './../lib/index.js')) ? path.join(__dirname + './../lib/index') : path.join(__dirname + '/../redisfire/lib/index'));
console.log('FOO redisfirePath:', redisfirePath);
var redisfire = require(redisfirePath),
  projectName = 'redisfire-test',
  socket_client,
  $q = require('q');


var socketHost = 'http://localhost:' + (/(instrument|travis)/.test(__dirname) ? '3001' : process.env.PORT) + '/redis';
socket_client = require('socket.io-client')(socketHost);
// socket_client.on('connect', function(){
//   console.log('FOO SOCKET redis_test connected to socketHost:', socketHost);
// });

redisfire.getIO().then(function(_io) {
  var foo_namespace = _io.of('/redis_foo');

  console.log('FOO SOCKET /redis_foo initialized');

  foo_namespace.on('connection', function(socket){
    console.log('FOO someone connected to redis_foo namespace');
    socket.emit('hi', {message: 'emulate new socket.io namespace'});
  });

  var socketHost = 'http://localhost:' + (/(instrument|travis)/.test(__dirname) ? '3001' : process.env.PORT) + '/redis_foo';
  var client = require('socket.io-client')(socketHost);
  client.on('connect', function(){
    console.log('FOO SOCKET redis_foo connected to socketHost:', socketHost);
  });

  client.on('hi', function(data) {
    console.log('FOO event: ' + JSON.stringify(data));
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
            ' _sample_data/theverge.json redisfire-test -s -d "Redisfire Test Project"';


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
  var pathParam = req.params;
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



function socketGetTest(key) {
  var deferred = $q.defer();

  socket_client.emit('GET', (key || 'redisfire-test/feed/entry/2/author/name'), {foo:'bar'});
  socket_client.on('redisfire', function(eventType, sres, params){
    if (eventType === 'GET') {
      deferred.resolve({
        res: sres,
        params: params
      });
    }
  }, function(err) {
      deferred.resolve({
        res: err
      });
  });
  return deferred.promise;
}

function socketPostTest(key) {
  var deferred = $q.defer();
  socket_client.emit('POST', (key || 'redisfire-test/feed/entry/2/author/name2'), {hello: 'WORLD'}, {foo:'bar'});
  socket_client.on('redisfire', function(eventType, sres, params){
    if (eventType === 'POST') {
      deferred.resolve({
        res: sres,
        params: params
      });
    }
  }, function(err) {
      deferred.resolve({
        res: err
      });
  });
  return deferred.promise;
}

function socketPutTest(key) {
  var deferred = $q.defer(key);
  socket_client.emit('PUT', (key || 'redisfire-test/feed/entry/2/author'), {name: 'Jongsoon'}, {foo:'bar'});
  socket_client.on('redisfire', function(eventType, sres, params){
    if (eventType === 'PUT') {
      deferred.resolve({
        res: sres,
        params: params
      });
    }
  }, function(err) {
      deferred.resolve({
        res: err
      });
  });
  return deferred.promise;
}

function socketDeleteTest(key) {
  var deferred = $q.defer();
  socket_client.emit('DELETE', (key || 'redisfire-test/feed/entry/2/author/name2'), {foo:'bar'});
  socket_client.on('redisfire', function(eventType, sres, params){
    if (eventType === 'DELETE') {
      deferred.resolve({
        res: sres,
        params: params
      });
    }
  }, function(err) {
      deferred.resolve({
        res: err
      });
  });
  return deferred.promise;
}

exports.redis_helper_del = function(req, res) {

  redisfire.redis_helper.redisHDEL('redisfire-test', 'redisfire-test>feed>entry@>0>published').then(function(cnt) {
    console.log('DELETE COUNT:', cnt);
    res.send('SUCCESS');
  });
};

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

exports.socket_test_error = function(req, res) {

  // GET Socket Error Test
  socketGetTest('redisfire-test/feed/entry/2/author/name_error').then(function(o) {
    if (o.res.code === 'FAIL') {

      // POST Socket Error Test
      socketPostTest('redisfire-test/').then(function(o) {
        if (o.res.code === 'FAIL') {

          // PUT Socket Error Test
          socketPutTest('redisfire-test/feed/entry/2/author_error').then(function(o) {
            if (o.res.code === 'FAIL') {

              // DELETE Socket Error Test
              socketDeleteTest('redisfire-test/feed/entry/2/author/name2_error').then(function(o) {
                if (o.res.code === 'FAIL') {
                  res.send(true);
                } else {
                  res.send(o);
                }
              });
              // res.send(true);
            } else {
              res.send(o);
            }
          });
          // res.send(true);
        } else {
          res.send(o);
        }
      });
      // res.send(true);
    } else {
      res.send(o);
    }
  });
};


exports.port_already_occupied = function (req, res) {
  var exec = require('child_process').exec,
  command = 'node ' + path.join(__dirname + './../redisfire/bin/www');

  if (/(travis)/.test(__dirname)) {
    command = 'node ' + path.join(__dirname + './../bin/www');
  }

  console.log('port_already_occupied command:', command);
  try {
    exec(command, function(error, stdout, stderr) {
      if (/Port 3001 is already in use/.test(stderr)) {
        res.send('Port 3001 is already in use\n');
      } else {
        res.send(stderr);
      }
    });
  } catch(e) {
    res.send('port_already_occupied err:', e.message);
  }

};

exports.redisfire_cli = function (req, res) {
  var exec = require('child_process').exec,
  command = 'node ' + path.join(__dirname + './../redisfire/bin/redisfire');

  if (/(travis)/.test(__dirname)) {
    command = 'node ' + path.join(__dirname + './../bin/redisfire');
  }

  console.log('redisfire_cli command:', command + ' start -p 3001');
  try {
    exec(command + ' start -p 3001', function(error, stdout, stderr) {
      if (/Port 3001 is already in use/.test(stderr)) {
        console.log('redisfire_cli command:', command);
        exec(command, function(error, stdout, stderr) {
          if (/Usage: redisfire <start|stop|status>/.test(stdout)) {
            exec(command + ' start -p 80', function(error, stdout, stderr) {
              if (/Port 80 requires elevated privileges/.test(stderr)) {
                res.send(true);
              } else {
                res.send(false);
              }
            });

          } else {
            res.send(false);
          }
        });
      } else {
        res.send(false);
      }
    });
  } catch(e) {
    res.send('port_already_occupied err:', e.message);
  }
};

exports.redisfire_import_cli = function (req, res) {
  var exec = require('child_process').exec,
  command = 'node ' + path.join(__dirname + './../redisfire/bin/redisfire-import');

  if (/(travis)/.test(__dirname)) {
    command = 'node ' + path.join(__dirname + './../bin/redisfire-import');
  }

  console.log('redisfire_import_cli command:', command);
  try {
    exec(command, function(error, stdout, stderr) {
        console.log(stdout);
      if (/Usage: redisfire-import <fileName> <projectName/.test(stdout)) {

        exec(command + ' --help', function(error, stdout, stderr) {
                  console.log(stdout);
          res.send(/Usage: redisfire-import <fileName> <projectName/.test(stdout));
        });
      } else {
        res.send(false);
      }
    });
  } catch(e) {
    res.send('port_already_occupied err:', e.message);
  }
};

// init redisfire mocha test (for Authentication)
exports.init_test_auth = function(req, res) {
  var projectName = 'redisfire-test-auth';
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
            ' _sample_data/theverge.json redisfire-test-auth -s -d "Redisfire Auth Test Project"';


      exec(command, function(error, stdout, stderr) {
        if (error) {
          console.log(error);
          res.send('FAIL');
          return;
        }
        redisfire.redis_helper.redisHKEYS(projectName);

        setTimeout(function() {
          var client = redisfire.redis_helper.getRedisClient();
          var keys = [
            "redisfire-test-auth-member>member_12345>key",
            "redisfire-test-auth-member>member_12345>info>foo",
            "redisfire-test-auth-member>member_12345>other_info"
          ];
          client.hdel(projectName + '-member', keys[0], function (error, tf) {
              client.hdel(projectName + '-member', keys[1], function (error, tf) {
                client.hdel(projectName + '-member', keys[2]);

                redisfire.redis_helper.cache['redisfire-test-auth-member'] = [];
                res.send('SUCCESS');
              });
          });
        }, 500);


      });

    }, function(err) {
      console.log(err);
      res.send('FAIL');
    });

  }, function(err) {
    res.send(err);
  });
};


exports.auth_test_get = function(req, res) {

  // GET Socket Error Test
  socketGetTest('redisfire-test-auth/feed/entry/2/').then(function(o) {
    if (o.res.code === 'FAIL') {
      res.send(o);
    } else {
      res.send(o);
    }
  });
};


exports.auth_test_member_get = function(req, res) {

  // GET Socket Error Test
  socketGetTest('redisfire-test-auth/feed/entry/2/').then(function(o) {
    if (o.res.code === 'FAIL') {

      // POST Socket Error Test
      socketPostTest('redisfire-test-auth-member/').then(function(o) {
        if (o.res.code === 'FAIL') {

          res.send(o);

        } else {
          res.send(o);
        }
      });
    } else {
      res.send(o);
    }
  });
};



exports.auth_test_setUser = function(req, res) {

  var user = {
    key: 'member_12345',
    info: {foo: 'bar'},
    other_info: "blablabla"
  };
  redisfire.setUser('redisfire-test-auth', user, req).then(function(o) {

    res.send(o);
  });
};

exports.auth_test_setUser_fail = function(req, res) {

  var user = {
    key: 'member_12345',
    info: {foo: 'bar'},
    other_info: "blablabla"
  };
  redisfire.setUser('redisfire-test-auth-unknown-project', user, req).then(function(o) {
    res.send(o);
  }, function(err) {
    res.send(err);
  });
};



exports.auth_test_getUser = function(req, res) {
  req.cookies['redisfire-test-auth-key'] = 'member_12345';
  redisfire.getUser('redisfire-test-auth', req).then(function(o) {
    res.send(o);
  });
};


exports.auth_test_getUser_fail = function(req, res) {
  req.cookies['redisfire-test-auth-key'] = 'member_12345_unknown_user';
  redisfire.getUser('redisfire-test-auth', req).then(function(o) {
    res.send(o);
  }, function(err) {
    res.send(err);
  });
};


exports.auth_crypto = function(req, res) {
  // GET Socket Error Test
  var data = {
    test1: redisfire.encrypt('hihi'),
    test2: redisfire.decrypt('2fa23612e09e3c46be74607353233769')
  };

  res.send(data);
};
