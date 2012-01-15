var crypto = require('crypto');

var exports = module.exports;

exports.digest = function(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

exports.generateKey = function(salt) {
  salt = salt || '';
  var dt = new Date();
  return crypto.createHash('md5').update(dt + Math.random() + salt).digest('hex');
}
