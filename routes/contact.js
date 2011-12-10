Contact = require('../models').Contact;

var index = module.exports.index = function(req, res, afterTask) {
  ctx = req.context;
  ctx.extend({
    _page_title: 'Contacts',
  });

  owner = ctx._auth_owner;
  if (owner == null) {
    ctx._error.push('No owner');
    afterTask(req, res, 'contacts/index');
    return;
  }

  contact = new Contact();
  contact.findAll({owner: owner._id}, {}, null, onFind);

  function onFind(err, records) {
    afterTask(req, res, 'contacts/index');
  }
}

var taskNew = module.exports.new = function(req, res, afterTask) {
  req.context.extend({
    _page_title: 'Create contacts',
    contact: new Contact()
  });
  afterTask(req, res, 'contacts/new');
}

index.require_login = true;
taskNew.require_login = true;
