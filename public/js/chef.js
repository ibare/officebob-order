function blinker() {
  $('.blink_me').fadeOut(500);
  $('.blink_me').fadeIn(500);
}

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
      order.isCooking = order.status == 'cook';
      order.isCooked = order.status == 'cooked';
      return order;
    });

    $('.order-list').html(template({ orders: renderData }));

    $('.order.confirm').on('click', function(event) {
      socket.emit(CHANNEL.CONFIRM+'@start:order', event.target.dataset.slug);
    });

    $('.order.cooked').on('click', function(event) {
      socket.emit(CHANNEL.CONFIRM+'@finsh:order', event.target.dataset.slug);
    });
  });

  socket.on(CHANNEL.ORDER+'@check:order:response', function(slug) {
    $('.slug-'+slug).addClass('blink');
    setTimeout(function() { $('.slug-'+slug).removeClass('blink') }, 1000);
  });
});
