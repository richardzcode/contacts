module.exports.name = 'Client';

module.exports.klass = function(data) {
  this.collection_name = 'client';

  this.FIELDMAP = {
    domain: {default: '', type: 'string', required: true},
    owner_id: {default: '', type: 'ObjectId', required: true},
    key: {default: '', type: 'string'},
    created_on: {default: new Date(), type: 'datetime'},
    modified_on: {default: new Date(), type: 'datetime'}
  }

  if (this.init) {
    this.init(data);
  }
}
