$(function() {
  var CHANNEL = {
    RESERVE: 'channel:reserve',
    ORDER: 'channel:order',
    CONFIRM: 'channel:confirm'
  };

  var socket = io();

  socket.on(CHANNEL.RESERVE+'@reserve:order:response', function(orderNumber) {
    $('.order-result').text(orderNumber);
  });

  $('.btn-order').on('click', function() {
    // 주문하기
    socket.emit(`${CHANNEL.ORDER}@reserve:order`);
  });
});
