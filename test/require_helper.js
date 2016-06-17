/**
 * https://github.com/gregjopa/express-app-testing-demo
 */
module.exports = function (path) {
  var server = require('path').join(__dirname + './../' + path);
  return require(server);
};
