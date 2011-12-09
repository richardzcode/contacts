module.exports = {
  debug_mode: true,
  mongo_host: 'localhost',
  mongo_port: 27017,
  mongo_db_name: 'exp',

  development: function() {
    // Settings for development
  },

  production: function() {
    // Settings for production
    this.debug_mode = false;
  }
}
