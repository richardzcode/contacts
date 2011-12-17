var path = require('path')
  , basename = path.basename
  , fs = require('fs')
  , settings = require('../settings.js')
  , Validator = require('./_validator.js');

function base(cls) {
  var _proto = cls.prototype;

  _proto.init = function(data) {
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
  }

  _proto.validate = function(data, caller, callback) {
    this._validate_caller = caller;
    this._validate_callback = callback;

    var validator = new Validator(this);
    validator.validate(data, this, this.onValidate);
  }
  _proto.onValidate = function(errors, pass) {
    this._validate_callback.call(this._validate_caller, errors, pass);
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
      if (this.FIELDMAP[name].type == 'password') {
        continue;
      }
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

  _proto._serializedId = function(id) {
    var db = this.getDb();
    return new db.bson_serializer.ObjectID(id);
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
      if (err) {
        obj._find_callback.call(obj._find_caller, err, null);
      } else {
        var options = obj._find_options;
        var cursor = collection.find(obj._find_conditions, options);
        //if (options.sort) {
        //  cursor = cursor.sort({'$natural': -1});
        //}
        switch(obj._find_options.type) {
          case 'first':
            cursor.nextObject(function(err, doc) {
              obj._find_callback.call(obj._find_caller, err, doc);
            });
            break;
          case 'all':
          default:
            cursor.toArray(function(err, records) {
              obj._find_callback.call(obj._find_caller, err, records);
            });
            break;
        }
      }
  }

  _proto.findById = function(id, caller, callback) {
    db = this.getDb();
    conditions = {_id: this._serializedId(id)};
    this.find(conditions, {type: 'first'}, caller, callback);
  }

  _proto.findFirst = function(conditions, caller, callback) {
    this.find(conditions, {type: 'first'}, caller, callback);
  }

  _proto.findAll = function(conditions, options, caller, callback) {
    if (options == null) {
      options = {};
    }
    options.type = 'all';
    this.find(conditions, options, caller, callback);
  }

  _proto.load = function(id, caller, callback) {
    this._load_caller = caller;
    this._load_callback = callback;
    this.findById(id, this, this.load_onFind);
  }
  _proto.load_onFind = function(err, doc){
    if (doc) {
      this.bind(doc);
    }
    this._load_callback.call(this._load_caller, err, doc? true : false);
  }

  _proto.save = function(caller, callback) {
    this._save_caller = caller;
    this._save_callback = callback;
    collection = this.getCollection(this, this.save_onCollection);
  }
  _proto.save_onCollection = function(err, collection) {
    var obj = this;
    if (err) {
      this._save_callback.call(this._save_caller, err, null);
    } else {
      collection.insert(this.asRecord(), function(err, doc) {
        if (err) {
          obj._save_callback.call(obj._save_caller, err, null);
        } else {
          obj.bind(doc);
          obj._save_callback.call(obj._save_caller, err, obj);
        }
      });
    }
  }
  _proto.push = function(conditions, pairs, caller, callback) {
    this._push_conditions = conditions;
    this._push_pairs = pairs;
    this._push_caller = caller;
    this._push_callback = callback;
    collection = this.getCollection(this, this.push_onCollection);
  }
  _proto.push_onCollection = function(err, collection) {
    var obj = this;
    if(err) {
      this._push_callback.call(this._push_caller, err, false);
    } else {
      collection.update(this._push_conditions, {'$push': pairs}, function(err) {
        this._push_callback.call(this._push_caller, err, err? false : true);
      });
    }
  }
}

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
  base(cls, model.FIELDMAP);
  exports[model.name? model.name : name] = cls;
});
