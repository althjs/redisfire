#!/usr/bin/env node

'usr strict';
var fs = require('fs'),
  path = require('path');

/**
 * http://stackoverflow.com/questions/13786160/copy-folder-recursively-in-node-js/22185855#22185855
 *
 * Look ma, it's cp -R.
 * @param {string} src The path to the thing to copy.
 * @param {string} dest The path to the new copy.
 */
var copyRecursiveSync = function(src, dest) {
  var exists = fs.existsSync(src);
  var stats = exists && fs.statSync(src);
  var isDirectory = exists && stats.isDirectory();


  if (exists && isDirectory) {
    if (!fs.existsSync(dest)) { // ADD: checking condition for target is existing or not - althjs
      fs.mkdirSync(dest);
    }

    fs.readdirSync(src).forEach(function(childItemName) {
      copyRecursiveSync(path.join(src, childItemName),
                        path.join(dest, childItemName));
    });
  } else {
    if (!fs.existsSync(dest)) { // ADD: checking condition for target is existing or not - althjs
      fs.linkSync(src, dest);
    }
  }
};


console.log('@@ COPY default conf & demo files >>>>>>>>>>>>>>>>>>>>>>>>>>>>');

var srcDir = require('path').join(__dirname + './../conf');
var destDir = require('path').join(__dirname + './../../../conf');
console.log('1. ' + srcDir + ' to ' + destDir);
copyRecursiveSync(srcDir, destDir);


srcDir = require('path').join(__dirname + './../static');
destDir = require('path').join(__dirname + './../../../static');
console.log('2. ' + srcDir + ' to ' + destDir);
copyRecursiveSync(srcDir, destDir);



/*
srcDir = require('path').join(__dirname + './../_sample_data');
destDir = require('path').join(__dirname + './../../../_sample_data');
console.log('3. ' + srcDir + ' to ' + destDir);
copyRecursiveSync(srcDir, destDir);
*/

console.log('@@ IMPORT demo JSON to RedisFire >>>>>>>>>>>>>>>>>>>>>>>>>>>>');

var exec = require('child_process').exec,
  isWin = /^win/.test(process.platform),
  command;


console.log('@@ RENAME default conf & demo files >>>>>>>>>>>>>>>>>>>>>>>>>>>>');
if (!/travis/.test(__dirname)) {
  if (isWin) {
    fs.renameSync(path.join(__dirname + '.\\..\\conf'), path.join(__dirname + '.\\..\\z_conf'));
    fs.renameSync(path.join(__dirname + '.\\..\\static'), path.join(__dirname + '.\\..\\z_static'));
    fs.renameSync(path.join(__dirname + '.\\..\\service'), path.join(__dirname + '.\\..\\z_service'));
  } else {
    fs.renameSync(path.join(__dirname + './../conf'), path.join(__dirname + './../z_conf'));
    fs.renameSync(path.join(__dirname + './../static'), path.join(__dirname + './../z_static'));
    fs.renameSync(path.join(__dirname + './../service'), path.join(__dirname + './../z_service'));
  }
}

if (isWin) {
  command = require('path').join(__dirname + '.\\..\\bin\\redisfire-import') + ' .\\_sample_data\\theverge.json theverge';
} else {
  command = require('path').join(__dirname + './../bin/redisfire-import') + ' ./_sample_data/theverge.json theverge';
}

console.log('@@ command:', command);
exec(command, function(error, stdout, stderr){
  console.log(error, stdout, stderr);
  if (!error) {
    console.log('=============================================');
    console.log(' It\'s done!');
    console.log(' start RedisFire with CLI below & enjoy it!');
    console.log('');
    console.log(' $ ./node_modules/.bin/redisfire start');
    console.log('=============================================');
  }
});
