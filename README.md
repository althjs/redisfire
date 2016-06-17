Redisfire - realtime memory DB Service.
===========================

[![Join the chat at https://gitter.im/althjs/redisfire](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/althjs/redisfire?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/althjs/redisfire.png)](https://travis-ci.org/althjs/redisfire)
[![Coverage Status](https://coveralls.io/repos/althjs/redisfire/badge.svg?branch=master&service=github)](https://coveralls.io/github/althjs/redisfire?branch=master)
[![Dependencies Status](https://david-dm.org/althjs/redisfire.svg)](https://david-dm.org/althjs/redisfire)


Let's make Firebase features using Express, Socket.io, Redis and other powerful opensources.

> Redisfire is not related with Firebase.
> But Redisfire provides very similar features like Firebase.


## Features
* RESTful apis
* Realtime notifications for CURD actions
* JSON import/export
* Schema free
* Express.js simple route.


## Installation
```bash
# 1. install & start Redis
# 2. install Redisfire
$ npm install redisfire
```
> if redis server is run with "requirepass" or use other options for redis, add "redis-client" connfig option to "redisfire-conf.json"

```bash
$ cat conf/redisfire-conf.json
{
    "projects": [
        {
            "name": "theverge",
            "description": "http://www.theverge.com RSS sample data"
        },
        {
            "name": "redisfire-test",
            "description": "redisfire Mocha test project"
        }
    ],
    "redis-client": {
        "host": "127.0.0.1",
        "port": "6379",
        "auth_pass": "your password"
    }
}
```


## CLI
* the CLI command real path is 'node_modules/.bin/redisfire'

> redisfire - manage server process

```bash
# Examples:
$ ./node_modules/.bin/redisfire --help  # show help
$ ./node_modules/.bin/redisfire start -p 10001 # start Redisfire
```

> redisfire-import - Import JSON file to Redisfire

```bash
# Examples:
$ ./node_modules/.bin/redisfire-import --help  # show help
$ ./node_modules/.bin/redisfire-import test.json testProject  # import test.json to testProject
// after import, edit redisfire-conf.json
// and check http://localhost:3000/rest/testProject

# if you want to update redisfire-conf.json directly, use -s --save option
$ redisfire-import foo.json foo -s -d "foo project"
```

## REST
#### GET
```bash
# get all datas
curl http://localhost:3000/rest/theverge;

# get single item
curl http://localhost:3000/rest/theverge/feed/entry/0
curl http://localhost:3000/rest/theverge/feed/entry/0/content
```

#### POST - create
```bash
# get single item
curl http://localhost:3000/rest/theverge/feed/entry/0/content

# create new attribute to ".../entry/0/content/test";
curl -i \
  -H "Content-Type: application/json" \
  -X POST -d '{"foo":"bar"}' \
  http://localhost:3000/rest/theverge/feed/entry/0/content/test

# get result again
curl http://localhost:3000/rest/theverge/feed/entry/0/content
```
> NOTE: if the request key exists, the POST request is delegated to PUT method below.


#### PUT - update (& delete)
```bash
# get single item
curl http://localhost:3000/rest/theverge/feed/entry/0/content

# replace existing one to new data
curl -i \
  -H "Content-Type: application/json" \
  -X PUT -d '{"foo":"bar"}' \
  http://localhost:3000/rest/theverge/feed/entry/0/content

# get result again
curl http://localhost:3000/rest/theverge/feed/entry/0/content
```

#### DELETE - delete
```bash
# get single item
curl http://localhost:3000/rest/theverge/feed/entry/0/content

# replay existing one to new data
curl -i \
  -H "Content-Type: application/json" \
  -X DELETE \
  http://localhost:3000/rest/theverge/feed/entry/0

# get result again
curl http://localhost:3000/rest/theverge/feed/entry/0
```

## CURD realtime notifications
It's developed with socket.io.

### Client side - demo:
  http://localhost:3000/

### Server side
```javascript
var redisfire = require('redisfire');

var socketHost = 'http://localhost:/redis';
socket_client = require('socket.io-client')(socketHost);

var reqKey = new Date().getTime();
socket_client.emit('GET', (key || 'redisfire-test/feed/entry/2/author/name'), {key:, reqKey, foo:'bar'});
// "redsfire" event is fired as REDIS MONITOR events.
socket_client.on('redisfire', function(eventType, socket_res, params){
  if (eventType === 'GET' && params.key === reqKey) {
    console.log(socket_res);
  }
}, function(err) {
  console.log(err);
});
```

### CURD over socket.io
* open http://localhost:3000/
* try Javascript code on the developer console in Browser.

```javascript
// GET
socket.emit('GET', 'theverge/feed/entry/2/author/name', {foo:'bar'});
// CREATE (POST)
socket.emit('POST', 'theverge/feed/entry/2/author/name2', {hello: 'WORLD'}, {foo:'bar'});
 // DELETE
socket.emit('DELETE', 'theverge/feed/entry/2/author/name2', {foo:'bar'});
// PUT
socket.emit('PUT', 'theverge/feed/entry/2/author', {name: 'Jongsoon'}, {foo:'bar'});
```

## Get socket.io instance
```javascript
var redisfire = require('redisfire');

redisfire.getIO().then(function(_io) {
  var foo_namespace = _io.of('/redis_foo');

  console.log('FOO SOCKET /redis_foo initialized');

  foo_namespace.on('connection', function(socket){
    console.log('FOO someone connected to redis_foo namespace');
    socket.emit('hi', {message: 'emulate new socket.io namespace'});
  });

  // emulate socket.io client
  var client = require('socket.io-client')('http://localhost:3000/redis_foo');
  client.on('connect', function(){
    console.log('FOO SOCKET redis_foo connected to socketHost:', socketHost);
  });

  client.on('hi', function(data) {
    console.log('FOO namespace hi event: ' + JSON.stringify(data));
  });
});
```

## Authentication
to enable Authentication for some project, add auth options to redisfire-conf.json
```javascript
{
  "projects": [
    {
      "name": "redisfire-test-auth",
      "description": "redisfire Mocha test project for Authentication",
      "auth": "redisfire-test-auth-member", // hidden project for Authentication for this Project
      "auth_key": "redisfire-test-auth-key",  // cookie name for check auth
      "auth_secure": false // encrypt auth value or not
    }
  ],
  "CRYPTO_KEY": "test-key"  // encrypt/decrypt crypto key
}
```
If auth is enabled, redisfire check hidden Authentication project for each request.
Hidden Authentication is just key / value pair and the key is exists, redisfire regards valid request.

### redisfire.setUser(projectName, userInfo) - Add user to auth project
Add user for specific project - user object must have "key"
```javascript
exports.auth_test_setUser = function(req, res) {
  var user = {
    key: 'member_12345',  // must have this key
    info: {foo: 'bar'},
    other_info: "blablabla"
  };

  redisfire.setUser('redisfire-test-auth', user).then(function(o) {
    res.send(o);

    // if user added successfully, set cookie for the login.
    // if auth_secure is true, the auth cookie value must encrypted.
    res.cookie(conf.auth_key, redisfire.encrypt(user.key), { domain: '.redisfire.com', path: '/' });
    res.redirect('/');
  });
}
```

### redisfire.getUser(projectName) - get userinfo for login-ed user
 user for specific project - user object must have "key"
```javascript
exports.auth_getUser = function(req, res) {
  req.cookies['redisfire-test-auth-key'] = 'member_12345';
  redisfire.getUser('redisfire-test-auth', req).then(function(o) {
    res.send(o);
  });
}
```

### redisfire.encrtpt(text) - encrypt text
redisfire crypto function use 'aes-256-cbc'.
```javascript
var cipherText = redisfire.encrypt('hihi');
console.log(cipherText);
// 2fa23612e09e3c46be74607353233769
```

### redisfire.decrypt(cipherText) - decrypt text
redisfire crypto function use 'aes-256-cbc'.
```javascript
var text = redisfire.encrypt('2fa23612e09e3c46be74607353233769');
console.log(text);
// hihi
```


## Express.js simple route - redisfire service
Redisfire includes Web application server the Express.js by default.
The '/service' uri is occupied for the Redisfire servcie.
If you add test.js to service folder, '/service/test' path will working with ExpressJS Routing way.
The exported function name is the exposed like '/service/test/[function name]'.
The function must have two arguments req & res. (Please refer   [Express Routing](http://expressjs.com/en/guide/routing.html" target="_blank">Express Routing))

```bash
# 1. after install redisfire, check 'service/foo.js' sample service.
# 2. open http://localhost:3000/service/foo/demo
```


## Caution
* do not install globally
* the postinstall script is trying to copy folders below. (that's not working with -g option)

```bash
// Redisfire project config - must exists
> "conf" folder to "node_modules/../conf"
// Redisfire realtime event demo (http://localhost:3000/) - can delete
> "static" folder to "node_modules/../statrc"
```

## Version history
* 0.0.1
  * first publish
* ~ 0.0.12
  * bugfix
* 0.0.13
  * feature add:
    * CURD over socket
* 0.0.14
  * bugfix:
    * array PUT bug
  * change:
    * redis sockio.io event return type String to JSON
    * support boolean type value
  * feature:
    * GET request file download support when ".json" postfix included (ex: http://localhost/foo.json)
* 0.0.15
  * bugfix:
    * PUT/POST bug fix
  * features:
    * support require('redisfire') - more documentation needed.
* ~ 0.0.19
  * bugfix & travis ci
* 0.0.20
  * improve redisfire-import (--save option added)
  * add "redis-client" option to redisfire-conf.json
* 0.0.21
  * update npm dependencies
* 0.0.22
  * add deep depth create for POST
  * sorted JSON return by key name for GET
  * update npm dependencies
* 0.0.23
  * features:
    * Authentication
    * crypto (redisfire.encypt / redisfire.decrypt)
  * bugfix
* 0.0.24
  * features:
    * redisfire service
    * expose redisfire.successCallback && redisfire.errorCallback
* 0.0.25
  * features:
    * using mongodb for Authentication user data
    * add configures for bodyParser.json, bodyParser.urlencoded


## License
* The MIT License (MIT)
* http://opensource.org/licenses/MIT



That's all folks!
