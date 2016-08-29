function blinker() {
  $('.blink_me').fadeOut(500);
  $('.blink_me').fadeIn(500);
}

$(function() {
  var lastTabId = '';
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
    var renderData = {};

    renderData.reserve = {
      length: 0
    };

    renderData.cook = {
      length: 0
    };

    renderData.cooked = {
      length: 0
    };

    renderData.reserve.items = orders.filter(function(order) {
      return order.status == 'reserve';
    });

    renderData.cook.items = orders.filter(function(order) {
      return order.status == 'cook';
    });

    renderData.cooked.items = orders.filter(function(order) {
      return order.status == 'cooked';
    });

    renderData.reserve.length = renderData.reserve.items.length;
    renderData.cook.length = renderData.cook.items.length;
    renderData.cooked.length = renderData.cooked.items.length;

    if (renderData.cook.items.length > 0) {
      renderData.cook.items = _.sortBy(renderData.cook.items, 'orderNumber');
    }

    if (renderData.cooked.items.length > 0) {
      renderData.cooked.items = _.sortBy(renderData.cooked.items, 'orderNumber');
    }

    $('.container').html(template(renderData));

    $('.order.confirm').on('click', function(event) {
      lastTabId = 'reserve';
      socket.emit(CHANNEL.CONFIRM+'@start:order', event.target.dataset.slug);
    });

    $('.order.cooked').on('click', function(event) {
      lastTabId = 'cooking';
      socket.emit(CHANNEL.CONFIRM+'@finsh:order', event.target.dataset.slug);
    });

    $('ul.tabs').tabs();
    $('.collapsible').collapsible({ accordion : false });
    $('ul.tabs').tabs('select_tab', lastTabId || 'reserve');
  });

  socket.on(CHANNEL.ORDER+'@check:order:response', function(slug) {
    lastTabId = 'cooking';
    $('ul.tabs').tabs('select_tab', lastTabId);

    $('#cooking .collapsible li.active .collapsible-body').hide();
    $('#cooking .collapsible li.active').removeClass('active');

    $('#cooking .collapsible li.slug-'+slug).addClass('active');
    $('#cooking .collapsible li.slug-'+slug+' .collapsible-body').show();
  });
});
