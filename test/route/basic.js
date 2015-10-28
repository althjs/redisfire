'use strinct';

var should = require('should');
var assert = require('assert');
var request = require('supertest');
var winston = require('winston');
var requireHelper = require('../require_helper');
var app = requireHelper('bin/www');


describe('Routing', function() {

    // within before() you can run all the operations that are needed to setup your tests. In this case
    // I want to create a connection with the database, and when I'm done, I call done().
    before(function(done) {
        // In our tests we use the test db
        // mongoose.connect(config.db.mongodb);

        setTimeout(function() {
          done();
        }, 500);
    });
    // use describe to give a title to your test suite, in this case the tile is "Account"
    // and then specify a function in which we are going to declare all the tests
    // we want to run. Each test starts with the function it() and as a first argument
    // we have to provide a meaningful title for it, whereas as the second argument we
    // specify a function that takes a single parameter, "done", that we will use
    // to specify when our test is completed, and that's what makes easy
    // to perform async test!
    describe('Service module should be exposed', function() {
        it('/foo/bar should be response "hi there~"', function (done) {
            request(app)
                .get('/service/foo/bar')
                .send()
                .expect(200) //Status code
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    // this is should.js syntax, very clear
                    res.res.text.should.equal('hi there~');

                    done();
                });
        });

    });

    describe('Redisfire test project have to initialized && service module test', function() {
      it('/service/foo/init_test should response "SUCCESS"', function (done) {
        this.timeout(4000);
        request(app)
          .get('/service/foo/init_test')
          .send()
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }

            res.res.text.should.equal('SUCCESS');

            done();
          });
      });


      it('/service/foo/rest/restparam rest service should works well', function (done) {
        request(app)
          .get('/service/foo/rest/foo/bar')
          .send()
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }

            res.res.text.should.equal('{"param1":"foo","param2":"bar"}');

            done();
          });
      });


      it('/service/foo/rest/promise Service module return promise', function (done) {
        request(app)
          .get('/service/foo/promise')
          .send()
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }

            res.res.text.should.equal('Deferred promise resolve() return Service TEST');

            done();
          });
      });

      it('/service/foo/rest/promise_reject Service module return promise', function (done) {
        request(app)
          .get('/service/foo/promise_reject')
          .send()
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }

            res.res.text.should.equal('{"code":"ERROR","interceptor":"/service/foo/promise_reject","error":"Deferred promise reject() return Service TEST"}');

            done();
          });
      });

      it('Unknown service should return 404', function (done) {
        request(app)
          .get('/service/unknown_service')
          .send()
          .expect(404)
          .end(function (err, res) {
            if (err) {
              throw err;
            }

            res.res.text.should.equal('service not found');

            done();
          });
      });


      it('Homepage should servced', function (done) {
        request(app)
          .get('/')
          .send()
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }

            console.log(res.res.text);
            // res.res.text.should.equal('service not found');

            done();
          });
      });

    });

    describe('RESTful API test', function() {



      it('[GET] unknown project request should return 404 with ', function (done) {
        request(app)
          .get('/rest/redisfire-test-adsfadsfadsfdsaf')
          .send()
          .expect(404)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            data.code.should.equal('FAIL');
            done();
          });
      });

      it('[GET] /rest - rest root should return info response', function (done) {
        request(app)
          .get('/rest')
          .send()
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            data.code.should.equal('FAIL');
            done();
          });
      });



      it('[GET] /rest/redisfire-test/feed/entry data type should be Array', function (done) {
        request(app)
          .get('/rest/redisfire-test/feed/entry')
          .send()
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            (data.data.length).should.equal(10);
            done();
          });
      });

      it('[GET] /rest/redisfire-test/feed/entry/1 should return correct data', function (done) {
        request(app)
          .get('/rest/redisfire-test/feed/entry/1')
          .send()
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text).data;

            (data.title).should.equal('Volkswagen’s massive recall will start in January');
            (data.link._type).should.equal('text/html');
            done();
          });
      });

      it('[GET] /rest/redisfire-test/feed/entry/1/author/name should return correct data', function (done) {
        request(app)
          .get('/rest/redisfire-test/feed/entry/1/author/name')
          .send()
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text).data;

            data.should.equal('Rich McCormick');
            done();
          });
      });


      it('[POST] /rest/redisfire-test/foo POST create should be success"', function (done) {
        request(app)
          .post('/rest/redisfire-test/foo')
          .send({foo:"bar"})
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            data.code.should.equal('SUCCESS');
            done();
          });
      });

      it('[GET] created data (Object) should be return', function (done) {
        request(app)
          .get('/rest/redisfire-test/foo')
          .send()
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            (JSON.stringify(data.data)).should.equal('{"foo":"bar"}');
            done();
          });
      });

      it('[DELETE] data should deleted', function (done) {
        request(app)
          .delete('/rest/redisfire-test/foo')
          .send()
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            (data.code).should.equal('SUCCESS');
            done();
          });
      });

      it('[GET] deleted date should be return 404', function (done) {
        request(app)
          .get('/rest/redisfire-test/foo')
          .send()
          .expect(404)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            (data.code).should.equal('FAIL');
            done();
          });
      });


      it('[POST] /rest/redisfire-test/foo POST (Array) create should be success"', function (done) {
        request(app)
          .post('/rest/redisfire-test/foo')
          .send([1,2,'3',4,5,'foo',{test:'test value'}])
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            data.code.should.equal('SUCCESS');
            done();
          });
      });

      it('POST created data (Array) should be return', function (done) {
        request(app)
          .get('/rest/redisfire-test/foo')
          .send()
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            (JSON.stringify(data.data)).should.equal('["1","2","3","4","5","foo",{"test":"test value"}]');
            done();
          });
      });

      it('[DELETE] data should deleted', function (done) {
        request(app)
          .delete('/rest/redisfire-test/foo')
          .send()
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            (data.code).should.equal('SUCCESS');
            done();
          });
      });

      it('[GET] deleted date should be return 404', function (done) {
        request(app)
          .get('/rest/redisfire-test/foo')
          .send()
          .expect(404)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            (data.code).should.equal('FAIL');
            done();
          });
      });


      it('[POST] /rest/redisfire-test/feed/entry/100000 POST (Array) to array schema create should be success"', function (done) {
        request(app)
          .post('/rest/redisfire-test/feed/entry/100000')
          .send({foo:"bar"})
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            data.code.should.equal('SUCCESS');
            done();
          });
      });

      it('POST created data should be in the last index of array', function (done) {
        request(app)
          .get('/rest/redisfire-test/feed/entry')
          .send()
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            (data.data.length).should.equal(11);
            (JSON.stringify(data.data[10])).should.equal('{"foo":"bar"}')
            done();
          });
      });

      it('[POST] /rest/redisfire-test/feed/entry/100000 POST (Array) to array schema create should be success"', function (done) {
        request(app)
          .post('/rest/redisfire-test/feed/entry/100000')
          .send({foo:"bar2"})
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            data.code.should.equal('SUCCESS');
            done();
          });
      });

      it('[POST] created data should be in the last index of array', function (done) {
        request(app)
          .get('/rest/redisfire-test/feed/entry')
          .send()
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            (data.data.length).should.equal(12);
            (JSON.stringify(data.data[11])).should.equal('{"foo":"bar2"}')
            done();
          });
      });

      it('[DELETE] some index of data sould be delete', function (done) {
        request(app)
          .delete('/rest/redisfire-test/feed/entry/10')
          .send()
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            (data.code).should.equal('SUCCESS');
            done();
          });
      });

      it('[GET] deleted array index data shoul be null', function (done) {
        request(app)
          .get('/rest/redisfire-test/feed/entry')
          .send()
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            (data.data.length).should.equal(12);
            (JSON.stringify(data.data[10])).should.equal('null')
            done();
          });
      });

      it('[DELETE] some index of data sould be delete', function (done) {
        request(app)
          .delete('/rest/redisfire-test/feed/entry/11')
          .send()
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            (data.code).should.equal('SUCCESS');
            done();
          });
      });

      it('[GET] deleted date should be return 404', function (done) {
        request(app)
          .get('/rest/redisfire-test/feed/entry/11')
          .send()
          .expect(404)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            (data.code).should.equal('FAIL');
            done();
          });
      });




      it('[POST] /rest/redisfire-test POST request for the project root should be reject"', function (done) {
        request(app)
          .post('/rest/redisfire-test')
          .send({foo:"bar"})
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            data.code.should.equal('FAIL');
            done();
          });
      });


      it('[DELETE] unregisterd data DELETE request should be return fail"', function (done) {
        request(app)
          .delete('/rest/redisfire-test/unregistered_key')
          .send()
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            data.code.should.equal('FAIL');
            done();
          });
      });

      it('[PUT] unknown key PUT request shuold be rejected', function (done) {
        request(app)
          .put('/rest/redisfire-test/unregistered_key')
          .send({foo:"bar"})
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            data.code.should.equal('FAIL');
            done();
          });
      });

      it('[PUT] valid PUT request shuold replace that key', function (done) {
        request(app)
          .put('/rest/redisfire-test/feed/icon')
          .send({foo:"bar"})
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            data.code.should.equal('SUCCESS');
            done();
          });
      });

      it('[GET] updated data should same with update request data', function (done) {
        request(app)
          .get('/rest/redisfire-test/feed/icon')
          .send()
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            (JSON.stringify(data.data)).should.equal('{"foo":"bar"}')
            done();
          });
      });

      it('[PUT] valid PUT request shuold replace that key', function (done) {
        request(app)
          .put('/rest/redisfire-test/feed/icon')
          .send({foo:"bar2"})
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            data.code.should.equal('SUCCESS');
            done();
          });
      });

      it('[POST] POST request should be delegate to PUT if key exists', function (done) {
        request(app)
          .post('/rest/redisfire-test/feed/icon')
          .send({foo:"bar2"})
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            data.code.should.equal('SUCCESS');
            done();
          });
      });

      it('[PUT] valid PUT request shuold replace that key', function (done) {
        request(app)
          .put('/rest/redisfire-test/feed/icon')
          .send({foo:"bar",hello:"world", "arr":[1,2,3,4,5,6]})
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            data.code.should.equal('SUCCESS');
            done();
          });
      });


      it('[PUT] valid PUT request shuold replace that key', function (done) {
        request(app)
          .put('/rest/redisfire-test/feed/icon')
          .send(["foo", "bar", {obj:{hello:"world"}}])
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            data.code.should.equal('SUCCESS');
            done();
          });
      });

      it('[GET] updated data should same with update request data', function (done) {
        request(app)
          .get('/rest/redisfire-test/feed/icon')
          .send()
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            (JSON.stringify(data.data)).should.equal('["foo","bar",{"obj":{"hello":"world"}}]')
            done();
          });
      });

      it('[PUT] valid PUT request shuold replace that key', function (done) {
        request(app)
          .put('/rest/redisfire-test/feed/icon')
          .send({foo:"bar",hello:"world"})
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            data.code.should.equal('SUCCESS');
            done();
          });
      });

      it('[GET] /rest/redisfire-test code should be "SUCCESS"', function (done) {
        request(app)
          .get('/rest/redisfire-test')
          .send()
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            data.code.should.equal('SUCCESS');
            done();
          });
      });

      it('[GET] /rest/redisfire-test/ code should be "SUCCESS"', function (done) {
        request(app)
          .get('/rest/redisfire-test/')
          .send()
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            data.code.should.equal('SUCCESS');
            done();
          });
      });

    });

    describe('Socket', function() {
      it('[SOCKET] GET', function (done) {
        request(app)
          .get('/service/foo/socket_test')
          .send()
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            (JSON.stringify(data)).should.equal('{"res":{"code":"SUCCESS","data":"Rich McCormick"},"params":{"foo":"bar"}}');
            done();
          });
      });

      it('[SOCKET] POST', function (done) {
        request(app)
          .get('/service/foo/socket_test?type=POST')
          .send()
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            (JSON.stringify(data)).should.equal('{"res":{"code":"SUCCESS","data":{"redisfire-test>feed>entry@>2>author>name2>hello":"WORLD"}},"params":{"foo":"bar"}}');


            setTimeout(function() {
              done();
            }, 500);
          });
      });



      it('[SOCKET] DELETE', function (done) {

        request(app)
          .get('/service/foo/socket_test?type=DELETE')
          .send()
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            (JSON.stringify(data)).should.equal('{"res":{"code":"SUCCESS","data":1},"params":{"foo":"bar"}}');
            done();
          });
      });

      it('[SOCKET] PUT', function (done) {
        request(app)
          .get('/service/foo/socket_test?type=PUT')
          .send()
          .expect(200)
          .end(function (err, res) {
            if (err) {
              throw err;
            }
            var data = JSON.parse(res.res.text);
            (JSON.stringify(data)).should.equal('{"res":{"code":"SUCCESS","data":{"update":{"redisfire-test>feed>entry@>2>author>name":"Jongsoon"}}},"params":{"foo":"bar"}}');
            done();
          });
      });


      it('if server port already used, the redifire service should show the correct error message', function (done) {
        this.timeout(4000);
        request(app)
        .get('/service/foo/port_already_occupied')
        .send()
        .expect(200) //Status code
        .end(function(err, res) {
          if (err) {
            throw err;
          }
          // this is should.js syntax, very clear
          res.res.text.should.equal('Port 3001 is already in use\n');

          done();
        });
      });

      it('redisfire CLI command should works well', function (done) {
        this.timeout(4000);
        request(app)
        .get('/service/foo/redisfire_cli')
        .send()
        .expect(200) //Status code
        .end(function(err, res) {
          if (err) {
            throw err;
          }
          // this is should.js syntax, very clear
          res.res.text.should.equal('true');

          done();
        });
      });

      it('redisfire-import CLI should show help when invalid argument', function (done) {
        this.timeout(4000);
        request(app)
        .get('/service/foo/redisfire_import_cli')
        .send()
        .expect(200) //Status code
        .end(function(err, res) {
          if (err) {
            throw err;
          }
          // this is should.js syntax, very clear
          res.res.text.should.equal('true');

          done();
        });
      });
    });

});
