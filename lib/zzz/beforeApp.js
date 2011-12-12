module.exports = function() {
  Object.defineProperty(Object.prototype, "extend", {
    enumerable: false,
    value: function(from, replace) {
      if (replace == undefined) {
        replace = true;
      }
      var props = Object.getOwnPropertyNames(from);
      var dest = this;
      props.forEach(function(name) {
        if (!(name in dest) || replace) {
          var destination = Object.getOwnPropertyDescriptor(from, name);
          Object.defineProperty(dest, name, destination);
        }
      });
      return this;
    }
  });

  Object.defineProperty(Object.prototype, "subset", {
    enumerable: false,
    value: function(names) {
      var props = Object.getOwnPropertyNames(this);
      var ret = {};
      props.forEach(function(name) {
        if (name in names) {
          var des = Object.getOwnPropertyDescriptor(this, name);
          Object.defineProperty(ret, name, des);
        }
      })
      return ret;
    }
  });

  Object.defineProperty(Array.prototype, "merge", {
    enumerable: false,
    value: function(ary) {
      for (var i = 0; i < ary.length; i ++) {
        this.push(ary[i]);
      }
    }
  });
}
