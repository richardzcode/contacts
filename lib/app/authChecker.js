module.exports = function() {
  this.check = function(req, callback) {
    var doLoad = function(obj, owner_id) {
      obj.load(owner_id, function(err, sucess) {
        req.context._auth_owner = obj;
        callback();
      });
    };

    owner_id = req.session.owner_id;
    if (owner_id) {
      Owner = require('../../models').Owner;
      doLoad(new Owner(), owner_id);
    } else {
      callback();
    }
  };
}
