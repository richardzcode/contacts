module.exports.index = function(req, res, afterTask) {
  var ctx = req.context.extend({
    _page_title: 'Index',
  });

  afterTask(req, res, 'index');
}
