'use strict';

var redis = require("redis"),
    client = redis.createClient(),
    $q = require("q"),
    _ = require("lodash"),
    _helper = require('./helper'),
    fs = require("fs"),
    jsonMinify = require("node-json-minify");

client.on('error', function (err) {
    console.log('Error: ' + err);
    console.log('Redis connection failed. Please check redis server is running.');
    process.exit(1);
});

client.on('connect', function () {
    updateCache();
});

var confDir = require('path').join(__dirname + (/node_modules/.test(__dirname) ? './../../../conf' : './../../conf'));

if (/travis/.test(__dirname)) { // for travis-ci test
  confDir = require('path').join(__dirname + './../conf');
}
console.log('@@ confDir: ' + confDir);

function updateCache() {
    var tmp = fs.readFileSync(confDir + '/redisfire-conf.json', {encoding: 'utf-8'}),
        conf = JSON.parse(jsonMinify(tmp)),
        projects = conf.projects,
        i,
        len = projects.length;

        for (i=0; i<len; i++) {
            // console.log(projects[i].name);
            redisHKEYS(projects[i].name);
        }
}

// watch config file
fs.exists(confDir, function(exists) {
  fs.watch(confDir, function (event, filename) {

      if (/conf.json/.test(filename)) {
          console.log('conf.json changed with ' + event + ' event. (' + filename + ')');
          updateCache();
      }
  });
});


/**
 * doMonitor redis 모니터 실행
 * @param  {function} initCallback    모니터 시작 콜백
 * @param  {function} monitorCallback 모니터 이벤트 콜백
 */
function doMonitor(initCallback, monitorCallback) {
    var client_monitor = redis.createClient();

    client_monitor.on('connect', function () {
        client_monitor.monitor(initCallback);
        client_monitor.on("monitor", monitorCallback);
    });
}

exports.doMonitor = doMonitor;


/**
 * cache 프로젝트 키를 캐시하기 위한 용도
 * @type {Object}
 * @examples
 * console.log(JSON.stringnify(cache, null, 2));
 * {
 *   test-sites: [
 *   	'text-sites@>0...',
 *   	'...'
 *   ],
 *   test-libs: [
 *   	'test-libs>광진구>library...',
 *   	'...'
 *   ]
 * }
 */
var cache = {};

exports.cache = cache;

/**
 * redisHKEYS 입력된 해시키를 가져와서 cache 공용 객체로 캐시함
 * @param  {string}  projectName redis 해시 키
 * @return {promise}             Array keyList가 전달 됨
 */
function redisHKEYS(projectName) {
    var deferred = $q.defer();

    // 좀 많이 무식함 ㅠㅠ. 해당 해시맵 전체 데이터를 가져와 JSON 형태로 변환 (path 는 조건에 해당함)
    client.hkeys(projectName, function (error, keyList) {
        cache[projectName] = keyList;
        console.log('@@ ' + projectName + ' cache update. (count: ' + keyList.length + ')')
        deferred.resolve(keyList);
    });
    return deferred.promise;
}
exports.redisHKEYS = redisHKEYS;




/**
 * redisHGET 입력된 path 에 맞는 데이터를 redis 에서 가져와 key / value hash 로 리턴해줌
 * redis key를 추출하는 방식은 cache 변수에 저장된 redis hash key를 풀 스켄하며 매칭된 키만 추출하여 hmget 으로 가져옴
 * @param  {[type]}  projectName [description]
 * @param  {[type]}  path        [description]
 * @return {promise}             deferred.promise
 */
function redisHGET(projectName, key) {
    var deferred = $q.defer();

    var _key,
        t;

    try {
        var cc = cache[projectName],
            i,
            len = cc.length,
            pathRegex = _helper.getKeyRegexp(key);

        console.log('pathRegex', key,  pathRegex);

        var keys = [];
        for (i=0; i<len; i++) {
            _key = cc[i];
            if (!pathRegex.test(_key + '>')) {   // 비교 시 실제 키에 > 를 강제로 붙여줌!
                continue;
            }
            keys.push(_key);

            if (key !== projectName+'>') {  // 최상위가 아닌 경우만 로그 남김
                console.log('> real key', _key);
            }

        }

        var params = [projectName].concat(keys);
        var oHash = {};

        params.push(function(error, dd) {
            // console.log('hash', dd);

            try {
                //console.log('카운트 비교 key:', keys.length, 'results:', dd.length);

                len = dd.length;
                for (i=0; i<len; i++) {
                    oHash[keys[i]] = dd[i];
                }

                deferred.resolve(oHash);
            } catch(e) {
                deferred.reject('데이터가 없습니다. (' + e.message + ')');
                console.log('redisHGET err:' + e.message);
            }

        });

        client.hmget(params);

    } catch(e) {
        if (!cache[projectName]) {
            deferred.reject('NO PROJECT FOUND');
        } else {
            deferred.reject('redisHGET err 0:' + e.message);
        }
    }

    return deferred.promise;
}
exports.redisHGET = redisHGET;

/**
 * redisHMSET
 * @param  {string}  projectName [description]
 * @param  {string}  key         [description]
 * @param  {object}  hash        [description]
 * @return {promise}             deferred.promise
 * @examples
 * // hash data sample
 * {
 *   "test-sites@>1>loc>type": "NEW TYPE",
 *   "test-sites@>1>loc>coordinates@>0": "127.0727300042316",
 *   "test-sites@>1>loc>coordinates@>1": "37.62518909509835"
 * }
 */
function redisHMSET(projectName, key, hash) {
    var deferred = $q.defer();

    var k,
        params = [projectName];

    for (k in hash) {
        params.push(k, hash[k]);
    }

    console.log('HMSET Target:', JSON.stringify(hash, null, 2));

    params.push(function (error, hash) {
        if (error) {
            deferred.reject(error);
        } else if (!hash) {
            deferred.reject('UPDATE FAILED key: ' + key + ', args: ' + params);
        } else {
            deferred.resolve('SUCCESS');
        }
    });

    client.hmset(params);

    return deferred.promise;
}
exports.redisHMSET = redisHMSET;

function redisHSET(projectName, key, newValue) {
    var deferred = $q.defer();

    // 값이 있는지 체크
    client.hset(projectName, key, newValue, function (error, hash) {
        if (error) {
            deferred.reject(error);
        } else if (!hash) {
            deferred.reject('UPDATE FAILED key: ' + key + ', value: ' + newValue);
        } else {
            deferred.resolve('SUCCESS');
        }

    });
    return deferred.promise;
}
exports.redisHSET = redisHSET;

/**
 * redisHDEL 특정 키 또는 키들을 삭제한다
 * @param  {[type]}  projectName [description]
 * @param  {string|Array}  keys        [description]
 * @return {promise}             deferred.promise
 * @examples
 * // 한개 키만 삭제할 경우
 * redisHDEL('test-sites', 'test-sites@>1>loc>type').then(function(cnt) {
 *   console.log(cnt);
 *   // 1   # 1개 삭제됨
 * });
 *
 * // 여러개 키를 삭제할 경우
 * var params = [
 *   'test-sites@>1>loc>type',
 *   'test-sites@>1>loc>coodinates@>1',
 *   'test-sites@>1>loc>coodinates@>2'
 * ];
 * redisHDEL('test-sites', 'test-sites@>1>loc>type').then(function(cnt) {
 *   console.log(cnt);
 *   // 3   # 3개 삭제됨
 * });
 */
function redisHDEL(projectName, keys) {
    var deferred = $q.defer();

    try {
        if (!keys || keys.length === 0) {
            console.log('nothing to delete');
            setTimeout(function() {
              deferred.resolve();
            });
        } else {
            var delOne = function (key, projectName) {
                var df = $q.defer();
                client.hdel(projectName, key, function (error, tf) {
                    if (error || !tf) {
                        df.resolve(0);
                    } else {
                        df.resolve(1);
                    }
                });
                return df.promise;
            };

            if (typeof keys === 'string') {
                delOne(keys, projectName).then(function (cnt) {
                    deferred.resolve(cnt);
                }, function (err) {
                    deferred.resolve(0);
                });
            } else if (typeof keys === 'object') {

                var promises = [],
                    len = keys.length,
                    i;
                for (i=0; i<len; i++) {
                    promises.push(delOne(keys[i], projectName));
                }

                if (promises.length >0) {
                    $q.all(promises).then(function (res) {
                        deferred.resolve(_.sum(res));
                    });
                }

            }
        }
    } catch(e) {
        console.log('XXXX'+ e.message);
        deferred.reject('redisHDEL err:' + e.message);
    }
    return deferred.promise;
}
exports.redisHDEL = redisHDEL;




/**
 * redisHGETALL redis 특정 hmap 데이터를 모두 가져와 JSON 객체로 리턴
 * @param  {string}  projectName redis hash 그룹
 * @param  {string}  key        가져오고자 하는 key
 * @return {promise}             deferred.promise
 * @examples
 * // 특정 키 데이터 가져오기
 * _redis.redisExport('test-sites', 'test-sites@>1').then(function(o) {
 *     console.log('redisExport res:' + JSON.stringify(o, null, 2));
 * });
 *
 * // 전체 데이터 가져오기
 * _redis.redisExport('test-sites').then(function(o) {
 *     console.log('redisExport res:' + JSON.stringify(o, null, 2));
 * });
 */
function redisExport(projectName, key) {
    key = key || '';
    var deferred = $q.defer();
    var datas = {},
        targetKey = key.split('>');

    // 좀 많이 무식함 ㅠㅠ. 해당 해시맵 전체 데이터를 가져와 JSON 형태로 변환 (path 는 조건에 해당함)
    client.hgetall(projectName, function (error, hash) {

        var _key,
            pathRegex = key || _helper.getKeyRegexp(key);

         console.log('pathRegex', pathRegex);

         if (key) {
             for (_key in hash) {
                 if (!pathRegex.test(_key)) {
                     continue;
                 }
                 console.log('>>>>>>>>>>>>>> real _key', _key);
                 datas[_key] = hash[_key];
             }
         } else {
                datas = hash;
         }

        datas = _helper.hashToJSON(datas);

        _helper.objectToJSON(datas);

        setTimeout(function() {

            if (key) {
                datas = datas[projectName];
                var i,
                    len = targetKey.length;

                for (i=0; i<len; i++) {
                    if (datas[targetKey[i]]) {  // 객체가 바로 있는경우 객체 할당
                        datas = datas[targetKey[i]];
                    } else if (datas.length === 1 && targetKey[i] !=='') { // 배열이고, length 가 1인경우 0번째 배열 할당
                        datas = datas[0];
                    }
                }
            } else {
                datas = datas[projectName];
            }
            deferred.resolve(datas);
        });
    });

    return deferred.promise;
}
exports.redisExport = redisExport;

/**
 * getHashAllData return all hash data
 * @param  {string} projectName [description]
 * @return {objecct}             [description]
 */
exports.getHashAllData = function(projectName) {
  var deferred = $q.defer();

  client.hgetall(projectName, function (error, hash) {
    if (error) {
      deferred.reject(error);
      return;
    }

    deferred.resolve(hash);
  });

  return deferred.promise;
}
