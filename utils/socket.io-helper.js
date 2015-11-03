'use strict';

var io,
    $q = require('q');
// exports.init = function(req, res) {
//
//     if (io) {
//         // console.log('socket.io is already inited.');
//         res.send('socket.io is already initialized.');
//         return;
//     }
//
//     io = req.app.set('socket.io');
//
//     io.on('connection', function (socket) {
//         socket.emit('news', { hello: 'world' });
//         socket.on('my other event', function (data) {
//             console.log(data);
//         });
//     });
//
//     res.send('socket.io was initialized successfully.');
// }

exports.io = function(_io) {
    io = _io;
    io.on('connection', function (socket) {
        socket.emit('news', { hello: 'world' });
    });
};

exports.get_socket_io = function(t) {
    // console.log('get_socket_io called', t);
    var deferred = $q.defer();

    var resolveIO = function(ts) {
        setTimeout(function() {

            if (io) {
                deferred.resolve(io);
            } else {
                resolveIO(500);
            }
        }, ts||0);
    };
    resolveIO();
    return deferred.promise;
};
