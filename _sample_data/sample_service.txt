'use strict';

var redisfire = require('redisfire');


var successCallback = redisfire.successCallback,
  errorCallback = redisfire.errorCallback;

exports.demo = function (req, res) {
  var demo = `
  <h3> This is redisfire service sample</h3>

  <p>
  Redisfire includes Web application server the Express.js by default.<br/>
  The '/service' uri is occupied for the Redisfire servcie.<br/>
  If you add test.js to service folder, '/service/test' path will working with ExpressJS Routing way.<br/>
  The exported function name is the exposed like '/service/test/[function name]'.<br/>
  The function must have two arguments req & res. (Please refer   <a href="http://expressjs.com/en/guide/routing.html" target="_blank">Express Routing</a>)<br/>
  </p>
  <ul>
    <li><a href="/service/foo/sample_success_callback">successCallback</a></li>
    <li><a href="/service/foo/sample_error_callback">errorCallback</a></li>
    <li><a href="/service/foo/sample_get">server side get data</a></li>
    <li><a href="/service/foo/sample_post">server side post data</a></li>
    <li><a href="/service/foo/sample_put">server side put data</a></li>
    <li><a href="/service/foo/sample_delete">server side delete data</a></li>
  </ul>`;

  res.send(demo);
};


exports.sample_success_callback = function (req, res) {
  res.send(successCallback('usage of redisfire.successCallback'));
};

exports.sample_error_callback = function (req, res) {
  res.send(errorCallback('usage of redisfire.errorCallback'));
};


exports.sample_get = function (req, res) {
  var path = req.query.path || 'theverge';

  redisfire.ioGET(path).then(function(o) {
    res.send(successCallback(o));
  }, function(err) {
    res.send(errorCallback(err));
  });
};


exports.sample_post = function (req, res) {
  var path = req.query.path || 'theverge/test',
    post_data = req.query.post_data || 'sample post data';

  var post_body = {foo: post_data};

  redisfire.ioPOST(path, post_body).then(function(o) {
    res.send(successCallback(o));
  }, function(err) {
    res.send(errorCallback(err));
  });
};



exports.sample_put = function (req, res) {
  var path = req.query.path || 'theverge/test',
    post_body = {hello: 'Redisfire!!'};

  redisfire.ioPUT(path, post_body).then(function(o) {
    res.send(successCallback(o));
  }, function(err) {
    res.send(errorCallback(err));
  });
};




exports.sample_delete = function (req, res) {
  var path = req.query.path || 'theverge/test';

  redisfire.ioDELETE(path).then(function(o) {
    res.send(successCallback(o));
  }, function(err) {
    res.send(errorCallback(err));
  });
};
