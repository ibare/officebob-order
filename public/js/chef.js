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
    var numberOfReserve = 0;
    var numberOfCooking = 0;
    var numberOfCooked = 0;

    var renderData = orders.map(function(order) {
      order.isReserve = false;
      order.isCooking = false;
      order.isCooked = false;

      switch(order.status) {
        case 'reserve':
          numberOfReserve++;
          order.isReserve = true;
          break;
        case 'cook':
          numberOfCooking++;
          order.isCooking = true;
          break;
        case 'cooked':
          numberOfCooked++;
          order.isCooked = true;
          break;
      }
      return order;
    });

    renderData.numberOfCooked = numberOfCooked;
    renderData.numberOfCooking = numberOfCooking;
    renderData.numberOfReserve = numberOfReserve;
    
    $('.container').html(template({ orders: renderData }));

    $('.order.confirm').on('click', function(event) {
      socket.emit(CHANNEL.CONFIRM+'@start:order', event.target.dataset.slug);
    });

    $('.order.cooked').on('click', function(event) {
      socket.emit(CHANNEL.CONFIRM+'@finsh:order', event.target.dataset.slug);
    });

    $('ul.tabs').tabs();
  });

  socket.on(CHANNEL.ORDER+'@check:order:response', function(slug) {
    $('.slug-'+slug).addClass('blink');
    setTimeout(function() { $('.slug-'+slug).removeClass('blink') }, 1000);
  });
});
