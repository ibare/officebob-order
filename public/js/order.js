var SAVEID = 'ramenOrder-'+moment().format('YYYY-MM-DD');
var TodayOrderStatus = {
  '1st': {
    reserve: 0,
    cook: 0,
    cooked: 0
  },
  '2th': {
    reserve: 0,
    cook: 0,
    cooked: 0
  }
};

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
          ramenText = '파송송 라면 '+order.ramen1+' 그릇<br>치즈 라면 '+order.ramen2+' 그릇';
        } else {
          if (order.ramen1 > 0) {
            ramenText = '파송송 라면 '+order.ramen1+' 그릇';
          } else {
            ramenText = '치즈 라면 '+order.ramen2+' 그릇';
          }
        }

        $('.reserve-no').text(order.slug)
        $('.ramen-text').html(ramenText);
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
  } else {
    $('#order-board').show();
    $('#reserve-board').hide();
    $('#cooking-board').hide();
    $('#cooked-board').hide();
  }
}

function setWindowSize() {
  $('body').width($(window).width());
  $('body').height($(window).height()+100);
}

$(window).on('resize', setWindowSize);

function mainApp(ramenOrder, profile) {
  var CHANNEL = {
    RESERVE: 'channel:reserve',
    ORDER: 'channel:order',
    CONFIRM: 'channel:confirm'
  };
  var slug = null;
  var socket = io();

  setWindowSize();
  activateBoard(ramenOrder);

  // 전체(or 변경 내역 있을 때 마다) 주문 내역 수신
  socket.on(CHANNEL.ORDER+'@update:orders:response', function(orders) {
    ['1st','2th'].forEach(function(t) {
      TodayOrderStatus[t].reserve = 0;
      TodayOrderStatus[t].cook = 0;
      TodayOrderStatus[t].cooked = 0;
    });

    orders.forEach(function(order) {
      TodayOrderStatus[order.time][order.status]++;
    });

    $('.first-info').text('현재 예약자 '+TodayOrderStatus['1st'].reserve+' 명, '+ TodayOrderStatus['1st'].cook +' 명 조리중');
    $('.second-info').text('현재 예약자 '+TodayOrderStatus['2th'].reserve+' 명, '+ TodayOrderStatus['2th'].cook +' 명 조리중');
  });

  // 예약 완료
  socket.on(CHANNEL.RESERVE+'@reserve:order:response', function(order) {
    ramenOrder = order;

    activateBoard(ramenOrder);

    swal("성공", "예약이 완료되었습니다. 시간에 맞춰 키친에서 반드시 식권대장으로 결제 후 맛있게 드십시오.", "success");
  });

  // 조리 시작
  socket.on(CHANNEL.CONFIRM+'@start:order:response', function(info) {
    if (info.slug == ramenOrder.slug) {
      ramenOrder.status = 'cook';
      ramenOrder.orderNumber = info.orderNumber;

      activateBoard(ramenOrder);
    }
  });

  /**
   * 조리 완료!!
   */
  socket.on(CHANNEL.CONFIRM+'@finish:order:response', function(info) {
    if (info.slug == ramenOrder.slug) {
      ramenOrder.status = 'cooked';
      activateBoard(ramenOrder);
    } else {
      $('.lastOrder').html('<strong>#'+info.orderNumber+'</strong>번이 조리 완료.<br><strong>#'+(info.orderNumber+1)+'</strong>번 주문 조리 시작!');
    }
  });

  /**
   * 주문 정보 수진
   */
  socket.on(CHANNEL.ORDER+'@checkcook:order:response', function(order) {
    if (typeof order == 'string') {
      swal('주문에 문제가 생겼습니다. 주방에 확인해주세요!');
    } else {
      if (order.status == 'cook') {
        Materialize.toast('아직 조리중입니다.', 3000);
      }
    }
  });

  // 라면 수량 추가
  $('.btn-add').on('click', function(event) {
    var data = event.currentTarget.dataset;
    var current = $('.order-count[data-time='+data.time+'][data-menu='+data.menu+']');

    current.text('+'+(+current.text()+1));
    $('.btn.btn-reserve[data-time='+data.time+']').removeClass('disabled');
    return false;
  });

  // 라면 수량 취소
  $('.btn-remove').on('click', function(event) {
    var data = event.currentTarget.dataset;
    var current = $('.order-count[data-time='+data.time+'][data-menu='+data.menu+']');

    if(+current.text() <= 1) {
      current.text(0);

      var ramen1 = +$('.order-count[data-time='+data.time+'][data-menu=basic]').text();
      var ramen2 = +$('.order-count[data-time='+data.time+'][data-menu=cheese]').text();

      if (ramen1 == 0 && ramen2 == 0) {
        $('.btn.btn-reserve[data-time='+data.time+']').addClass('disabled');
      }

      return false;
    }

    current.text('+'+(+current.text()-1));
    return false;
  });

  // 예약 요청
  $('.btn-reserve').on('click', function(event) {
    var time = event.currentTarget.dataset.time;
    var group1 = +$('.order-count[data-time='+time+'][data-menu=basic]').text();
    var group2 = +$('.order-count[data-time='+time+'][data-menu=cheese]').text();
    var min = 1000;
    var max = 9999;

    if (group1 == 0 && group2 == 0) {
      return false;
    }

    swal({
      title: "예약하시겠습니까?",
      text: "예약하신 후 예약하신 시간에 키친에 내려가 식권대장으로 결제 후 라면을 드실 수 있습니다.",
      showCancelButton: true,
      cancelButtonText: "아니요",
      confirmButtonColor: "#5dc2f1",
      confirmButtonText: "예약합니다.",
      closeOnConfirm: false,
      closeOnCancel: false
    }, function(isConfirm) {
      if (isConfirm) {
        slug = Math.floor(Math.random()*(max-min+1)+min);

        socket.emit(`${CHANNEL.ORDER}@reserve:order`, {
          slug: slug,
          username: profile.name,
          email: profile.email,
          picture: profile.picture,
          time: time,
          ramen1: group1,
          ramen2: group2
        });
      } else {
        swal("취소", "아쉽네요. 라면 한 그릇 정도 드실 수 있잖아요?", "error");
      }
    });

    return false;
  });

  $('.check-reserve-signal').on('click', function(event) {
    swal({
      title: "식권대장으로 결제하셨습니까?",
      showCancelButton: true,
      cancelButtonText: "아니요",
      confirmButtonColor: "#5dc2f1",
      confirmButtonText: "예!",
      closeOnConfirm: true
    }, function() {
      socket.emit(`${CHANNEL.ORDER}@confirm:order`, {
        slug: ramenOrder.slug
      });

      setTimeout(function() {
        Materialize.toast('키친에 결제 완료를 알렸습니다. 주문 확인 후 조리가 시작됩니다.', 2000);
      },200);
    });

    return false;
  });

  // 예약 취소
  $('.cancel-reserve').on('click', function(event) {
    swal({
      title: "예약을 취소하시겠습니까?",
      type: "warning",
      showCancelButton: true,
      cancelButtonText: "아니요",
      confirmButtonColor: "red",
      confirmButtonText: "취소합니다",
      closeOnConfirm: false
    }, function() {
      ramenOrder = getRamenOrder();
      slug = null;

      swal('확인', '취소되었습니다.', "success");

      activateBoard(ramenOrder);
    });

    return false;
  });

  // 조리중 확인 요청
  $('.ckeck-cook').on('click', function(event) {
    socket.emit(`${CHANNEL.ORDER}@ckeckcook:order`, ramenOrder.slug);

    setTimeout(function() {
      Materialize.toast('키친에 조리 상태 확인 요청을 했습니다.', 2000);
    },200);
  });

  $('.btn-finish-eat').on('click', function(event) {
    Materialize.toast('감사합니다.', 2000, '', function() {
      slug = null;

      activateBoard(ramenOrder);
    });

    return false;
  });

  // 전체 주문 상태 요청
  socket.emit(CHANNEL.ORDER+'@all:orders');
}

$(function() {
  $.get('/profile').done(function(data) {
    var template = Handlebars.compile($("#template").html());

    $('.container').html(template(data));
    $('.time').text(moment().format('M월 DD일'));

    mainApp(data.order, data.profile);
  }).fail(function(err) {
    location.href = '/login';
  });
});
