# RedisFire
RedisFire is not related with FireBase.
But RedisFire provides very similar features like FireBase.
()

## Features
* REST api
* Realtime notifications for CURD actions
* JSON import/export
* NO-SQL

## Installation
  ```bash
  $ npm install redisfire
  ```

## CLI
* redisfire - manage server process

  ```bash
  # Examples:
  $ redisfire --help  # show help
  $ redisfire start -p 10001 # start RedisFire
  ```

* redisfire-import - Import JSON file to RedisFire

  ```bash
  # Examples:
  $ redisfire-import --help  # show help
  $ redisfire-import test.json testProject  # import test.json to testProject
  // after import, check http://localhost:3000/rest/testProject
  ```

## REST
* GET
  ```bash
  # get all datas
  curl http://localhost:3000/rest/theverge;

  # get single item
  curl http://localhost:3000/rest/theverge/feed/entry/0
  curl http://localhost:3000/rest/theverge/feed/entry/0/content
  ```

* POST - create;
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

* PUT - update (& delete)
  ```bash
  # get single item
  curl http://localhost:3000/rest/theverge/feed/entry/0/content

  # replay existing one to new data
  curl -i \
    -H "Content-Type: application/json" \
    -X PUT -d '{"foo":"bar"}' \
    http://localhost:3000/rest/theverge/feed/entry/0/content

  # get result again
  curl http://localhost:3000/rest/theverge/feed/entry/0/content
  ```

* DELETE - delete
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
// RedisFire project config - must exists
> "conf" folder to "../node_modules/conf"
// RedisFire realtime event demo (http://localhost:3000/) - can delete
> "static" folder to "../node_modules/statrc"
// Sample dummy data - can delete
> "_sampe_data" folder to "../node_modules/_sample_data"
```


## TBD
* Authentication
* Unit Test
* improve Redis hash key management
* ...


That's all folks!
