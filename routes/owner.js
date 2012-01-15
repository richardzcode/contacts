var Owner = require('../models').Owner
  , Client = require('../models').Client
  , util = require('../lib/zzz/util');

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
  prepare(req, 'clients');

  var onFind = function(err, records) {
    var clients = [];
    for (var i = 0; i < records.length; i ++) {
      clients.push(new Client(records[i]));
    }
    req.context.extend({
      _page_title: 'Clients'
      , owner: req.context._auth_owner
      , clients: clients
    });
    afterTask(req, res, 'owner/clients');
  };

  var client = new Client();
  client.findAll({owner_id: req.context._auth_owner._id}
    , {sort: {'$natural': -1}}
    , onFind
  );
}

var createClient = module.exports.createClient = function(req, res, afterTask) {
  var doCreate = function(client, data) {
    var onSave = function(err, success) {
      if (err) {
        req.context.error(err);
      }
      render(success? client : null);
    };

    client.validate(data, function(err, pass) {
      if (pass) {
        client.bind(req.body.client);
        client.save(onSave);
      } else {
        req.context.error(err);
        render(null);
      }
    });
  };

  var render = function(obj) {
    if (obj != null) {
      req.context.info('Client created');
    } else {
    }
    req.context._redirect = 'owner/clients';
    afterTask(req, res, '');
  };

  var data = req.body.client;
  data.key = util.generateKey() ;
  data.owner_id = req.context._auth_owner._id;
  var client = new Client();
  doCreate(client, data);
}

profile.require_login = true;
clients.require_login = true;
createClient.require_login = true;
