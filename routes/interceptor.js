'use strict';



/**
 * 전처리 담당. 정의된 콜백펑션은 반듯이 promise 를 리턴 또는 res.send
 */
var interceptor_pre = {};

/**
 * 전처리 중 restful API 지원을 위한 배열정보
 * 서비스 단에서는 exports.serviceName/: 형태로 export 하면 restful 이라 간주함
 */
var interceptor_pre_rest = [];

/**
 * 후처리 담당. 정의된 콜백펑션은 반듯이 promise 를 리턴 또는 res.send
 **/
var interceptor_post = {};


/**
 * 서비스 폴더를 루프 돌면서 해당 파일을 serviceName 으로,
 * 해당 serviceName 에서 export 된 것들을 오브젝트로 정의한다.
 * @examples
 * var service = {
 *   'redis': {
 *      foo: function(req, res, next) {
 *        ..
 *      },
 *      bar: function(req, res, next) {
 *        ..
 *      }
 *   };
 * }
 */
function getServices() {
    var deferred = require('q').defer();
    var fs = require('fs'),
        serviceDir;

    if (/travis/.test(__dirname)) { // for travis-ci test
      serviceDir = require('path').join(__dirname + './../service');
    } else {
      serviceDir = require('path').join(__dirname + (/node_modules/.test(__dirname) ? './../../../service' : './../../service'));
    }

    console.log('@@ serviceDir:', serviceDir);
    if (fs.existsSync(serviceDir)) {
      fs.readdir(serviceDir, function(err, serviceFiles) {
          var serviceName,
              i,
              len = serviceFiles.length,
              service = {};

          for (i=0; i<len; i++) {
              serviceName = serviceFiles[i].split('.js')[0];
              service[serviceName] = require(serviceDir + '/' + serviceName);
          }

          return deferred.resolve(service);
      });
    } else {
      deferred.resolve([]);
    }

    return deferred.promise;
}

/**
 * getService 로 가져온 서비스 중 rest 방식으로 exports 된것들을 찾아 배열로 정의한다
 */
function getRestfulServiceInfo(interceptor_pre) {
    var key,
        restApis = [],
        tmp;

    for (key in interceptor_pre) {
        if (/\/\:/.test(key)) {
            tmp = key.replace(/\/\:/g, '\/^___^\/');
            restApis.push(_pathRegExp(key));
        }
    }
    return restApis;
}


/**
 * intercepter 초기화
 * 전처리/후처리를 담당하는 변수 할당작업
 * interceptor_pre
 * interceptor_pre_rest
 * interceptor_post (TBD)
 * interceptor_post_rest (TBD)
 */
function init() {

    getServices().then(function(service) {
        var serviceName,
            tservice,
            tmethod,
            tmp;
        for (serviceName in service) {
            tservice = service[serviceName];

            for (tmethod in tservice) {
                tmp = '/service/' + serviceName + '/' + tmethod;
                // 서비스 모듈도 무조건 전처리기가 아니라 __post_ prefix가 있는 경우 전처리기에서 제외 함
                if (!/^__post_/.test(tmethod)) {
                    // console.log(tmp);
                    interceptor_pre[tmp] = service[serviceName][tmethod];
                }

            }
        }

        interceptor_pre_rest = getRestfulServiceInfo(interceptor_pre);
    });
}

init();



function getRestfulPathParams(keys, reqPath, mapPath) {

  var a1 = reqPath.split('/'),
    a2 = mapPath.split('/'),
    params = {},
    k,
    i,
    len = keys.length,
    j,
    len2 = a2.length;

  for (i=0; i<len; i++) {
    k = keys[i].name;
    for (j=0; j<len2; j++) {
      if (':' + k === a2[j]) {
        params[k] = a1[j];
        break;
      }
    }
  }
  return params;
}

/**
 * 요청된 path 정보가 매칭되는 rest api가 있는지 판단하고 있다면 해당 정보를 넘김
 */
var getMappingForRestfulPath = function(pathName, maps) {
    var i,
        len = maps.length,
        obj,
        params1,
        params2,
        pathParam = {};

    for (i=0; i<len; i++) {
        if (maps[i].regexp.test(pathName)) {
          pathParam = getRestfulPathParams(maps[i].keys, pathName, maps[i].originalPath);

          obj = {
              originalPath: maps[i].originalPath, //.substring(0, maps[i].originalPath.length-1),
              pathParam: pathParam,
              regexp: maps[i].regexp
          };
          return obj;
        }
    }
    return false;
};


/*
 * angular-route.js 에서 참조.
 * /test/:foo/:bar 와 같은 uri의 regex 값을 리턴함.
 * angular에서는 expressjs router 를 참조했네 ㅎㅎㅎ (코드는 돌고~ 돌고~ 돌고~)
 */
function _pathRegExp(path, opts) {
    var insensitive = opts ? opts.caseInsensitiveMatch : false,
        ret = {
            originalPath: path,
            regexp: path
        },
        keys = ret.keys = [];

        path = path
        .replace(/([().])/g, '\\$1')
        .replace(/(\/)?:(\w+)([\?\*])?/g, function(_, slash, key, option) {
            var optional = option === '?' ? option : null;
            var star = option === '*' ? option : null;
            keys.push({ name: key, optional: !!optional });
            slash = slash || '';

            var reg_string = '' + (optional ? '' : slash) + '(?:' + (optional ? slash : '') + (star && '(.+?)' || '([^/]+)') + (optional || '') + ')' + (optional || '');
            return reg_string;

        })
        .replace(/([\/$\*])/g, '\\$1');

    // ret.regexp = new RegExp('^' + path + '$', insensitive ? 'i' : '');
    ret.regexp = new RegExp('^' + path + '', insensitive ? 'i' : '');

    return ret;
}


exports.service = function (req, res, next) {
    var pathName = req._parsedUrl.pathname;
    console.log('@@ pathName:', pathName);


    var restfulPathInfo = getMappingForRestfulPath(pathName, interceptor_pre_rest) || false;

    if (typeof interceptor_pre[pathName] === 'function') {

        try {
            interceptor_pre[pathName](req, res, next).then(function (o) {
                res.send(o);
            }, function (error) {
                res.send({
                    code: 'ERROR',
                    interceptor: pathName,
                    error: error
                });
            });
        } catch(e) {
            // 윗단에서 res.send 했으면 여기로 옴
            // console.log('XXXXX' + e.message );
        }

    } else if (restfulPathInfo) {
        pathName = restfulPathInfo.originalPath

        req.query._pathParam = restfulPathInfo.pathParam;

        // console.log('>>>> REST:', pathName, restfulPathInfo);
        try {
            interceptor_pre[pathName](req, res, next).then(function (o) {
                res.send(o);
            }, function (error) {
                res.send({
                    code: 'ERROR',
                    interceptor: pathName,
                    error: error
                });
            });
        } catch(e) {
          // 윗단에서 res.send 했으면 여기로 옴
          // console.log('XXXXX' + e.message );
        }


    } else {
        res.status(404);
        res.send('service not found');
    }
}
