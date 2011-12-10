module.exports = function() {
  this.check = function(req, callback) {
    owner_id = req.session.owner_id;
    if (owner_id) {
      Owner = require('../../models').Owner;
      owner = new Owner();
      this.req = req;
      //owner.findFirst({email: 'richardz_work@hotmail.com'}, this, this.onFindOwner, callback);
      this._check_callback = callback
      console.log(owner_id);
      owner.findById(owner_id, this, this.onFindOwner);
    } else {
      callback();
    }
  }

  this.onFindOwner = function(err, record) {
    if (record) {
      console.log('find owner');
      console.log(record);
      this.req.context._auth_owner = new Owner(record);
      console.log(this.req.context._auth_owner);
    }
    this._check_callback();
  }
}
