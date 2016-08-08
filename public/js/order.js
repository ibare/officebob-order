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
    var group1 = Number($('input[name=group1]:checked').val());
    var group2 = Number($('input[name=group2]:checked').val());
    var min = 100;
    var max = 999;
    var slug = Math.floor(Math.random()*(max-min+1)+min) + Date.now().toString().substr(10);

    socket.emit(`${CHANNEL.ORDER}@reserve:order`, {
      slug: slug,
      ramen1: group1,
      ramen2: group2
    });
  });
});
