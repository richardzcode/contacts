var Tag = require('../models').Tag;

var index = module.exports.index = function(req, res, afterTask) {
  var ctx = req.context.extend({
    _page_title: 'Tags',
  });
  ctx.js('tag.js');

  var tag = new Tag();
  tag.findAll({owner_id: ctx._auth_owner._id}, null, onFind);

  function onFind(err, records) {
    var tags = [];
    for (var i = 0; i < records.length; i ++) {
      tags.push(new Tag(records[i]));
    }
    req.context.tags = tags;
    afterTask(req, res, 'tags/index');
  }
}

var taskNew = module.exports.new = function(req, res, afterTask) {
  req.context.extend({
    _page_title: 'Create tag',
    tag: new Tag()
  });
  afterTask(req, res, 'tags/new');
}

var create = module.exports.create = function(req, res, afterTask) {
  var ctx = req.context;
  ctx.extend({
    _page_title: 'Create tag'
  });
  var owner = ctx._auth_owner;

  var data = req.body.tag;
  data.owner_id = ctx._auth_owner._id;
  this._data = data;
  var tag = new Tag();
  tag.validate(data, this, onValidate);

  function onValidate(error, pass) {
    if (pass) {
      tag.bind(this._data);
      tag.save(this, onSave);
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
      _page_title: 'Create tag'
    });

    if (obj != null) {
      req.context.tag = obj;
      afterTask(req, res, 'tags/view');
    } else {
      req.context.tag = new Tag(data);
      afterTask(req, res, 'tags/new');
    }
  }
}

index.require_login = true;
taskNew.require_login = true;
create.require_login = true;

