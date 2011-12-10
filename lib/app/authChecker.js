module.exports = function() {
  this.check = function(req, callback) {
    owner_id = req.session.owner_id;
    if (owner_id) {
      this.req = req;
      this._check_callback = callback

      Owner = require('../../models').Owner;
      var owner = this._check_owner = new Owner();
      owner.load(owner_id, this, this.onFindOwner);
    } else {
      callback();
    }
  }

  this.onFindOwner = function(err, success) {
    if (success) {
      this.req.context._auth_owner = this._check_owner;
    }
    this._check_callback();
  }
}
