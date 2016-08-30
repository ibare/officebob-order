var BobSheet = 'https://spreadsheets.google.com/feeds/list/1GqW4dY5DSUZ4Qkg7NnbKBrQnaw9goNooarjb1IgqYac/od6/public/values?alt=json';
var dayNames = {
  'Monday': '월요일',
  'Tuesday': '화요일',
  'Wednesday': '수요일',
  'Thursday': '목요일',
  'Friday': '금요일'
};

$(function() {
  var today = moment();
  var c = new fabric.Canvas('c', { backgroundColor : "#fff" });
  var box = new fabric.Rect({
    width: 215,
    height: 290,
    fill: '#ff0',
    // left: 138,
    // top: 140,
    opacity: 0
  });
  var menuGroup = new fabric.Group();

  menuGroup.add(box);

  fabric.Image.fromURL('/images/today-menu-back.png', function(oImg) {
    c.add(oImg);

    var title = new fabric.Text(today.format('M월 D일')+' '+dayNames[today.format('dddd')]+' 점심 메뉴는', {
      fontSize: 24, fill: '#666', left: 110, top: 24, fontFamily: 'Tahoma'
    });

    c.add(title);

    $.getJSON(BobSheet, function (json) {
      var menus = [];

      json.feed.entry.forEach(function(menu) {
        if (menu.gsx$date.$t.substr(0,10) == today.format('YYYY.MM.DD')) {
          menus = menu.gsx$lunch.$t.split(',').map(function(m) { return m.trim() });
        }
      });

      var m = new fabric.Text(menus.join('\n'), { textAlign: 'center', fontSize: 22, fill: '#000', lineHeight: 1.8, fontFamily: 'BM1' });
      menuGroup.add(m);
      menuGroup.setCoords();

      c.add(m);
      c.centerObject(m);

      m.set({ top: 170 });

      setTimeout(function() {
        $('#menu').attr({
          'src': c.toDataURL({ format: 'jpeg', width: 495, height: 495 })
        });
      }, 500);
    });
  });
});
