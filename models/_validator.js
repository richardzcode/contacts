var util = require('util');

/**
 * First get all rules into a flat array.
 * Then call on rules in a callback chain.
 */
var validator = module.exports = function(model) {
  this._validate_model = model;

  this.validate = function(data, caller, callback) {
    this._validate_caller = caller;
    this._validate_callback = callback;
    this._validate_data = data;
    this._validate_errors = [];

    this._pending_rules = [];
    var model = this._validate_model;
    for (var name in model.FIELDMAP) {
      var field = model.FIELDMAP[name];
      for (var i = 0; i < field.rules.length; i ++) {
        var rule = field.rules[i];
        rule.field_name = name;
        this._pending_rules.push(rule);
      }
    }
    this.onValidate(false);
  }

  this.onValidate = function(err) {
    if (err) {
      this._validate_errors.push(err);
    }
    this._validate_pending -= 1;
    if (this._validate_pending < 0) {
      console.log("Validate pending shouldnt be less than 0");
    }

    if (this._pending_rules.length == 0) {
      this._validate_callback.call(this._validate_caller, this._validate_errors, (this._validate_errors.length == 0));
    } else {
      var rule = this._pending_rules.shift();
      console.log(rule);
      var fn = this[rule.type];
      if (fn) {
        fn.call(this, rule);
      } else {
        this.onValidate(false);
      }
    }
  }
}

var _proto = validator.prototype;

_proto.errorMessage = function(rule) {
  if (rule.message) {
    if (typeof(rule.message) == 'function') {
      return rule.message();
    }
    return rule.message;
  }
  switch(rule.type) {
    case 'required':
      return rule.field_name + ' is required';
    case 'unique':
      return rule.field_name + ' is not available';
    default:
      return rule.field_name + ' is invalid';
  }
}

_proto.required = function(rule) {
  var err = false;
  var data = this._validate_data;
  var field_name = rule.field_name;
  if (!data[field_name]) {
    err = this.errorMessage(rule);
  }
  this.onValidate(err);
};

_proto.unique = function(rule) {
  this._unique_current_rule = rule; // For unique_onFind callback.
  var data = this._validate_data;
  var field_name = rule.field_name;
  var value = data[field_name];
  var conditions = {};
  conditions[field_name] = value;
  if (data._id) {
    conditions._id = {'$ne': this._validate_model._serializedId(data._id)}
  }
  console.log(conditions);
  this._validate_model.findFirst(conditions, this, this.unique_onFind);
};
_proto.unique_onFind = function(err, doc) {
  var err = false;
  if (doc) {
    var rule = this._unique_current_rule;
    err = this.errorMessage(rule);
  }
  this.onValidate(err);
};
