
var http = require('http').Server;
var io = require('..');
var fs = require('fs');
var join = require('path').join;
var ioc = require('socket.io-client');
var request = require('supertest');
var expect = require('expect.js');

// creates a socket.io client for the given server
function client(srv, nsp, opts){
  if ('object' == typeof nsp) {
    opts = nsp;
    nsp = null;
  }
  var addr = srv.address();
  if (!addr) addr = srv.listen().address();
  var url = 'ws://' + addr.address + ':' + addr.port + (nsp || '');
  return ioc(url, opts);
}

describe('base socket.io', function(){

  describe('disconnect', function() {
    thetest(0, 200);
    thetest(100, 0);
    thetest(100, 200);
    thetest(0, 0);
  });

  function thetest(delay1, delay2) {
    it('connect twice in ' + delay1 + 'ms, disconnect after ' + delay2 + 'ms',
    function(done){
      var srv = http();
      var sio = io(srv);
      var total = 8;
      srv.listen(function(){
        sio.of('/chat').on('connect', function(s) {
          console.log('server connected socket on /chat', s.client.id);
          --total || done();
          s.on('disconnect', function() {
            console.log('server disconnected socket on /chat', s.client.id);
            --total || done();
          });
        });
        sio.of('/news').on('connect', function(s) {
          console.log('server connected socket on /news', s.client.id);
          --total || done();
          s.on('disconnect', function() {
            console.log('server disconnected socket on /news', s.client.id);
            --total || done();
          });
        });
        var chat = client(srv, '/chat');
        chat.on('connect', function(){
          --total || done();
          console.log('client connected socket on /chat.');
          setTimeout(function() {
            console.log('client disconnecting socket on /chat.');
            --total || done();
            chat.disconnect();
          }, delay2);
        });
        setTimeout(function() {
          var news = client(srv, '/news');
          news.on('connect', function(){
            --total || done();
            console.log('client connected socket on /news.')
            setTimeout(function() {
              console.log('client disconnecting socket on /news.');
              --total || done();
              news.disconnect();
            }, delay2);
          });
        }, delay1);
      });
    });
  }
});
