module.exports.name = 'Owner';

module.exports.class = function(data) {
  this.collection_name = 'owner';

  this.FIELDMAP = {
    email: {default: '', type: 'email', required: true},
    password: {default: '', type: 'password', required: true}
  }

  this.RESULT = {
    DOESNT_EXIST: 'NOTEXIST',
    WRONG_PASSWORD: 'WRONGPASS',
    ALREADY_EXIST: 'EXISTS'
  }

  if (this.init) {
    this.init(data);
  }

  this.authenticate = function(exit_callback) {
    this.findFirst({email: this.email}
      , this
      , this.onAuthenticate
      , exit_callback);
  }

  this.onAuthenticate = function(err, record, exit_callback) {
      if (err) {
        exit_callback(err, this.RESULT.ERROR);
        return;
      }
      if (record) {
        if (record.password == this.password) {
          this.bind(record);
          ret = this.RESULT.SUCCESS;
        } else {
          ret = this.RESULT.WRONG_PASSWORD;
        }
      } else {
        ret = this.RESULT.DOESNT_EXIST;
      }
      exit_callback(false, ret);
    };

  this.signup = function(exit_callback) {
    this.findFirst({email: this.email}
      , this
      , this.onSignupFind
      , exit_callback);
  }

  this.onSignupFind = function(err, record, exit_callback) {
    if (err) {
      exit_callback(err, this.RESULT_ERROR);
      return;
    }
    if (record) {
      exit_callback(false, this.RESULT.ALREADY_EXIST);
    } else {
      this.save(this, this.onSignupSave, exit_callback);
    }
  }

  this.onSignupSave = function(err, record, exit_callback) {
    if (err) {
      exit_callback(err, this.RESULT.ERROR);
    } else {
      exit_callback(false, this.RESULT.SUCCESS);
    }
  }
}
