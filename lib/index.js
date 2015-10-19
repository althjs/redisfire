'use strict';

var redisfire_service = require('../routes/service/redis');


exports.getIO = redisfire_service.getIO;

exports.ioGET = redisfire_service.ioGET;
exports.ioPOST = redisfire_service.ioPOST;
exports.ioPUT = redisfire_service.ioPUT;
exports.ioDELETE = redisfire_service.ioDELETE;
