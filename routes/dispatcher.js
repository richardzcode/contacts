function Dispatcher(app) {
  app.gp = function() {
    app.get.apply(app, arguments);
    app.post.apply(app, arguments);
  }
  this.app = app;
}

module.exports.getDispatcher = function(app) {
  return new Dispatcher(app);
}

Dispatcher.prototype.routes = function() {
  var name = arguments[0];
  var submodule = require('./' + name);
  for (var i = 1; i < arguments.length; i ++) {
    var entry = arguments[i];
    if (entry.length < 3) {
      continue;
    }

    var taskWrapper = function() {
      var task = submodule[entry[2]];
      this.run = function(req, res) {
        beforeTask(req, res, task);
      }
    }

    var fn = this.app[entry[0]];
    var wrapper = new taskWrapper();
    fn.call(this.app, entry[1], wrapper.run);
  }

  function beforeTask(req, res, task) {
    req.context.extend({
      _app_title: 'EXP',
      _auth_owner: null
    });

    AuthChecker = require('../lib/app/authChecker.js');
    checker = new AuthChecker();
    checker.check(req, function() {
      if (task.require_login && (req.context._auth_owner == null)) {
        res.redirect('/');
      } else {
        task(req, res, afterTask);
      }
    });
  }

  function runTask(req, res, task) {
    task(req, res, afterTask);
  }

  function afterTask(req, res, template) {
    var ctx = req.context;
    if (template) {
      ctx._error = ctx.error();
      ctx._info = ctx.info();
      ctx.clearFlash();
      res.render(template, req.context);
    } else if (ctx._json) {
      res.send(JSON.stringify(ctx._json));
    } else {
      ctx.error('No template for render');
      res.redirect('/');
    }
  }
}
