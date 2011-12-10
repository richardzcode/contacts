module.exports = function() {
  this.check = function(req, callback) {
    owner_id = req.session.owner_id;
    if (owner_id) {
      Owner = require('../../models').Owner;
      owner = new Owner();
      this.req = req;
      console.log(owner_id);
      //owner.findFirst({email: 'richardz_work@hotmail.com'}, this, this.onFindOwner, callback);
      this._check_callback = callback
      owner.findById(owner_id, this, this.onFindOwner);
    } else {
      callback();
    }
  }

  this.onFindOwner = function(err, record) {
    console.log('find callback');
    console.log(err);
    if (record) {
      console.log('found');
      this.req.context._auth_owner = new Owner(record);
    }
    this._check_callback();
  }
}
