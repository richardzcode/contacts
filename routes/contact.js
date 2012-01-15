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

  var onFindContact = function(err, records) {
    var contacts = [];
    for (var i = 0; i < records.length; i ++) {
      contacts.push(new Contact(records[i]));
    }
    var ctx = req.context.extend({
      contacts: contacts
    });
    var tag = new Tag();
    tag.findAll({owner_id: ctx._auth_owner._id}, {}, onFindTag);
  };

  var onFindTag = function(err, records) {
    var tags = [];
    for (var i = 0; i < records.length; i ++) {
      tags.push(new Tag(records[i]));
    }
    req.context.extend({
      tags: tags
    });
    afterTask(req, res, 'contacts/index');
  };

  var contact = new Contact();
  var conditions = {owner_id: ctx._auth_owner._id};
  if (req.params.tag) {
    conditions.tags = req.params.tag;
  }
  contact.findAll(conditions, {sort: {'$natural': -1}}, onFindContact);
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
  prepare(req, 'create');

  var doCreate = function(contact, data) {
    var onSave = function(err, success) {
      if (err) {
        req.context.error(err);
      }
      render(success? contact : null);
    };

    contact.validate(data, function(err, pass) {
      if (pass) {
        contact.bind(req.body.contact);
        contact.save(onSave);
      } else {
        req.context.error(err);
        render(null);
      }
    });
  };

  var render = function(obj) {
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

  var data = req.body.contact;
  var tags = data.tags.split(/,\s*/);
  if (tags[tags.length - 1].length == 0) {
    tags.pop();
  }
  data.tags = tags;
  data.owner_id = req.context._auth_owner._id;
  var contact = new Contact();
  doCreate(contact, data);
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
  var doAddTag = function(obj, id) {
    var onUpdate = function(err, doc) {
      if (doc) {
        obj.bind(doc);
      }
      render(doc? true : false, obj);
    };

    obj.updateById(id, {'$addToSet': {tags: req.body.tag}}, onUpdate);
  };

  req.context._json = {};
  doAddTag(new Contact(), req.body.contact_id);

  function render(success, contact) {
    req.context._json.result = success? 'OK' : 'ERROR';
    if (contact) {
      req.context._json.data = contact.asRecord();
    }
    afterTask(req, res, '');
  }
}

var removeTag = module.exports.removeTag = function(req, res, afterTask) {
  var doRemoveTag = function(obj, id) {
    var onUpdate = function(err, doc) {
      if (doc) {
        obj.bind(doc);
      }
      render(doc? true : false, obj);
    };

    obj.updateById(id, {'$pull': {tags: req.body.tag}}, onUpdate);
  };

  req.context._json = {};
  doRemoveTag(new Contact(), req.body.contact_id);

  function render(success, contact) {
    req.context._json.result = success? 'OK' : 'ERROR';
    if (contact) {
      req.context._json.data = contact.asRecord();
    }
    afterTask(req, res, '');
  }
}

index.require_login = true;
taskNew.require_login = true;
create.require_login = true;
getTags.require_login = true;
addTag.require_login = true;
removeTag.require_login = true;
