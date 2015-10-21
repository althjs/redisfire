var express = require('express');
var path = require('path');
// var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var intercepter = require('./routes/interceptor');
var swig = require('swig');
var redisfire = require('./routes/service/redis');

var io = require


swig.setDefaults({
    cache: false,
    varControls: ['{[', ']}']
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// app.set('views', path.join(__dirname, './'));

/**
 * inject livereload
 */
if (app.get('env') === 'development') {
  try {
    app.use(require('connect-livereload-safe')());
  } catch(e) {
  }

}

var staticDir = path.join(__dirname + (/node_modules/.test(__dirname) ? './../../static' : './../static'));

console.log('@@ staticDir: ' + staticDir);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(staticDir));

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
