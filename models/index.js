var path = require('path')
  , basename = path.basename
  , fs = require('fs')
  , settings = require('../settings.js')
  , Validator = require('./_validator.js')
  , util = require('util');

var ModelBase = function(data) {
  this.init(data);
};

var _proto = ModelBase.prototype;

_proto.init = function(data) {
  this.db = null;

  // FIELDMAP:
  // field: {
  //   default: ..,
  //   type: 'ObjectId|string|text|password|integer|float|datetime',
  //   rules: [
  //     {
  //       type: 'required|unique|integer|number|datetime|regex|...',
  //       message: '%s is required'
  //       value: ..,
  //     }
  //   ]
  this._id = null;
  this.FIELDMAP._id = {
    default: null,
    type: 'ObjectId'
  };
  for (var name in this.FIELDMAP) {
    field = this.FIELDMAP[name];
    this[name] = field.default? field.default : null;
    if (field.rules == undefined) {
      field.rules = [];
    }
    // Deal with shortcuts for required and unique validate
    if (field.required) {
      field.rules.push({type: 'required'});
    }
    if (field.unique) {
      field.rules.push({type: 'unique'});
    }
  }

  if (!this.RESULT) {
    this.RESULT = {};
  }
  this.RESULT.extend({
    SUCCESS: 'OK',
    ERROR: 'ERROR'
  });

  if(data) {
    this.bind(data);
  }
};

_proto.validate = function(data, caller, callback) {
  var onValidate = function(errors, pass) {
    callback.call(caller, errors, pass);
  }

  var validator = new Validator(this);
  validator.validate(data, this, onValidate);
}

_proto.bind = function(data) {
  for (var name in data) {
    if (this.FIELDMAP[name]) {
      this[name] = data[name];
    }
  }
};

_proto.asRecord = function() {
  var ret = {}
  for (var name in this.FIELDMAP) {
    if (this.FIELDMAP[name].type == 'password') {
      continue;
    }
    ret[name] = this[name];
  }
  return ret;
};

_proto.asJSON = function() {
  return JSON.stringify(this.asRecord());
};

_proto.getDb = function() {
  if (this.db == null) {
    var mongo = require('mongodb');
    var server = new mongo.Server(settings.mongo_host
      , settings.mongo_port
      , {auto_reconnect: true});
    this.db =  new mongo.Db(settings.mongo_db_name, server, {});
  }
  return this.db;
};

_proto.getCollection = function(caller, callback) {
  var db = this.getDb();
  db.collection(this.collection_name, function(err, collection) {
    if (err) {
      callback.call(caller, error, null);
    } else {
      callback.call(caller, false, collection);
    }
  });
};

_proto._serializedId = function(id) {
  var db = this.getDb();
  return new db.bson_serializer.ObjectID(id);
};

_proto.find = function(conditions, options, caller, callback) {
  if (options == null) {
    options = {}
  }
  if (!options.type) {
    options.type = 'all'; // all | first
  }
  if (options.type == 'first') {
    options.limit = 1;
  }

  var onCollection = function(err, collection) {
    if (err) {
      callback.call(caller, err, null);
    } else {
      var cursor = collection.find(conditions, options);
      switch (options.type) {
        case 'first':
          cursor.nextObject(function(err, doc) {
            callback.call(caller, err, doc);
          });
          break;
        case 'all':
        default:
          cursor.toArray(function(err, records) {
            callback.call(caller, err, records);
          });
          break;
      }
    }
  };

  this.getCollection(this, onCollection);
};

_proto.findById = function(id, caller, callback) {
  this.find({_id: this._serializedId(id)}, {type: 'first'}, caller, callback);
};

_proto.findFirst = function(conditions, caller, callback) {
  this.find(conditions, {type: 'first'}, caller, callback);
};

_proto.findAll = function(conditions, options, caller, callback) {
  if (options == null) {
    options = {};
  }
  options.type = 'all';
  this.find(conditions, options, caller, callback);
};

_proto.load = function(id, caller, callback) {
  var onFind = function(err, doc) {
    if (doc) {
      this.bind(doc);
    }
    callback.call(caller, err, doc? true : false);
  }

  this.findById(id, this, onFind);
};

_proto.save = function(caller, callback) {
  var onCollection = function(err, collection) {
    if (err) {
      callback.call(caller, err, null);
    } else {
      doInsert(collection, this, caller, callback);
    }
  };

  var doInsert = function(collection, obj, caller, callback) {
    collection.insert(obj.asRecord(), function(err, doc) {
      if (err) {
        callback.call(caller, err, null);
      } else {
        obj.bind(doc);
        callback.call(caller, err, obj);
      }
    });
  };

  this.getCollection(this, onCollection);
};

_proto.update = function(conditions, objNew, caller, callback) {
  var onCollection = function(err, collection) {
    if (err) {
      callback.call(caller, err, false);
    } else {
      collection.update(conditions, objNew, function(err) {
        callback.call(caller, err, err? false : true);
      });
    }
  };

  this.getCollection(this, onCollection);
};
_proto.updateById = function(id, objNew, caller, callback) {
  this.update({_id: this._serializedId(id)}, objNew, caller, callback);
};

var exports = module.exports;

fs.readdirSync(__dirname).forEach(function(filename) {
  if (/^_/.test(filename)) {
    return;
  }
  if (!/\.js$/.test(filename)) {
    return;
  }

  var name = basename(filename);
  if (name == 'index.js') {
    return;
  }

  name = name.slice(0, name.length - 3);
  var model = require('./' + name + '.js');
  cls = model.klass? model.klass : model;
  util.inherits(cls, ModelBase);
  //base(cls, model.FIELDMAP);
  exports[model.name? model.name : name] = cls;
});
