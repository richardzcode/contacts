(function() {
  var available_tags = null;
  var lastXhr = null;
  var getAvailableTags = function(callback) {
    lastXhr = $.getJSON('/contacts/tags.json', null, function(data, status, xhr) {
      available_tags = data.data;
      if (lastXhr === xhr) {
        callback();
      }
    });
  };

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
        if (data.result === 'OK') {
          refreshTags(data.data);
        }
      }
      , 'json'
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
        .animate({width: '72px'}
          , 200
          , function() {
            $(this).autocomplete({
              delay: 0,
              minLength: 0,
              source: function(req, res) {
                getAvailableTags(function() {
                  var matcher = new RegExp($.ui.autocomplete.escapeRegex(req.term), 'i');
                  res($.map(available_tags, function(tag) {
                      if (matcher.test(tag)) {
                        return {label: tag, value: tag};
                      }
                    })
                  );
                });
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
        if (data.result === 'OK') {
          refreshTags(data.data);
        }
     }
      , 'json'
    );
  };

  var refreshTags = function(contact) {
    var footer = $('.contact-read[data-cid="' + contact._id + '"] footer');
    footer.find('span.tag').remove();
    $.each(contact.tags.reverse(), function(index, value) {
      var remove = $('<span></span>').addClass('tag-remove')
        .text('X').click(function() {
          removeTag($(this).parents('.tag'));
        });
      $('<span></span>').addClass('tag').attr('data-tag', value)
        .text(value)
        .append(remove)
        .prependTo(footer);
    });
  };

  // Form tags autocomplete
  $('#f_contact_tags').keydown(function(evt) {
    if (evt.which === $.ui.keyCode.TAB && $(this).data('autocomplete').menu.active) {
      evt.preventDefault();
    }
  }).autocomplete({
    minLength: 0,
    source: function(req, res) {
      getAvailableTags(function() {
        res($.ui.autocomplete.filter(available_tags, req.term.split(/,\s*/).pop()));
      });
    },
    focus: function() {
      return false;
    },
    select: function(evt, ui) {
      var terms = this.value.split(/,\s*/);
      terms.pop();
      terms.push(ui.item.value);
      terms.push('');
      this.value = terms.join(', ');
      return false;
    }
  }).focus(function() {
    var that = $(this);
    that.autocomplete('search', that.val());
  });
})();
