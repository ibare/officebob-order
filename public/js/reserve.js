$(function() {
  var CHANNEL = {
    RESERVE: 'channel:reserve',
    ORDER: 'channel:order',
    CONFIRM: 'channel:confirm'
  };

  var socket = io();
  var $body = $('body');
  var $window = $(window);
  var officebobOrders = window.localStorage.getItem('officebob-orders');
  var initOfficebobOrder = function() {
    officebobOrders = {
        '1st': 0,
        '2th': 0,
        '3rd': 0,
        'slug': ''
    };

    window.localStorage.setItem('officebob-orders', JSON.stringify(officebobOrders));
  };

  var updateOfficebobOrders = function() {
    window.localStorage.setItem('officebob-orders', JSON.stringify(officebobOrders));
  };

  var updateOrderCancelUI = function() {
    if (officebobOrders['1st'] > 0) {
      $('.current.1st').text(' + '+officebobOrders['1st']);
    } else {
      $('.current.1st').text('');
    }

    if (officebobOrders['2th'] > 0) {
      $('.current.2th').text(' + '+officebobOrders['2th']);
    } else {
      $('.current.2th').text('');
    }

    if (officebobOrders['3rd'] > 0) {
      $('.current.3rd').text(' + '+officebobOrders['3rd']);
    } else {
      $('.current.3rd').text('');
    }
  };

  if (officebobOrders) {
    officebobOrders = JSON.parse(officebobOrders);
  } else {
    initOfficebobOrder();
  }

  socket.emit(CHANNEL.RESERVE+' init');

  $body.width($window.width());
  $body.height($window.height());

  $window.on('resize', function() {
    $body.width($window.width());
    $body.height($window.height());
  });

  updateOrderCancelUI();

  socket.on(CHANNEL.RESERVE+' init:response', function(numOrders) {
    officebobOrders.slug = numOrders.slug;
  });

  socket.on('current orders', function(numOrders) {
    !officebobOrders.slug && initOfficebobOrder();
    officebobOrders.slug != numOrders['slug'] && initOfficebobOrder();

    Object.keys(numOrders).forEach(function(key) {
      $('.num-order.'+key).text(numOrders[key]);
    });
  });

  socket.on('new order:response', function(time) {
    officebobOrders[time]++;
    updateOfficebobOrders();
    updateOrderCancelUI();
  });

  socket.on('cancel order:response', function(time) {
    officebobOrders[time]--;
    updateOfficebobOrders();
    updateOrderCancelUI();
  });

  socket.on('connection status', function(num) {
    $('.number-of-connection').text(num);
  });

  $('.new.order').on('click', function(event) {
    swal({
        title: "예약하시겠습니까?",
        text: "오늘 버전은 예약이 취소되지 않습니다",
        type: "warning",
        showCancelButton: true,
        cancelButtonText: "아니오",
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "예, 먹고싶어요!",
        closeOnConfirm: true
    }, function() {
        socket.emit('new order', event.target.dataset.time);
    });

    return false;
  });

  $('.cancel.order').on('click', function(event) {
    return false;
    socket.emit('cancel order', event.target.dataset.time);
    return false;
  });
});
