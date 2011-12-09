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

  _proto.findById = function(id, caller, callback, exit_callback) {
    db = this.getDb();
    conditions = {_id: new db.bson_serializer.ObjectID(id)};
    this.findFirst(conditions, caller, callback, exit_callback);
  }

  _proto.findFirst = function(conditions, caller, callback, exit_callback) {
    this.getCollection(caller, function(err, collection) {
      if (err) {
        callback.call(caller, err, null, exit_callback);
      } else {
        var cursor = collection.find(conditions, {limit: 1});
        cursor.nextObject(function(err, doc) {
          callback.call(caller, err, doc, exit_callback);
        });
      }
    });
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
