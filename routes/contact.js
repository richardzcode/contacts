var Contact = require('../models').Contact;

var index = module.exports.index = function(req, res, afterTask) {
  var ctx = req.context;
  ctx.extend({
    _page_title: 'Contacts',
  });

  var contact = new Contact();
  contact.findAll({owner_id: ctx._auth_owner._id}, {sort: {'$natural': -1}}, null, onFind);

  function onFind(err, records) {
    console.log(err);
    var contacts = [];
    for (var i = 0; i < records.length; i ++) {
      contacts.push(new Contact(records[i]));
    }
    req.context.contacts = contacts;
    afterTask(req, res, 'contacts/index');
  }
}

var taskNew = module.exports.new = function(req, res, afterTask) {
  req.context.extend({
    _page_title: 'Create contact',
    contact: new Contact()
  });
  afterTask(req, res, 'contacts/new');
}

var create = module.exports.create = function(req, res, afterTask) {
  var ctx = req.context;
  ctx.extend({
    _page_title: 'Create contact'
  });
  var owner = ctx._auth_owner;

  var data = req.body.contact;
  data.owner_id = ctx._auth_owner._id;
  this._data = data;
  var contact = new Contact();
  contact.validate(data, this, onValidate);

  function onValidate(error, pass) {
    if (pass) {
      contact.bind(this._data);
      contact.save(this, onSave);
    } else {
      ctx._error.merge(error);
      render(null);
    }
  }

  function onSave(err, obj) {
    if (err) {
      req.context._error.push(err);
      render(null);
    } else {
      render(obj);
    }
  }

  function render(obj) {
    req.context.extend({
      _page_title: 'Create contact'
    });

    if (obj != null) {
      req.context.contact = obj;
      afterTask(req, res, 'contacts/view');
    } else {
      req.context.contact = new Contact(data);
      afterTask(req, res, 'contacts/new');
    }
  }
}

index.require_login = true;
taskNew.require_login = true;
create.require_login = true;
