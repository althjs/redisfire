#!/usr/bin/env node

'use strict';

var program = require('commander');

var _fileName,
  _projectName = {};

program
  .version('0.0.1')
  .usage('<fileName> <projectName>')
  .option('-v --verbose', 'Verbose mode')
  .description('Import JSON file to RedisFire')
  .action(function(fileName, projectName){

    _fileName = fileName;
    _projectName = projectName;


    if (typeof _fileName !== 'string' || typeof _projectName !== 'string') {
        program.help();
        return;
    }

  });


program.on('--help', function(){
  console.log('  Examples:');
  console.log('');
  console.log('    $ redisfire_import test.json testProject');
  console.log('');
});


program.parse(process.argv);
// console.log('TEST:', _fileName, _projectName);



var fs = require('fs'),
	_ = require('lodash');

var redis = require("redis"),
	client = redis.createClient();

client.on('error', function (err) {
	console.log('Error: ' + err);
  process.exit(1);
});




try {
  var orig = fs.readFileSync(_fileName,  {encoding: 'utf-8'});
} catch(e) {
  console.log('Error: ' + e.message);
  process.exit(1);
}
var datas = JSON.parse(orig);

function HSET(key, val) {
	client.hset(_projectName, key, val);
	console.log(_projectName,key, val);
}


function parseSub (val, key, k) {
	if (_.isNumber(val)) {
		HSET(key + '>' + k, val);

	} else if (_.isString(val)) {
		HSET(key + '>' + k, val || "");

	} else if (_.isArray(val)) {
		parseJSON(val, key + '>' + k);

	} else if (_.isObject(val)) {
		parseJSON(val, key + '>' + k);

	}
}

function parseJSON (obj, key) {

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
  parseJSON(datas, _projectName);

},10)

setTimeout(function() {
  process.exit(0);
}, 100);
