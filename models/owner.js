var util = require('../lib/zzz/util.js');

module.exports.name = 'Owner';

module.exports.klass = function(data) {
  this.collection_name = 'owner';

  this.FIELDMAP = {
    email: {default: '', type: 'email', required: true, unique: true},
    password: {default: '', type: 'password', required: true},
    password_digest: {default: '', type: 'password_digest'}
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
    this._auth_callback = callback;
    this.findFirst({email: this.email}
      , this
      , this.onAuthenticate);
  }

  this.onAuthenticate = function(err, record) {
      var ret = this.RESULT.ERROR;
      if (record) {
        if (record.password_digest == util.digest(this.password)) {
          this.bind(record);
          ret = this.RESULT.SUCCESS;
        } else {
          ret = this.RESULT.WRONG_PASSWORD;
        }
      } else {
        if (!err) {
          ret = this.RESULT.DOESNT_EXIST;
        }
      }
      this._auth_callback(err, ret);
    };

  this.signup = function(callback) {
    this._signup_callback = callback;
    this.findFirst({email: this.email}
      , this
      , this.onSignupFind);
  }

  this.onSignupFind = function(err, record) {
    if (err) {
      this._signup_callback(err, this.RESULT_ERROR);
      return;
    }
    if (record) {
      this._signup_callback(false, this.RESULT.ALREADY_EXIST);
    } else {
      this.password_digest = util.digest(this.password);
      this.save(this, this.onSignupSave);
    }
  }

  this.onSignupSave = function(err, obj) {
    if (err) {
      this._signup_callback(err, this.RESULT.ERROR);
    } else {
      this._signup_callback(false, this.RESULT.SUCCESS);
    }
  }
}
