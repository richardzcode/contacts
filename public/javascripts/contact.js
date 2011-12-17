(function() {
  $('.toggle a').click(function() {
    $(this).parents('.contact-read').find('.message').toggle();
  });
})();
