(function() {
  // More / hide
  $('.toggle a').click(function() {
    var more = $(this).parents('.contact-read').find('.message').toggle();
    $(this).text(more.is(':visible')? 'hide <<' : 'more >>');
  });

  // Remove tag
  $('.tag-remove').click(function() {
    removeTag($(this).parents('.tag'));
  });

  var removeTag = function(el) {
    var tag = encodeURI(el.attr('data-tag'));
    $.post('/contacts/removeTag'
      , 'contact_id=' + el.parents('.contact-read').attr('data-cid') + '&tag=' + tag
      , function(data) {
        console.log(data);
      }
    );
  }

  // Add new tag
  $('.action-add-tag-button').click(function() {
    var that = $(this);
    var input = that.parent().find('.action-add-tag-input');
    if (input.length > 0) {
      removeInput(input);
    } else {
      $('<input />').addClass('action-add-tag-input').width(0).insertBefore(that).focus()
        .attr('data-tags', that.attr('data-tags'))
        .animate({width: '72px'}
          , 200
          , function() {
            $(this).autocomplete({
              delay: 0,
              minLength: 0,
              source: function(req, res) {
                var matcher = new RegExp($.ui.autocomplete.escapeRegex(req.term), 'i');
                var tags = this.element.attr('data-tags').split(',');
                res($.map(tags, function(tag) {
                    if (matcher.test(tag)) {
                      return {label: tag, value: tag};
                    }
                  })
                );
              },
              select: function(evt, ui) {
                $(this).val(ui.item.value);
                addTag(this);
              },
              change: function(evt, ui) {
              }
            }).keypress(function(evt) {
              if (evt.which == 13) {
                addTag(this);
              }
            }).autocomplete('search', '');
        });
    }
  });

  var removeInput = function(el) {
    el.animate({width: '0'}, 200, function() {
      $(this).remove();
    });
  }

  var addTag = function(input) {
    var el = $(input);
    var tag = el.val();
    removeInput(el);
    $.post('/contacts/addTag'
      , 'contact_id=' + el.parents('.contact-read').attr('data-cid') + '&tag=' + tag
      , function(data) {
        console.log(data);
      }
    );
  }
})();
