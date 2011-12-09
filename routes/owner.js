Owner = require('../models').Owner;

var profile = module.exports.profile = function(req, res, afterTask) {
  ctx = req.context;
  ctx.extend({
    _page_title: 'Profile',
    owner: ctx._auth_owner
  });
  afterTask(req, res, 'owner/profile');
}

profile.require_login = true;
