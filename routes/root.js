module.exports.index = function(req, res, afterTask) {
  req.context.extend({
    _page_title: 'Index',
  });
  afterTask(req, res, 'index');
}
