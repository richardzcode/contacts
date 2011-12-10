var crypto = require('crypto');

var exports = module.exports;

exports.digest = function(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}
