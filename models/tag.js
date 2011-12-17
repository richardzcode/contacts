module.exports.name = 'Tag';

module.exports.klass = function(data) {
  this.collection_name = 'tag';

  this.FIELDMAP = {
    name: {default: '', type: 'string', required: true},
    color: {default: default_color, type: 'string', required: true},
    created_on: {default: new Date(), type: 'datetime'},
    modified_on: {default: new Date(), type: 'datetime'}
  }

  if (this.init) {
    this.init(data);
  }
}

var default_color = '#E6E9F2';
