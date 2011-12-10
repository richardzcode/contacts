var path = require('path')
  , basename = path.basename
  , fs = require('fs')
  , settings = require('../settings.js');

function base(cls) {
  var _proto = cls.prototype;

  _proto.init = function(data) {
    this._id = null;
    this.FIELDMAP._id = {
      default: null,
      type: 'ObjectId'
    };
    for (var name in this.FIELDMAP) {
      field = this.FIELDMAP[name];
      this[name] = field.default? field.default : null;
    }

    if (!this.RESULT) {
      this.RESULT = {};
    }
    this.RESULT.extend({
      SUCCESS: 'OK',
      ERROR: 'ERROR'
    });

    if(data && this.isValid(data)) {
      this.bind(data);
    }
  }

  _proto.validate = function(data) {
    errors = [];
    for (var name in this.FIELDMAP) {
      field = this.FIELDMAP[name];
      if (field.required && !data[name]) {
        errors[errors.length] = name + ' is required';
      }
    }
    return errors;
  }

  _proto.isValid = function(data) {
    return (this.validate(data).length == 0);
  }

  _proto.bind = function(data) {
    for (var name in data) {
      if (this.FIELDMAP[name]) {
        this[name] = data[name];
      }
    }
  }

  _proto.asRecord = function() {
    var ret = {}
    for (var name in this.FIELDMAP) {
      ret[name] = this[name];
    }
    return ret;
  }

  _proto.asJSON = function() {
    return JSON.stringify(this.asRecord());
  }

  _proto.db = null;

  _proto.getDb = function() {
    if (this.db == null) {
      var mongo = require('mongodb');
      var server = new mongo.Server(settings.mongo_host
        , settings.mongo_port
        , {auto_reconnect: true});
      this.db =  new mongo.Db(settings.mongo_db_name, server, {});
    }
    return this.db;
  }

  _proto.getCollection = function(caller, callback) {
    db = this.getDb();
    db.collection(this.collection_name, function(err, collection) {
      if (err) {
        callback.call(caller, error, null);
      } else {
        callback.call(caller, false, collection);
      }
    });
  }

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
    this.extend({
      _find_conditions: conditions,
      _find_options: options,
      _find_caller: caller,
      _find_callback: callback
    });
    this.getCollection(this, this.find_onCollection);
  }
  _proto.find_onCollection = function(err, collection) {
      var obj = this;
      console.log(obj);
      if (err) {
        obj._find_callback.call(obj._find_caller, err, null);
      } else {
        var cursor = collection.find(obj._find_conditions, obj._find_options.subset(['limit']));
        switch(obj._find_options.type) {
          case 'first':
            cursor.nextObject(function(err, doc) {
              obj._find_callback.call(obj._find_caller, err, doc);
            });
            break;
          case 'all':
          default:
            cursor.nextObject(function(err, doc) {
              obj._find_callback.call(obj._find_caller, err, doc);
            });
            break;
        }
      }
  }

  _proto.findById = function(id, caller, callback) {
    db = this.getDb();
    conditions = {_id: new db.bson_serializer.ObjectID(id)};
    this.find(conditions, {type: 'first'}, caller, callback);
  }

  _proto.findFirst = function(conditions, caller, callback) {
    this.find(conditions, {type: 'first'}, caller, callback);
  }
  _proto.findFirst_onCollection = function(err, collection) {
      var obj = this;
      if (err) {
        obj._find_callback.call(obj._find_caller, err, null);
      } else {
        var cursor = collection.find(obj._find_conditions, {limit: 1});
        cursor.nextObject(function(err, doc) {
          obj._find_callback.call(obj._find_caller, err, doc);
        });
      }
  }

  _proto.findAll = function(conditions, options, caller, callback) {
    if (options == null) {
      options = {};
    }
    options.type = 'all';
    this.find(conditions, options, caller, callback);
  }

  _proto.load = function(id, callback) {
    //
  }

  _proto.save = function(caller, callback, exit_callback) {
    collection = this.getCollection(caller, function(err, collection) {
      if (err) {
        callback.call(caller, err, null, exit_callback);
      } else {
        collection.insert(this.asRecord(), function(err, doc) {
          if (err) {
            callback.call(caller, err, null, exit_callback);
          } else {
            caller.bind(doc);
            callback.call(caller, err, doc, exit_callback);
          }
        });
      }
    });
  }
}

var exports = module.exports;

fs.readdirSync(__dirname).forEach(function(filename) {
  if (!/\.js$/.test(filename)) {
    return;
  }

  var name = basename(filename);
  if (name == 'index.js') {
    return;
  }

  name = name.slice(0, name.length - 3);
  var model = require('./' + name + '.js');
  cls = model.class;
  base(cls, model.FIELDMAP);
  exports[model.name? model.name : name] = cls;
});
