var lod = require('lodash');
var moment = require('moment');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var io = require('socket.io')(server);
var mongodb = null;
var workDate = moment().format('YYYY-MM-DD');

var ramenSchema = new Schema({
  orderDate: { type: String },
  lastOrderNumber: { type: Number },
  orders: { type: Array }
});

var Ramens = mongoose.model('ramen', ramenSchema);

const CHANNEL = {
  RESERVE: 'channel:reserve',
  ORDER: 'channel:order',
  CONFIRM: 'channel:confirm'
};

function setToday() {
  var today = moment().format('YYYY-MM-DD');

  if (workDate != today)
    workDate = today;
}

setInterval(setToday, 1000*60);

mongoose.connect('mongodb://officebob:officeboborder@ds011251.mlab.com:11251/heroku_q9xb9lk4', (err, db) => {
  console.log('connected mongodb');
});

app.use(express.static('public'));

/**
 * 클라리언트 접속
 */
io.sockets.on('connection', socket => {
  // orders 채널 조인
  socket.join('ALL');

  // 모든 주문 요청 수신
  socket.on(`${CHANNEL.ORDER}@all:orders`, () => {
    console.log('@all:orders');
    Ramens.findOne({
      orderDate: workDate
    }).exec((err, docs) => {
      console.log('@update:orders:response');
      socket.emit(`${CHANNEL.ORDER}@update:orders:response`, docs.orders);
      socket.to('ALL').emit(`${CHANNEL.ORDER}@update:orders:response`, docs.orders);
    });
  });

  // 신규 주문 예약
  socket.on(`${CHANNEL.ORDER}@reserve:order`, bill => {
    Ramens.findOne({
      orderDate: workDate
    }).exec((err, docs) => {
      console.log(workDate, err, docs);
      var order = {
        slug: bill.slug,
        time: bill.time,
        ramen1: bill.ramen1,
        ramen2: bill.ramen2,
        orderNumber: -1,
        status: 'reserve',
        timestamp: Date.now()
      };

      docs.orders.push(order);
      docs.save((err, docs) => {
        // 신규 예약 번호 응답
        socket.emit(`${CHANNEL.RESERVE}@reserve:order:response`, bill.slug);
        // 주문서 업데이트
        socket.emit(`${CHANNEL.ORDER}@update:orders:response`, docs.orders);
        socket.to('ALL').emit(`${CHANNEL.ORDER}@update:orders:response`, docs.orders);
      });
    });
  });

  // 주문 확인
  socket.on(`${CHANNEL.ORDER}@confirm:order`, bill => {
    socket.to('ALL').emit(`${CHANNEL.ORDER}@check:order:response`, bill.slug);
  });

  // 조리 시작
  socket.on(`${CHANNEL.CONFIRM}@start:order`, slug => {
    console.log('@start:order');
    Ramens.findOne({
      orderDate: workDate,
    }).exec((err, docs) => {
      var newOrderNumber = docs.lastOrderNumber + 1;

      Ramens.update({ orderDate: workDate, 'orders.slug': Number(slug) }, { '$set': {
        'lastOrderNumber': newOrderNumber,
        'orders.$.status': 'cook',
        'orders.$.orderNumber': newOrderNumber
      }}, function(err, docs) {
        // 주문서 업데이트
        Ramens.findOne({
          orderDate: workDate,
        }).exec((err, docs) => {
          socket.emit(`${CHANNEL.ORDER}@update:orders:response`, docs.orders);
          socket.to('ALL').emit(`${CHANNEL.ORDER}@update:orders:response`, docs.orders);
          socket.to('ALL').emit(`${CHANNEL.CONFIRM}@start:order:response`, {
            slug: slug, orderNumber: newOrderNumber
          });
        });
      });
    });
  });

  // 조리 완료
  socket.on(`${CHANNEL.CONFIRM}@finsh:order`, slug => {
    Ramens.findOne({
      orderDate: workDate,
    }, (err, docs) => {
      var newOrderNumber = docs.lastOrderNumber + 1;

      Ramens.update({ orderDate: workDate, 'orders.slug': Number(slug) }, { '$set': {
        'orders.$.status': 'cooked'
      }}, function(err) {
        // 주문서 업데이트
        Ramens.findOne({
          orderDate: workDate,
        }).exec((err, docs) => {
          socket.emit(`${CHANNEL.ORDER}@update:orders:response`, docs.orders);
          socket.to('ALL').emit(`${CHANNEL.ORDER}@update:orders:response`, docs.orders);
          socket.to('ALL').emit(`${CHANNEL.CONFIRM}@finish:order:response`, {
            slug: slug, orderNumber: newOrderNumber
          });
        });
      });
    });
  });

  socket.on('disconnect', () => {
    console.log('disconnect');
  });
});

server.listen(process.env.PORT || 8080, () => console.log('start server'));
