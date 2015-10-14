# Redisfire
Redisfire is realtime memory DB.

Let's make Firebase features using Express, Socket.io, Redis and other powerful opensources.

> NOTE: Redisfire is not related with Firebase.
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

## Caution
* do not install globally
* the postinstall script is trying to copy folders below. (that's not working with -g option)

```bash
// Redisfire project config - must exists
> "conf" folder to "node_modules/../conf"
// Redisfire realtime event demo (http://localhost:3000/) - can delete
> "static" folder to "node_modules/../statrc"
```

## License
* The MIT License (MIT)
* http://opensource.org/licenses/MIT

## TBD
* Authentication
* Unit Test
* CURD over socket
* improve Redis hash key management
* ...


That's all folks!
