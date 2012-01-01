var path = require('path')
  , basename = path.basename
  , fs = require('fs')
  , util = require('util')
  , settings = require('../settings.js')
  , Validator = require('./_validator.js');

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

_proto.validate = function(data, callback) {
  var onValidate = function(errors, pass) {
    callback(errors, pass);
  };

  var validator = new Validator(this);
  validator.validate(data, onValidate);
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

_proto.getCollection = function(callback) {
  var db = this.getDb();
  db.collection(this.collection_name, function(err, collection) {
    if (err) {
      callback(error, null);
    } else {
      callback(false, collection);
    }
  });
};

_proto._serializedId = function(id) {
  var db = this.getDb();
  return new db.bson_serializer.ObjectID(id);
};

_proto.find = function(conditions, options, callback) {
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
      callback(err, null);
    } else {
      var cursor = collection.find(conditions, options);
      switch (options.type) {
        case 'first':
          cursor.nextObject(function(err, doc) {
            callback(err, doc);
          });
          break;
        case 'all':
        default:
          cursor.toArray(function(err, records) {
            callback(err, records);
          });
          break;
      }
    }
  };

  this.getCollection(onCollection);
};

_proto.findById = function(id, callback) {
  this.find({_id: this._serializedId(id)}, {type: 'first'}, callback);
};

_proto.findFirst = function(conditions, callback) {
  this.find(conditions, {type: 'first'}, callback);
};

_proto.findAll = function(conditions, options, callback) {
  if (options == null) {
    options = {};
  }
  options.type = 'all';
  this.find(conditions, options, callback);
};

_proto.load = function(id, callback) {
  var doLoad = function(obj, id) {
    obj.findById(id, function(err, doc) {
      if (doc) {
        obj.bind(doc);
      }
      callback(err, doc? true : false);
    });
  };

  doLoad(this, id);
};

_proto.save = function(callback) {
  var doSave = function(obj) {
    var onCollection = function(err, collection) {
      if (err) {
        callback(err, false);
      } else {
        collection.insert(obj.asRecord(), function(err, doc) {
          if (doc) {
            obj.bind(doc);
          }
          callback(err, doc? true : false);
        });
      }
    };
    obj.getCollection(onCollection);
  };

  doSave(this);
};

_proto.update = function(conditions, objNew, callback) {
  var onCollection = function(err, collection) {
    if (err) {
      callback(err, false);
    } else {
      collection.update(conditions, objNew, function(err) {
        callback(err, err? false : true);
      });
    }
  };

  this.getCollection(onCollection);
};
_proto.updateById = function(id, objNew, callback) {
  this.update({_id: this._serializedId(id)}, objNew, callback);
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
  exports[model.name? model.name : name] = cls;
});
