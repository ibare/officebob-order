$(function() {
  var template = Handlebars.compile($("#orders-template").html());
  var CHANNEL = {
    RESERVE: 'channel:reserve',
    ORDER: 'channel:order',
    CONFIRM: 'channel:confirm'
  };

  var socket = io();

  socket.emit(CHANNEL.ORDER+'@all:orders');
  socket.on(CHANNEL.ORDER+'@update:orders:response', function(orders) {
    var renderData = orders.map(function(order) {
      order.isReserve = order.status == 'reserve';
      return order;
    });

    $('.order-list').html(template({ orders: renderData }));

    $('.order.confirm').on('click', function(event) {
      socket.emit(CHANNEL.CONFIRM+'@start:order', event.target.dataset.slug);
    });
  });


});
