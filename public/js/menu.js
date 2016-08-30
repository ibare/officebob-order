var BobSheet = 'https://spreadsheets.google.com/feeds/list/1GqW4dY5DSUZ4Qkg7NnbKBrQnaw9goNooarjb1IgqYac/od6/public/values?alt=json';
var dayNames = {
  'Monday': '월요일',
  'Tuesday': '화요일',
  'Wednesday': '수요일',
  'Thursday': '목요일',
  'Friday': '금요일'
};

$(function() {
  progressJs().setOptions({ overlayMode: true, theme: 'blueOverlay'}).start().autoIncrease(4, 200);

  var today = window.location.hash ? moment(window.location.hash.replace('#','')) : moment();
  var c = new fabric.Canvas('c', { backgroundColor : "#fff" });

  $(window).on('hashchange', function() {
    location.reload();
  });

  fabric.Image.fromURL('/images/today-menu-back.png', function(oImg) {
    c.add(oImg);

    var title = new fabric.Text(today.format('M월 D일')+' '+dayNames[today.format('dddd')]+' 점심 메뉴는', {
      fontSize: 24, fill: '#666', left: 110, top: 24, fontFamily: 'Tahoma'
    });

    c.add(title);

    $.getJSON(BobSheet, function (json) {
      var menus = [];
      var center = { left: 240, top: 280 };

      json.feed.entry.forEach(function(menu) {
        if (menu.gsx$date.$t.substr(0,10) == today.format('YYYY.MM.DD')) {
          menus = menu.gsx$lunch.$t.split(',').map(function(m) { return m.trim() });
        }
      });

      var m = new fabric.Text(menus.join('\n'), { textAlign: 'center', fontSize: 23, fill: '#000', lineHeight: 2.0, fontFamily: 'BM1' });

      c.add(m);

      var width = m.getBoundingRectWidth(), height = m.getBoundingRectHeight();

      m.set({
        left: center.left - (width / 2),
        top: center.top - (height / 2)
      });

      setTimeout(function() {
        $('#menu').attr({
          'src': c.toDataURL({ format: 'jpeg', width: 495, height: 495 })
        });
        progressJs().end();
      }, 2000);
    });
  });
});
