Owner = require('../models').Owner;

function prepare(req, action) {
  var ctx = req.context;
  ctx.js('owner.js');
  ctx.css('owner.css');
}

var profile = module.exports.profile = function(req, res, afterTask) {
  var ctx = req.context;
  ctx.extend({
    _page_title: 'Profile',
    owner: ctx._auth_owner
  });
  prepare(req, 'profile');

  afterTask(req, res, 'owner/profile');
}

var clients = module.exports.clients = function(req, res, afterTask) {
  var ctx = req.context;
  ctx.extend({
    _page_title: 'Clients',
    owner: ctx._auth_owner
  });
  prepare(req, 'clients');

  afterTask(req, res, 'owner/clients');
}


profile.require_login = true;
clients.require_login = true;
