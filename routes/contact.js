var models = require('../models');
var Contact = models.Contact;
var Tag = models.Tag;

function prepare(req, action) {
  var ctx = req.context;
  ctx.js('contact.js');
  ctx.css('contact.css');
}

var index = module.exports.index = function(req, res, afterTask) {
  var ctx = req.context.extend({
    _page_title: 'Contacts',
    tags: []
  });
  prepare(req, 'index');

  var contact = new Contact();
  var conditions = {owner_id: ctx._auth_owner._id};
  if (req.params.tag) {
    conditions.tags = req.params.tag;
  }
  contact.findAll(conditions, {sort: {'$natural': -1}}, null, onFindContact);

  function onFindContact(err, records) {
    var contacts = [];
    for (var i = 0; i < records.length; i ++) {
      contacts.push(new Contact(records[i]));
    }
    var ctx = req.context.extend({
      contacts: contacts
    });
    var tag = new Tag();
    tag.findAll({owner_id: ctx._auth_owner._id}, {}, null, onFindTag);
  }

  function onFindTag(err, records) {
    var tags = [];
    for (var i = 0; i < records.length; i ++) {
      tags.push(new Tag(records[i]));
    }
    req.context.extend({
      tags: tags
    });
    afterTask(req, res, 'contacts/index');
  }
}

var taskNew = module.exports.new = function(req, res, afterTask) {
  req.context.extend({
    _page_title: 'Create contact',
    contact: new Contact()
  });
  prepare(req, 'new');
  afterTask(req, res, 'contacts/new');
}

var create = module.exports.create = function(req, res, afterTask) {
  var ctx = req.context;
  ctx.extend({
    _page_title: 'Create contact'
  });
  prepare(req, 'create');

  var owner = ctx._auth_owner;
  var data = req.body.contact;
  var tags = data.tags.split(/,\s*/);
  if (tags[tags.length - 1].length == 0) {
    tags.pop();
  }
  data.tags = tags;
  data.owner_id = ctx._auth_owner._id;
  this._data = data;
  var contact = new Contact();
  contact.validate(data, this, onValidate);

  function onValidate(error, pass) {
    if (pass) {
      contact.bind(this._data);
      contact.save(this, onSave);
    } else {
      ctx.error(error);
      render(null);
    }
  }

  function onSave(err, obj) {
    if (err) {
      req.context.error(err);
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

var getTags = module.exports.getTags = function(req, res, afterTask) {
  prepare(req, 'getTags');
  render();

  function render() {
    var data = ['Business', 'Personal'];
    if (req.context._format == 'json') {
      req.context._json = {data: data};
      afterTask(req, res, '');
    } else {
      req.context.extend({
        _page_title: 'Tags',
        tags: data
      });
      afterTask(req, res, 'contacts/tags');
    }
  }
}

var addTag = module.exports.addTag = function(req, res, afterTask) {
  req.context._json = {};
  var contact_id = req.body.contact_id;
  var contact = new Contact();
  contact.updateById(contact_id, {'$addToSet': {tags: req.body.tag}}, this, onUpdate);

  function onUpdate(error, pass) {
    if (pass) {
      render(true);
    } else {
      render(false);
    }
  }

  function render(success) {
    req.context._json.result = success? 'OK' : 'ERROR';
    afterTask(req, res, '');
  }
}

var removeTag = module.exports.removeTag = function(req, res, afterTask) {
  req.context._json = {};
  var contact_id = req.body.contact_id;
  var contact = new Contact();
  contact.updateById(contact_id, {'$pull': {tags: req.body.tag}}, this, onUpdate);

  function onUpdate(error, pass) {
    if (pass) {
      render(true);
    } else {
      render(false);
    }
  }

  function render(success) {
    req.context._json.result = success? 'OK' : 'ERROR';
    afterTask(req, res, '');
  }
}

index.require_login = true;
taskNew.require_login = true;
create.require_login = true;
getTags.require_login = true;
addTag.require_login = true;
removeTag.require_login = true;
