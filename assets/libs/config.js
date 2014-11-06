define(['underscore'], function(_) {

  // 'this' will be the window object.  This allows us to inject bits
  // of configuration via the page template, before requirejs loads.
  var Configuration = window.Configuration || {};

  // Put any static configuration in here.  We merge the global config
  // into this module config, not the other way around, so page
  // (global) configuration will over-write anything specified here.
  var config = {};

  // Note, _.merge is actually a method of lodash, not underscore
  // itself.  It does a deep extend, whereas _.extend is just
  // single-level and will over-write properties.

  return _.merge(config, Configuration);

});
