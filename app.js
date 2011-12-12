/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer();

var settings = require('./settings.js')
  , zzz = require('./lib/zzz');

zzz.beforeApp();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.cookieParser());
  app.use(express.session({secret: 'exp'}));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(zzz.requestContext);
  app.use(app.router);
  app.use(require('stylus').middleware({
    src: __dirname + '/public',
    compress: true
  }));
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routing

var dispatcher = require('./routes').getDispatcher(app);

dispatcher.routes('root'
  , ['get', '/', 'index']
);

dispatcher.routes('auth'
  , ['gp', '/auth/login', 'login']
  , ['gp', '/auth/signup', 'signup']
  , ['get', '/auth/logout', 'logout']
);

dispatcher.routes('owner'
  , ['gp', '/owner/profile', 'profile']
);

dispatcher.routes('contact'
  , ['get', '/contacts', 'index']
  , ['get', '/contacts/new', 'new']
  , ['post', '/contacts/create', 'create']
);

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
