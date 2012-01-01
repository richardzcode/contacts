Owner = require('../models').Owner;

exports.login = function(req, res, afterTask){
  var owner = new Owner();
  if (req.body && req.body.owner) {
    owner.bind(req.body.owner);
    owner.authenticate(onAuthenticate);
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
          req.context.error('The account doesn\'t exist.');
          break;
        case owner.RESULT.WRONG_PASSWORD:
          req.context.error('Wrong password');
          break;
      }
    }
    render();
  }

  function render() {
    req.context.extend({
      _page_title: 'Sign In',
      owner: owner
    });

    afterTask(req, res, 'auth/login');
  }
};

exports.signup = function(req, res, afterTask) {
  var onValidate = function(error, pass) {
    if (pass) {
      var owner = new Owner();
      owner.bind(req.body.owner);
      owner.signup(onSignup);
    } else {
      req.context.error(error);
      render();
    }
  };

  var onSignup = function(err, result) {
    if (result == owner.RESULT.SUCCESS) {
      req.context.info('Thank you for join us!');
      res.redirect('/');
    } else {
      render();
    }
  };

  var owner = new Owner();
  if (req.body && req.body.owner) {
    owner.validate(req.body.owner, onValidate);
  } else {
    render();
  }

  function render() {
    req.context.extend({
      _page_title: 'Sign Up',
      owner: owner
    });

    afterTask(req, res, 'auth/signup');
  }
}

exports.logout = function(req, res) {
  req.session.owner_id = null;
  res.redirect('/');
}
