module.exports = function requestContext(req, res, next) {
  if (!req.context) {
    req.context = {};
  }

  req.context.extend({
    _error: [],
    _info: []
  });

  next();
}
