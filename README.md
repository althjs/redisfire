Redisfire - realtime memory DB Service.
===========================
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
> redisfire - manage server process

```bash
# Examples:
$ redisfire --help  # show help
$ redisfire start -p 10001 # start Redisfire
```

> redisfire-import - Import JSON file to Redisfire

```bash
# Examples:
$ redisfire-import --help  # show help
$ redisfire-import test.json testProject  # import test.json to testProject
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
* It's developed with socket.io.
* DEMO:
  http://localhost:3000/

## CURD over socket.io
* 1. open http://localhost:3000/
* 2. try js code on the developer console.

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

##

## Caution
* do not install globally
* the postinstall script is trying to copy folders below. (that's not working with -g option)

```bash
// Redisfire project config - must exists
> "conf" folder to "node_modules/../conf"
// Redisfire realtime event demo (http://localhost:3000/) - can delete
> "static" folder to "node_modules/../statrc"
```

## Versio HIstory
* 0.0.1
  * first publish
* ~ 0.0.12
  * bugfix
* 0.0.13
  * feature fdd:
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

## License
* The MIT License (MIT)
* http://opensource.org/licenses/MIT

## TBD
* Authentication
* ...


That's all folks!
