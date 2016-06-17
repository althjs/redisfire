'use strict';

var _redis = require('./redis-helper');
var mongoose = require('mongoose');
var mongo_connection_string;

try {
    mongo_connection_string = _redis.getConf().mongodb.connection_string;
} catch(e) {
    mongo_connection_string = 'mongodb://localhost/redisfire';
}

var connections = [];

var redisfire_auth_schema = new mongoose.Schema({
    key: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    modifiedAt: {
        type: Date,
        default: Date.now
    }
}, {strict: false});


exports.getDB = function (projectName) {

    if (connections[projectName]) {
        return connections[projectName];
    } else {
        var projectConf = _redis.getProjectConf(projectName);
        console.log('@@ mongodb connect: ' + projectName + ' with ' + projectConf.auth + ' collection as ', mongo_connection_string + ' database');

        var conn = mongoose.createConnection(mongo_connection_string);
        var Auth = conn.model(projectConf.auth, redisfire_auth_schema);
        connections[projectName] = Auth;
        return connections[projectName];
    }
};
