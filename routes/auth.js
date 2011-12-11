Owner = require('../models').Owner;

exports.login = function(req, res, afterTask){
  var owner = new Owner();
  var data = {};
  if (req.body && req.body.owner) {
    data = req.body.owner;
    owner.validate(data, this, onValidate);
  } else {
    render();
  }

  function onValidate(errors, pass) {
    if (pass) {
      owner.bind(data);
      owner.authenticate(onAuthenticate);
    } else {
      req.context._error.push('Errors on validate');
      render();
    }
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
  var owner = new Owner();
  var data = {};
  if (req.body && req.body.owner) {
    data = req.body.owner;
    owner.validate(data, this, onValidate);
    return;
  } 
  render();

  function onValidate(errors, pass) {
    if (pass) {
      owner.bind(data);
      owner.signup(onSignup);
    } else {
      req.context._error.push('Errors on validate');
      render();
    }
  }


  function onSignup(err, result) {
    if (result == owner.RESULT.SUCCESS) {
      res.redirect('/');
    } else {
      render();
    }
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
