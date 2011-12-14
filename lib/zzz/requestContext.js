/**
 * Add context object to request.
 * req.context will be used for rendering template.
 * The context uses session to store flash messages.
 */

module.exports = function requestContext(req, res, next) {
  if (!req.context) {
    req.context = {};
  }

  req.context.extend({
    _css: [],
    css: function(file_name) {
      this._css.push(file_name);
    },
    _js: [],
    js: function(file_name) {
      this._js.push(file_name);
    }
  });

  req.context.extend({
    _session: req.session,
    error: function(msg) { // msg can be string or Array
      var ary = this._session._flash._error;
      if (msg) {
        if (msg instanceof Array) {
          ary.merge(msg);
        } else {
          ary.push(msg);
        }
      }
      return ary;
    },
    info: function(msg) {
      var ary = this._session._flash._info;
      if (msg) { // msg can be string or Array
        if (msg instanceof Array) {
          ary.merge(msg);
        } else {
          ary.push(msg);
        }
      }
      return ary;
    },
    clearFlash: function() {
      this._session._flash._error = [];
      this._session._flash._info = [];
    }
  });

  if (!req.session._flash) {
    req.session._flash = {
      _error: [],
      _info: []
    }
  }

  next();
}
