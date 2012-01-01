var util = require('../lib/zzz/util.js');

module.exports.name = 'Owner';

module.exports.klass = function(data) {
  this.collection_name = 'owner';

  this.FIELDMAP = {
    email: {default: '', type: 'email', required: true, unique: true},
    password: {default: '', type: 'password', required: true},
    password_digest: {default: '', type: 'password_digest'},
    created_on: {default: new Date(), type: 'datetime'},
    modified_on: {default: new Date(), type: 'datetime'}
  }

  this.RESULT = {
    DOESNT_EXIST: 'NOTEXIST',
    WRONG_PASSWORD: 'WRONGPASS',
    ALREADY_EXIST: 'EXISTS'
  }

  if (this.init) {
    this.init(data);
  }

  this.authenticate = function(callback) {
    var RESULT = this.RESULT;
    var doAuth = function(obj) {
      var onFind = function(err, record) {
        var ret = RESULT.ERROR;
        if (record) {
          if (record.password_digest === util.digest(obj.password)) {
            obj.bind(record);
            ret = RESULT.SUCCESS;
          } else {
            ret = RESULT.WRONG_PASSWORD;
          }
        } else if (!err) {
          ret = RESULT.DOESNT;
        }
        callback(err, ret);
      };

      obj.findFirst({email: obj.email}, onFind);
    };

    doAuth(this);
  }

  this.signup = function(callback) {
    var RESULT = this.RESULT;
    var doSignup = function(obj) {
      var onFind = function(err, doc) {
        if (err) {
          callback(err, RESULT.ERROR);
        } else if (doc) {
          callback(false, RESULT.ALREADY_EXIST);
        } else {
          obj.password_digest = util.digest(obj.password);
          obj.save(onSave);
        }
      };

      var onSave = function(err, success) {
        callback(err, success? RESULT.SUCCESS : RESULT.ERROR);
      };

      obj.findFirst({email: obj.email}, onFind);
    };

    doSignup(this);
  };
}
