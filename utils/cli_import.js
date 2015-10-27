#!/usr/bin/env node

'use strict';

var program = require('commander');

var _fileName,
  _projectName = {},
  _options;

var fs = require('fs'),
  path = require('path'),
	_ = require('lodash'),
  jsonMinify = require("node-json-minify");

var confDir = path.join(__dirname + (/node_modules/.test(__dirname) ? './../../../conf' : './../../conf')),
  confFile = confDir + '/redisfire-conf.json';

if (/travis/.test(__dirname)) { // for travis-ci test
  confDir = path.join(__dirname + './../conf');
  confFile = confDir + '/redisfire-conf.json';
}


var _config = JSON.parse(jsonMinify(fs.readFileSync(confFile, 'UTF-8')));

console.log('@@ redisfire-import confFile:', confFile);


program
  .version('0.0.1')
  .usage('<fileName> <projectName>')
  .option('-v --verbose', 'Verbose mode')
  .option('-d --description <description>', 'project description')
  .option('-s --save', 'overwrite config file')
  .description('Import JSON file to RedisFire')
  .action(function(fileName, projectName, options){

    _fileName = fileName;
    _projectName = projectName;

    _options = options || null;

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




var redis = require("redis"),
	client = redis.createClient(require('lodash').clone(_config['redis-client']));

client.on('error', function (err) {
  program.outputHelp();
  process.exit(1);
});




try {
  var orig = fs.readFileSync(_fileName,  {encoding: 'utf-8'});
} catch(e) {
  console.log(e);
  program.outputHelp();
  process.exit(1);
}
var datas = JSON.parse(orig);

function HSET(key, val) {
	client.hset(_projectName, key, val);
	console.log(_projectName,key, val);
}


function parseSub (val, key, k) {
  if (typeof val === 'boolean') {
    val = '@' + (val ? 1 : 0);
  }
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

  if (_options.save) {

    var k,
      isSave = false,
      projects = _config.projects,
      i,
      len = projects.length;

    for (i=0; i<len; i++) {
      k = projects[i].name;
      if (k === _projectName) {
        isSave = true;

        if (typeof _options.description === 'string') {
          projects[i] = {
            name: k,
            description: _options.description
          }
          break;
        }
      }
    }

    if (!isSave) {
      projects[i] = {
        name: _projectName,
        description: (typeof _options.description === 'string') ? _options.description : ''
      };
    }
    //console.log(JSON.stringify(_config, null, 2));

    fs.writeFile(confFile, JSON.stringify(_config, null, 2), {encoding:'UTF-8'}, function(err) {
      if (err) throw err;
      console.log(confFile + ' is updated!');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }

}, 100);
