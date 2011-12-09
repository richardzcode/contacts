Owner = require('../models').Owner;

exports.login = function(req, res, afterTask){
  var owner = new Owner();
  if (req.body && req.body.owner) {
    data = req.body.owner;
    errors = owner.validate(data);
    if (errors.length == 0) {
      owner.bind(data);
      owner.authenticate(onAuthenticate);
    } else {
      render();
    }
  } else {
    render();
  }

  function onAuthenticate(err, result) {
    if (err) {
      req.context._error.push('Unexpected error');
    } else {
      switch(result) {
        case owner.RESULT.SUCCESS:
          req.session.owner_id = owner._id;
          res.redirect('/owner/profile');
          return;
        case owner.RESULT.DOESNT_EXIST:
          req.context._error.push('The account doesn\'t exist.');
          break;
        case owner.RESULT.WRONG_PASSWORD:
          req.context._error.push('Wrong password');
          break;
      }
    }
    render();
  }

  function render() {
    ctx = req.context.extend({
      _page_title: 'Sign In',
      owner: owner
    });

    afterTask(req, res, 'auth/login');
  }
};

exports.signup = function(req, res) {
  owner = new Owner();
  if (req.body && req.body.owner) {
    data = req.body.owner;
    errors = owner.validate(data);
    if (errors.length > 0) {
      req.context._error = req.context._error.concat(errors);
    } else {
      owner.bind(data);
      owner.signup(onSignup);
      return;
    }
  } 
  render();

  function onSignup(err, result) {
    render();
  }

  function render() {
    ctx = req.context.extend({
      _page_title: 'Sign Up',
      owner: owner
    });

    res.render('auth/signup', ctx);
  }
}

exports.logout = function(req, res) {
  req.session.owner_id = null;
  res.redirect('/');
}
