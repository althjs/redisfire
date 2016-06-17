'use strict';
var $q = require("q"),
  _redis = require("./redis-helper"),
  _mongodb = require("./mongodb");

var cache = _redis.cache;

// auth cache for mongodb auth
var mongoauth = {};

exports.checkAuth = function (projectName, req, ioGET) {
  var conf = _redis.getProjectConf(projectName),
    deferred = $q.defer();

    // console.log('AUTH projectName:' + projectName, conf);
  if (conf) {
    if (conf.auth && conf.auth_key) {
      // console.log('AUTH KEY:',  conf.auth_key, req.cookies);

      if (req.cookies[conf.auth_key]) {
        try {
          var auth = conf.auth_secure ? _redis.decrypt(req.cookies[conf.auth_key]) : req.cookies[conf.auth_key],
            key = conf.auth + (/^\//.test(auth) ? '' : '/') + auth;
            console.log('AUTH VALUE:', auth, key);

            if (conf.auth_mongodb === true) {
                if (!mongoauth[projectName]) {
                    mongoauth[projectName] = [];
                }

                if (mongoauth[projectName].indexOf(auth) !== -1) {
                    deferred.resolve();
                } else {
                    var Auth = _mongodb.getDB(projectName);
                    Auth.findOne({key: auth}, function(error, _user) {
                        if (error) {
                            deferred.reject(error);
                        } else {
                            var key = _user.toJSON().key;
                            if (key) {
                                mongoauth[projectName].push(key);
                                deferred.resolve();
                            } else {
                                deferred.reject('Access Denied');
                            }
                        }
                    });
                }

            } else {
                ioGET(key).then(function(o) {
                  // console.log('AUTH ' + key + ' res:' + JSON.stringify(o, null, 2));
                  deferred.resolve(o);
                }, function(err) {
                  console.log('AUTH ERR 1:' + err);
                  // deferred.reject('AUTH ERR 1:' + err);
                  deferred.reject('Access Denied');
                });
            }
        } catch(e) {
          console.log('AUTH ERROR 2:' + e.message);
          deferred.reject('AUTH ERROR 2:' + e.message);
        }
      } else {
        deferred.reject('Access Denied');
      }
    } else {
      deferred.resolve('no auth required');
    }
  } else {
    deferred.reject('unknown project');
  }

  return deferred.promise;
};

exports.getUser = function (projectName, req, ioGET) {
  var conf = _redis.getProjectConf(projectName),
    deferred = $q.defer();

    var auth = conf.auth_secure ? _redis.decrypt(req.cookies[conf.auth_key]) : req.cookies[conf.auth_key],
      key = conf.auth + (/^\//.test(auth) ? '' : '/') + auth;

    if (conf.auth_mongodb === true) {
        var Auth = _mongodb.getDB(projectName);
        Auth.findOne({key: auth}, function(error, _user) {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve(_user.toJSON());
            }
        });
    } else {
        ioGET(key).then(function(o) {
          // console.log('AUTH ' + key + ' res:' + JSON.stringify(o, null, 2));
          deferred.resolve(o);
        }, function(err) {
          console.log('AUTH ERR 1:' + err);
          deferred.reject('AUTH ERR 1:' + err);
        });
    }

  return deferred.promise;
};

// var mongoose = require('mongoose');
// var Schema = mongoose.Schema,
//     ObjectId = Schema.ObjectId;

exports.setUser = function (projectName, user, req, ioPOST) {

  console.log('AUTH SET USER:', JSON.stringify(user, null, 2));
  var conf = _redis.getProjectConf(projectName),
    deferred = $q.defer();

  if (conf) {

    if (conf.auth_mongodb === true) {
        var Auth = _mongodb.getDB(projectName);
        Auth.findOne({key: user.key}, function(error, _user) {
            if (error) {
                deferred.reject(error);
            } else {
                if (!_user) {
                    _user = new Auth(user);
                    _user.save(function (err) {
                        if (err) {
                            deferred.reject(err);
                        } else {
                            deferred.resolve(_user);
                        }
                    });
                } else {
                    _user.modifiedAt = new Date();
                    _user.save(function (err) {
                        if (err) {
                            deferred.reject(err);
                        } else {
                            deferred.resolve(_user);
                        }
                    });
                }
            }
        });

    } else {
        var key = conf.auth + (/^\//.test(user.key) ? '' : '/') + user.key;

        // delete user.key;
        ioPOST(key, user).then(function(o) {
          // console.log('AUTH ' + key + ' res:' + JSON.stringify(o, null, 2));
          deferred.resolve(o);
        }, function(err) {
          console.log('AUTH ERR 1:' + err);
          deferred.reject('AUTH ERR 1:' + err);
        });
    }
  } else {
    deferred.reject('unknown project');
  }

  return deferred.promise;
};
