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

function activateBoard(order) {
  if (order) {
    switch(order.status) {
      case 'reserve':
        $('#reserve-board').show();
        $('#order-board').hide();
        $('#cooking-board').hide();
        $('#cooked-board').hide();

        var timeText = order.time == '1st' ? '4:00PM' : '4:30PM';
        var ramenText;

        if (order.ramen1 > 0 && order.ramen2 > 0) {
          ramenText = '파송송계란탁 라면 '+order.ramen1+' 그릇, 치즈 라면 '+order.ramen2+' 그릇';
        } else {
          if (order.ramen1 > 0) {
            ramenText = '파송송계란탁 라면 '+order.ramen1+' 그릇';
          } else {
            ramenText = '치즈 라면 '+order.ramen2+' 그릇';
          }
        }

        $('.reserve-no').text(order.slug)
        $('.ramen-text').text(ramenText);
        break;
      case 'cook':
        $('#reserve-board').hide();
        $('#order-board').hide();
        $('#cooking-board').show();
        $('#cooked-board').hide();

        $('.wati-order-no').text(order.orderNumber);
        break;
      case 'cooked':
        $('#reserve-board').hide();
        $('#order-board').hide();
        $('#cooking-board').hide();
        $('#cooked-board').show();

        $('.wati-order-no').text(order.orderNumber);
        break;
    }
    //
    // if (ramenOrder.orderNumber > 0) {
    //   $('.order-result>h1').text(ramenOrder.orderNumber);
    // } else {
    //   $('.order-result>h1').text(ramenOrder.slug);
    // }
  } else {
    $('#order-board').show();
  }
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

  // setTimeout(function() {
  //   Materialize.toast('<div>23번 손님 라면나왔습니다.<br><img src="/images/ramen.jpg" width="100%"></div>', 3000);
  // },2000);

  $('body').width($(window).width());
  $('body').height($(window).height());

  activateBoard(ramenOrder);

  // 예약 완료
  socket.on(CHANNEL.RESERVE+'@reserve:order:response', function(orderNumber) {
    ramenOrder.orderNumber = orderNumber;

    setRamenOrder(ramenOrder);
    activateBoard(ramenOrder);
  });

  // 조리 시작
  socket.on(CHANNEL.CONFIRM+'@start:order:response', function(info) {
    if (info.slug == ramenOrder.slug) {
      ramenOrder.status = 'cook';
      ramenOrder.orderNumber = info.orderNumber;

      setRamenOrder(ramenOrder);
      activateBoard(ramenOrder);
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
      activateBoard(ramenOrder);
    }
  });

  // 라면 수량 추가
  $('.btn-add').on('click', function(event) {
    var data = event.currentTarget.dataset;
    var current = $('.order-count[data-time='+data.time+'][data-menu='+data.menu+']');

    current.text('+'+(+current.text()+1));
  });

  // 라면 수량 취소
  $('.btn-remove').on('click', function(event) {
    var data = event.currentTarget.dataset;
    var current = $('.order-count[data-time='+data.time+'][data-menu='+data.menu+']');

    if(+current.text() == 0) return;
    if(+current.text() == 1) {
      current.text(0);
    } else {
      current.text('+'+(+current.text()-1));
    }
  });

  // 예약 요청
  $('.btn-reserve').on('click', function(event) {
    var time = event.currentTarget.dataset.time;
    var group1 = +$('.order-count[data-time='+time+'][data-menu=basic]').text();
    var group2 = +$('.order-count[data-time='+time+'][data-menu=cheese]').text();
    var min = 1000;
    var max = 9999;

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
  });

  $('.check-reserve-signal').on('click', function(event) {
    socket.emit(`${CHANNEL.ORDER}@confirm:order`, {
      slug: ramenOrder.slug
    });

    setTimeout(function() {
      Materialize.toast('키친에 예약 확인을 요청했습니다', 2000);
    },200);
  });
});
