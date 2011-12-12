var util = require('util');

var validator = module.exports = function(model) {
  this._validate_model = model;

  this.validate = function(data, caller, callback) {
    this._validate_caller = caller;
    this._validate_callback = callback;
    this._validate_pending = 1; // For all_called
    this._validate_errors = [];
    this._validate_all_called = false;

    var model = this._validate_model;
    for (var name in model.FIELDMAP) {
      var field = model.FIELDMAP[name];
      for (var i = 0; i < field.rules.length; i ++) {
        var rule = field.rules[i];
        var fn = this[rule.type];
        if (fn) {
          this._validate_pending +=1;
          fn.call(this, name, data, rule);
        }
      }
    }
    this._validate_all_called = true;
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

    if (this._validate_all_called && (this._validate_pending <= 0)) {
      this._validate_callback.call(this._validate_caller, this._validate_errors, (this._validate_errors.length == 0));
    }
  }
}

var _proto = validator.prototype;

_proto.required = function(field_name, data, rule) {
  var err = false;
  if (!data[field_name]) {
    err = util.format(rule.message, field_name);
  }
  this.onValidate(err);
}
