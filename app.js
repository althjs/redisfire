'use strict';

var express = require('express');
var path = require('path');
// var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var intercepter = require('./routes/interceptor');
var redisfire = require('./routes/service/redis');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));

// app.set('views', path.join(__dirname, './'));

/**
 * inject livereload
 */
if (app.get('env') === 'development') {
  try {
    app.use(require('connect-livereload-safe')(process.env.LIVERELOAD_HOST ? {host: process.env.LIVERELOAD_HOST} : {}));
  } catch(e) {}
}

var staticDir = path.join(__dirname + (/node_modules/.test(__dirname) ? './../../static' : './../static'));
/**
 * check the test env
 */
var isTestMode = /(instrument|travis)/.test(__dirname);
app.set('isTestMode', isTestMode);

if (/travis/.test(__dirname)) { // for travis-ci test
  staticDir = require('path').join(__dirname + '/static');
}

console.log('@@ staticDir: ' + staticDir, app.get('env'));

var redisfireConf = require('./utils/redis-helper').getConf();

var jsonConf = {},
    urlencodedConf = { extended: false };
if (redisfireConf.express) {
    jsonConf = redisfireConf.express['body-parser-json-options'] || jsonConf;
    urlencodedConf = redisfireConf.express['body-parser-urlencoded-options'] || urlencodedConf;
    console.log('@@ bodyParser json conf: ', JSON.stringify(jsonConf));
    console.log('@@ bodyParser urlencoded conf: ', JSON.stringify(urlencodedConf));
}


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json(jsonConf));
app.use(bodyParser.urlencoded(urlencodedConf));
app.use(cookieParser());
app.use(express.static(staticDir));





// console.log('VIEWS::::', intercepter.views);
// intercepter.getServices('views').then(function(_views) {
var k,
  view;
for (k in intercepter.views) {
  view = intercepter.views[k];
  if (view.route && typeof view.middleware === 'function') {

    // console.log('VIEWS:', view.route, view.middleware);
    app.use(view.route, view.middleware);
  }
}

// for external router configuration
if (redisfireConf.express && redisfireConf.express.router) {
    require(redisfireConf.express.router)(app);
}

// console.log(intercepter.service);
app.use('/service/*', intercepter.service);




app.use('/rest*', redisfire.rest);


app.get('/favicon.ico', function(req, res) {
    res.send('favicon');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
