(function() {
  $('.toggle a').click(function() {
    var more = $(this).parents('.contact-read').find('.message').toggle();
    $(this).text(more.is(':visible')? 'hide <<' : 'more >>');
  });
})();
