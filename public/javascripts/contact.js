(function() {
  $('.toggle a').click(function() {
    var more = $(this).parents('.contact-read').find('.message').toggle();
    $(this).text(more.is(':visible')? 'hide <<' : 'more >>');
  });

  $('.action-add-tag-button').click(function() {
    var that = $(this);
    var input = that.parent().find('.action-add-tag-input');
    if (input.length > 0) {
      removeInput(input);
    } else {
      $('<input />').addClass('action-add-tag-input').width(0).insertBefore(that).focus()
        .animate({width: '72px'}
          , 200
          , function() {
            $(this).autocomplete({
              delay: 0,
              minLength: 0,
              source: ['Business', 'Personal'],
              select: function(evt, ui) {
                $(this).val(ui.item.value);
                addTag(this);
              },
              change: function(evt, ui) {
                console.log(ui);
              }
            }).keypress(function(evt) {
              if (evt.which == 13) {
                addTag(this);
              }
            });
        });
    }
  });

  var removeInput = function(input) {
    $(input).animate({width: '0'}, 200, function() {
      $(this).remove();
    });
  }

  var addTag = function(input) {
    console.log($(input).val());
    removeInput(input);
  }
})();
