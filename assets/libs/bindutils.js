define(['underscore'], function(_) {

  // A collection of utilities used in binding model property values
  // (eg, used with onSet/onGet from stickit)

  var Utils = {

    /////////////////////////////////////////////////////////////////
    // Setter utils (eg, for use with onSet):
    /////////////////////////////////////////////////////////////////

    // Returns a function that can be used as a setter for integer
    // values; if given optional arguments it will further clamp the
    // value to those bounds (inclusive).
    asint: function(min, max) {
      return function(val) {
        val = val || 0;
        val = parseInt(val, 10);
        if (isNaN(val)) val = 0;
        if (typeof min !== 'undefined') val = Math.max(val, min);
        if (typeof max !== 'undefined') val = Math.min(val, max);
        return val;
      };
    },

    // Returns a function that can be used as a setter for float
    // values; if given optional arguments it will further clamp the
    // value to those bounds (inclusive).
    asfloat: function(min, max) {
      return function(val) {
        val = val || 0;
        val = parseFloat(val);
        if (isNaN(val)) val = 0;
        if (typeof min !== 'undefined') val = Math.max(val, min);
        if (typeof max !== 'undefined') val = Math.min(val, max);
        return val;
      };
    },

    /////////////////////////////////////////////////////////////////
    // Getter utils (eg, for use with onGet):
    /////////////////////////////////////////////////////////////////

    // Takes an integral argument representing the precision and
    // returns a function that will display a float value as a string,
    // to that precision.
    fromfloat: function(prec) {
      return function(val) {
        return val.toFixed(prec);
      };
    },

    /////////////////////////////////////////////////////////////////
    // General utils:
    /////////////////////////////////////////////////////////////////

    inc: function(val) {
      return val + 1;
    },

    dec: function(val) {
      return val - 1;
    },

    compose: _.compose

  };

  return Utils;

});
