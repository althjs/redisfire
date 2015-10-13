'use strict';

var _ = require("lodash"),
    $q = require("q");

/**
 * objectToJSON Firebase 유사하게 import/export 가 가능하게 하려고 하니, import 된 데이터가 배열인지 객겍체인지 구분이 필요하게 되었음.
 * 배열 구분은 상위 키에 @ postfix를 붙이게 구현했는데, 이넘땜에 추가로 처리해야할게 엄청나네 ㅠㅠ
 * objectToJSON 펑션은 재귀호출 함수로 redis 2차원 배열구조에서 복잡한 json 으로 변경된 하위 요소까지를 키에 포함된 @를 기준으로 변경작업 함!
 * @param  {object} datas 1차 가공된 JSON 객체
 * @return null     재귀호출을 하며 참조로 전달된 datas 변수를 직접 수정
 */
function objectToJSON(datas) {
    _.forEach(datas, function(n, key) {

        if (_.isArray(n)) {
            objectToJSON(n);
        } else if (_.isObject(n)) {
            objectToJSON(n);
        }

        // console.log(n);
        if (/@$/.test(key)) {
            //console.log(key + ' >>>>>>>>>');

            datas[key.substring(0, key.length-1)] = [];
            var k,
                i = 0,
                isOne = 0,
                j,
                len;

            for (k in n) {
                isOne++;
                if (isOne > 1) {
                    break;
                }
            }

            for (k in n) {
                if (isOne !== 1 && k !== i + '') {
                    len = parseInt(k, 10) - i;

                    for (j=0; j<len; j++) {
                        datas[key.substring(0, key.length-1)].push(null);
                        i++;
                    }
                }
                i++;
                datas[key.substring(0, key.length-1)].push(n[k]);
            }
            delete datas[key];
        }
    });
}

exports.objectToJSON = objectToJSON;

/**
 * hashToJSON 2차원 redis hash 구조를 JSON 구조로 변경하는 펑션
 * @param  {object} hash redis 로 부터 받은 key/value hash 구조
 * @return {object}      JSON 으로 변경된 객체 (이는 objectToJSON 펑션을 통해 완전체가 된당~)
 */
function hashToJSON(hash) {
    var datas = {};

    // redis key에 배열인 경우 상위 부모키에 keyname@ 와 같이 @를 postfix 로 붙이고 있어 이를 매칭하기 위해 pathRegex 사용
    var key,
        t,
        i,
        len;

    for (key in hash) {

        var ref;
        ref = datas;
        t = key.split('>');
        len = t.length;

        for (i = 0; i < len; i++) {

            if (i === 0 && !datas[t[i]]) {
                datas[t[i]] = {};
                ref = datas[t[i]];
            } else if (!ref[t[i]]) {

                if (len - 1 === i) {
                    //console.log('XXXX', hash[key]);
                    ref[t[i]] = hash[key];
                } else {
                    ref[t[i]] = {};
                    ref = ref[t[i]];
                }

            } else {
                if (len - 1 === i) {
                    //console.log('XXXX', hash[key]);
                    ref[t[i]] = hash[key];
                } else {
                    ref = ref[t[i]];
                }
            }

        }
    }

    return datas;
}

exports.hashToJSON = hashToJSON;





/**
 * [objectToHashKeyPair description]
 * @param  {json} targetObj   target JSON object
 * @param  {string} pathPrefix  hash key prefix
 * @return {hash}             key value pair object
 * @examples
 *  _helper.objectToHashKeyPair({
 *      '1': {
 *          "loc": {
 *              "type": "NEW TYPE",
 *              "coordinates": [
 *                  "127.0727300042316",
 *                  "37.62518909509835"
 *              ]
 *          }
 *      }
 *  }, 'test-sites').then(function(hash) {
 *      console.log('objectToHashKeyPair res', JSON.stringify(hash, null,2));
 *      // objectToHashKeyPair res {
 *      //   "test-sites>1>loc>type": "NEW TYPE",
 *      //   "test-sites>1>loc>coordinates@>0": "127.0727300042316",
 *      //   "test-sites>1>loc>coordinates@>1": "37.62518909509835"
 *      // }
 *  })
 */
function objectToHashKeyPair (targetObj, pathPrefix) {
    var deferred = $q.defer();
    var hash = {};
    var parseSub = function (val, key, k) {
    	if (_.isNumber(val)) {
            // keys.push(key + '>' + k, val);
            hash[key + '>' + k] = val;

    	} else if (_.isString(val)) {
            // keys.push(key + '>' + k, val || "");
            hash[key + '>' + k] = val;

    	} else if (_.isArray(val)) {
    		parseJSON(val, key + '>' + k);

    	} else if (_.isObject(val)) {
    		parseJSON(val, key + '>' + k);

    	}
    }

    var parseJSON = function (obj, key) {
    	var k,
    		val;

    	if (_.isArray(obj)) {
    		var i,
    			len = obj.length;
    		for (i=0; i<len; i++) {
    			val = obj[i];

    			parseSub(val, key + '@', i);
    		}

    	} else if (_.isObject(obj)) {
    		for (k in obj) {
    			val = obj[k];

    			parseSub(val, key, k);
    		}
    	}
    }

    setTimeout(function() {
        deferred.resolve(hash);
    });
    parseJSON(targetObj, pathPrefix);

    return deferred.promise;
}

exports.objectToHashKeyPair = objectToHashKeyPair;




/**
 * getRealKeyPrefix 요청된 path를 실제 키 (Array인 경우 @ 가 포함된) 로 치환하여 리턴한다.
 * @param  {[type]} relatedPath 실제 redis에 등록된 관련 키 String
 * @param  {[type]} requestPath request.path 로 전달받은 키 String
 * @return {[type]}             redis에 등록될 리얼 키 String
 */
function getRealKeyPrefix (relatedPath, requestPath) {
    // console.log('__getRealKeyPrefix relatedPath:' + relatedPath, 'requestPath:' + requestPath);

    if (relatedPath.substring(relatedPath.length-1, relatedPath.length) !== '>') {
        relatedPath+= '>';
    }

    var l = requestPath.split('>'),
        relatedPath = relatedPath.split('>'),
        newPath = relatedPath.splice(0, l.length-2).join('>') + '>' + l[l.length-2];

        // console.log(l, newPath);

    return newPath;
}

exports.getRealKeyPrefix = getRealKeyPrefix;





/**
 * getKeyRegex redis hash key를 입력받아 실제 키와 매핑시킬 정규표현식 리턴
 * @param  {string} key '@'를 포함하지 않은 hash key. ex) test-sites@>1>loc>type
 * @return {regexp}     정규표현식
 */
function getKeyRegexp(key) {
    var postFix = (key.substring(key.length-1, key.length) === '>') ? '' : '>';
    return new RegExp('^' + key.replace(/>/g, '(@|)>') + postFix);
}
exports.getKeyRegexp = getKeyRegexp;
