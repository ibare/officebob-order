function getRamenOrder() {
  let ramenOrder = window.localStorage.getItem('ramenOrder');

  if (ramenOrder) {
    return JSON.parse(ramenOrder);
  } else {
    return false;
  }
}

function setRamenOrder(info) {
  window.localStorage.setItem('ramenOrder', JSON.stringify(info));
  return info;
}

$(function() {
  var ramenOrder = getRamenOrder();
  var CHANNEL = {
    RESERVE: 'channel:reserve',
    ORDER: 'channel:order',
    CONFIRM: 'channel:confirm'
  };
  var slug = null;
  var socket = io();

  if (ramenOrder) {
    if (ramenOrder.orderNumber > 0) {
      $('.order-result>h1').text(ramenOrder.orderNumber);
    } else {
      $('.order-result>h1').text(ramenOrder.slug);
    }
  }
  // 예약 완료
  socket.on(CHANNEL.RESERVE+'@reserve:order:response', function(orderNumber) {
    ramenOrder.orderNumber = orderNumber;
    $('.order-result>h1').text(orderNumber);

    setRamenOrder(ramenOrder);
  });

  // 조리 시작
  socket.on(CHANNEL.CONFIRM+'@start:order:response', info => {
    if (info.slug == slug) {
      ramenOrder.status = 'cook';

      $('.order-result>h1').text(info.orderNumber);

      setRamenOrder(ramenOrder);
    }
  });

  /**
   * 조리 완료!!
   */
  socket.on(CHANNEL.CONFIRM+'@finish:order:response', info => {
    console.log(ramenOrder, info);
    if (info.slug == ramenOrder.slug) {
      ramenOrder.status = 'cooked';
      setRamenOrder(ramenOrder);

      alert('조리가 완료되었습니다.')
    }
  });

  $('.btn-order').on('click', function() {
    // 주문하기
    var group1 = Number($('input[name=group1]:checked').val());
    var group2 = Number($('input[name=group2]:checked').val());
    var min = 100;
    var max = 999;

    slug = Math.floor(Math.random()*(max-min+1)+min) + Date.now().toString().substr(10);

    ramenOrder = setRamenOrder({
      slug: slug,
      orderNumber: 0,
      ramen1: group1,
      ramen2: group2,
      status: 'reserve'
    });

    socket.emit(`${CHANNEL.ORDER}@reserve:order`, {
      slug: slug,
      ramen1: group1,
      ramen2: group2
    });
  });
});
