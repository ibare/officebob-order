var SAVEID = 'ramenOrder-'+moment().format('YYYY-MM-DD');

function getRamenOrder() {
  var ramenOrder = window.localStorage.getItem(SAVEID);

  if (ramenOrder) {
    return JSON.parse(ramenOrder);
  } else {
    return false;
  }
}

function setRamenOrder(info) {
  window.localStorage.setItem(SAVEID, JSON.stringify(info));
  return info;
}

$(window).on('resize', function() {
  $('body').width($(window).width());
  $('body').height($(window).height());
});

$(function() {
  var ramenOrder = getRamenOrder();
  var CHANNEL = {
    RESERVE: 'channel:reserve',
    ORDER: 'channel:order',
    CONFIRM: 'channel:confirm'
  };
  var slug = null;
  var socket = io();

  setTimeout(function() {
    Materialize.toast('<div>23번 손님 라면나왔습니다.<br><img src="/images/ramen.jpg" width="100%"></div>', 3000);
  },2000);

  $('body').width($(window).width());
  $('body').height($(window).height());

  if (ramenOrder) {
    $('.btn-order').text('키친에 예약 확인');

    if (ramenOrder.orderNumber > 0) {
      $('.order-result>h1').text(ramenOrder.orderNumber);
    } else {
      $('.order-result>h1').text(ramenOrder.slug);
    }
  } else {
    $('.btn-order').text('예약하기');
  }

  // 예약 완료
  socket.on(CHANNEL.RESERVE+'@reserve:order:response', function(orderNumber) {
    ramenOrder.orderNumber = orderNumber;
    $('.btn-order').text('키친에 예약 확인');
    $('.order-result>h1').text(orderNumber);

    setRamenOrder(ramenOrder);
  });

  // 조리 시작
  socket.on(CHANNEL.CONFIRM+'@start:order:response', function(info) {
    if (info.slug == ramenOrder.slug) {
      ramenOrder.status = 'cook';

      $('.btn-order').hide();
      $('.order-result>h1').text('대기 번호 '+info.orderNumber+'번 조리중입니다.');

      setRamenOrder(ramenOrder);
    }
  });

  /**
   * 조리 완료!!
   */
  socket.on(CHANNEL.CONFIRM+'@finish:order:response', function(info) {
    console.log(ramenOrder, info);
    if (info.slug == ramenOrder.slug) {
      ramenOrder.status = 'cooked';
      setRamenOrder(ramenOrder);

      $('.order-result>h1').text('라면이 나왔습니다~~');
    }
  });

  // 예약 요청
  $('.btn-order').on('click', function() {
    if (!ramenOrder || ramenOrder.status != 'reserve') {
      var time = $('input[name=time]:checked').val();
      var group1 = +$('input[name=group1]:checked').val();
      var group2 = +$('input[name=group2]:checked').val();
      var min = 100;
      var max = 999;

      slug = Math.floor(Math.random()*(max-min+1)+min);

      ramenOrder = setRamenOrder({
        slug: slug,
        orderNumber: 0,
        time: time,
        ramen1: group1,
        ramen2: group2,
        status: 'reserve'
      });

      socket.emit(`${CHANNEL.ORDER}@reserve:order`, {
        slug: slug,
        time: time,
        ramen1: group1,
        ramen2: group2
      });
    } else {
      socket.emit(`${CHANNEL.ORDER}@confirm:order`, {
        slug: ramenOrder.slug
      });
    }
  });
});
