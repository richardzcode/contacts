module.exports.name = 'Contact';

module.exports.klass = function(data) {
  this.collection_name = 'contact';

  this.FIELDMAP = {
    name: {default: '', type: 'string', required: true},
    owner_id: {default: '', type: 'ObjectId', required: true},
    primary_contact_type: {default: '', type: 'string', required: true}, // email|phone|skype
    primary_contact: {default: '', type: 'string', required: true},
    subject: {default: '', type: 'string'},
    content: {default: '', type: 'text'},
    created_on: {default: new Date(), type: 'datetime'},
    modified_on: {default: new Date(), type: 'datetime'}
  }

  if (this.init) {
    this.init(data);
  }
}
