# Contacts

Experimenting node.js.

## JavaScript Object

Extended Object and Array a bit.

#### Object.extend(from, replace)
Add properties of _from_ object to current object.
If same property exists, then replace if _replace_ is true. Default true.

#### Object.subset(names)
Return a new object with subset of properties of current object.

#### Array.merge(ary)
Merge _ary_ into current array.

## Context

A context object is added to each request. It is used for template rendering.

### Flash message

Context object handles flash messages. Flash message is the kind of message that generated on business logic layer. Supposed to be displayed to user once, and only once. It need to handle case of redirect. Here we use session object to persist messages util the are renderred once.

Currently two type: error, info.

#### context.error(msg)
Add error message[s]. _msg_ can be string or array of strings.
If no _msg_ supplied then return all errors.

#### context.info(msg)
Add info message[s]. _msg_ can be string or array of strings.
If no _msg_ supplied then return all info messages.

#### conext.clearFlash()
Clear flash messages from session.

## Model

The first goal is to implemente Active Record pattern talk to MongoDB.

Models are defined unser models/ directory. To use:
<pre>
<code>
var Contact = require('../models').Contact;
var contact = new Contact();
...
contact.bind(data);
contact.save(caller, callback);
...
</code>
</pre>

Each model only need to define FIELD_MAP to have basic methods
* validate
* bind
* find
* save
* delete

Example:
<pre>
<code>
module.exports.name = 'Contact';

module.exports.klass = function(data) {
  this.collection_name = 'contact';

  this.FIELDMAP = {
    name: {default: '', type: 'string', required: true},
    owner_id: {default: '', type: 'ObjectId', required: true},
    primary_contact_type: {default: '', type: 'string', required: true}, // email|phone|skype
    primary_contact: {default: '', type: 'string', required: true},
    created_on: {default: new Date(), type: 'datetime'},
    modified_on: {default: new Date(), type: 'datetime'}
  }

  if (this.init) {
    this.init(data);
  }
}
</code>
</pre>

Not finished yet...
