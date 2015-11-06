'use strict';

var redisfire_service = require('../routes/service/redis');
var redis_helper = require('../utils/redis-helper');

exports.getIO = redisfire_service.getIO;

exports.ioGET = redisfire_service.ioGET;
exports.ioPOST = redisfire_service.ioPOST;
exports.ioPUT = redisfire_service.ioPUT;
exports.ioDELETE = redisfire_service.ioDELETE;

exports.redis_helper = redis_helper;
exports.getConf = redis_helper.getConf;
exports.getProjectConf = redis_helper.getProjectConf;
exports.encrypt = redis_helper.encrypt;
exports.decrypt = redis_helper.decrypt;

exports.setUser = redisfire_service.setUser;
exports.getUser = redisfire_service.getUser;
