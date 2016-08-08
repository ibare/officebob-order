var express = require('express');
var app = express();
var server = require('http').Server(app);
var mongo = require('mongodb').MongoClient;
var io = require('socket.io')(server);

var orderdate = '2016-08-01';
var mongodb = null;

const CHANNEL = {
  RESERVE: 'channel:reserve',
  ORDER: 'channel:order',
  CONFIRM: 'channel:confirm'
};

// function updateOrders() {
//   var orders = mongodb.collection(CHANNEL.RESERVE);
//
//   orders.updateOne({ orderdate: orderdate }, {
//       $set: {
//         '1st': numOrders['1st'],
//         '2th': numOrders['2th'],
//         '3rd': numOrders['3rd']
//       }}, function(err, result) {
//       console.log('update!');
//     }
//   );
// }

mongo.connect('mongodb://officebob:officeboborder@ds011251.mlab.com:11251/heroku_q9xb9lk4', function(err, db) {
  if (err) {
    return console.error(err);
  }

  mongodb = db;

  var orders = mongodb.collection('orders');

  orders.find({ orderdate: orderdate }).toArray((err, docs) => {
    if (err) {
      return console.error(err);
    }

    // numOrders['1st'] = docs[0]['1st'];
    // numOrders['2th'] = docs[0]['2th'];
    // numOrders['3rd'] = docs[0]['3rd'];
    // numOrders['slug'] = docs[0]['slug'];

    console.log("Connected mongodb");
  });
});

app.use(express.static('public'));

/**
 * 클라리언트 접속
 */
io.sockets.on('connection', socket => {
  // orders 채널 조인
  socket.join(CHANNEL.ORDER);
  socket.join(CHANNEL.CONFIRM);

  socket.on(`${CHANNEL.ORDER}@reserve:order`, time => {
    socket.emit(`${CHANNEL.RESERVE}@reserve:order:response`, Math.random());
  });

  console.log('connect');

  socket.on('disconnect', () => {
    console.log('disconnect');
  });
});

server.listen(process.env.PORT || 8080, () => console.log('start server'));
