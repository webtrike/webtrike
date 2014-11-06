// This file is solely for the purposes of monkeypatching.  At issue
// motiviating this strategy is this commit:
// https://github.com/openlayers/openlayers/pull/1005/files which has
// not made it in to a release at time of writing (latest release:
// 2.13.1)

// So, we use a bit of misdirection by abusing requirejs a little: in
// the requirejs config we have renamed the openlayers /path/ to
// origopenlayers, which this module alone depends on, and the
// 'openlayers' path that everything requires now points to this
// module, which just patches and exports the original OpenLayers
// object.

// When this is no longer necessary, it may be removed and the
// 'openlayers' path config reverted to the main library file.

define(['origopenlayers'], function(OpenLayers) {

  /**
   * Function: getConstructor
   * Take an OpenLayers style CLASS_NAME and return a constructor.
   *
   * Parameters:
   * className - {String} The dot delimited class name (e.g. 'OpenLayers.Foo').
   *
   * Returns:
   * {Function} The constructor.
   */
  OpenLayers.Util.getConstructor = function(className) {
    var Constructor;
    var parts = className.split('.');
    if (parts[0] === "OpenLayers") {
      Constructor = OpenLayers;
    } else {
      // someone extended our base class and used their own namespace
      // this will not work when the library is evaluated in a closure
      // but it is the best we can do (until we ourselves provide a global)
      Constructor = window[parts[0]];
    }
    for (var i = 1, ii = parts.length; i < ii; ++i) {
      Constructor = Constructor[parts[i]];
    }
    return Constructor;
  };

  OpenLayers.Geometry.Collection.prototype.clone = function() {
    var Constructor = OpenLayers.Util.getConstructor(this.CLASS_NAME);
    var geometry = new Constructor();
    for(var i=0, len=this.components.length; i<len; i++) {
      geometry.addComponent(this.components[i].clone());
    }

    // catch any randomly tagged-on properties
    OpenLayers.Util.applyDefaults(geometry, this);

    return geometry;
  };

  return OpenLayers;
});
