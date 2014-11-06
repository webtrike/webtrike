/*
Copyright (c) 2003-2014 COMMONWEALTH SCIENTIFIC AND INDUSTRIAL RESEARCH
ORGANISATION ('CSIRO'). All rights reserved.

This licence is based on the standard BSD Licence.

1.   Redistribution and use of this software in source and binary forms, with
     or without modification, are permitted provided that the following 
     conditions are met:

     *   Redistributions of the software in source code form must retain the
         above copyright notice, this list of conditions and the following
         disclaimer. 
     *   Redistributions in of the software in binary code form must reproduce
         the above copyright notice, this list of conditions and the following
         disclaimer in the documentation and/or other materials provided with
         the distribution. 
     *   Neither the name of the CSIRO nor the names of its contributors may be
         used to endorse or promote products derived from this software without
         specific prior written permission. 

2.   THIS SOFTWARE IS PROVIDED BY CSIRO AND CONTRIBUTORS "AS IS" AND ANY
     EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
     WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
     DISCLAIMED.
 
3.   IN NO EVENT SHALL CSIRO OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
     INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
     (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
     SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
     CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
     LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
     OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
     SUCH DAMAGE.

The following section provides additional exclusionary and limitations
provisions in addition to those of the standard BSD Licence:

4.   FOR CLARITY THE LIMITATIONS ON CSIRO AND CONTRIBUTORS' LIABILITY OUTLINED
     IN CLAUSES 2 AND 3 APPLY TO THE EXTENT PERMITTED BY LAW. CSIRO AND
     CONTRIBUTOR LIABILITY IN RESPECT OF ANY IMPLIED GUARANTEES WHICH CANNOT
     BE EXCLUDED UNDER LAW IS LIMITED AT CSIRO'S OPTION TO:

     (i)     THE REPLACEMENT OF THE SOFTWARE OR THE SUPPLY OF EQUIVALENT
             SOFTWARE;
     (ii)    THE REPAIR OF THE SOFTWARE;
     (iii)   THE PAYMENT OF THE COST OF REPLACING THE SOFTWARE OR OF ACQUIRING
             EQUIVALENT SOFTWARE OR HAVING THE SOFTWARE REPAIRED.

5.   CSIRO LICENCES THE SOFTWARE ONLY TO THE EXTENT CSIRO HAS RIGHT, TITLE AND
     INTEREST IN THE SOFTWARE.
*/
define(['backbone', 'underscore', 'openlayers', 'proj4', 'colour', 
'hb!webtrike/tpl/GridView.hbs', 'hb!webtrike/tpl/GridViewRectangular.hbs', 
'bootstrapxclickover' ],
/**
 * A Wizard view intended to be displayed by
 * {@link module:views/WizardView}. 
 * This particular view allows editing of the grid information from 
 * the selected model defined in the collection 
 * {@link module:models/ModelSpecification}. 
 * 
 * @exports views/GridView
 * @requires tpl/GridView.hbs
 * @requires tpl/GridViewRectangular.hbs
 * @requires models/ModelSpecification
 * @requires models/Sources
 * @author Simon Pigot - some code taken from Mark Hepburn's GridView
 */
function(Backbone, _, OpenLayers, Proj4js, RGBColour, geographicTemplate, rectangularTemplate) {

/** 
 * @constructor
 * @augments Backbone.View
 */
 var GridView = Backbone.View.extend({

/**
 * Handlebars template - passed through RequireJS as tpl/GridView.hbs initially
 * but will be changed to tpl/GridViewRectangular.hbs if the grid is a 
 * rectangular grid (as opposed to the default geographic)
 */
 	template: geographicTemplate,

/**
 * The DOM element in which the OL map will be rendered - see templates for 
 * details
 */
	mapEl: '#map', 

/**
 * U/I events relating to U/I elements displayed in the GridView.
 */
	events: {
		'click .gridaction': 'updateGridFromInputs',
    'keyup .edit': 'disableOLTransformFeature',
    'click .forcingCheck': 'clickForcingCheck',
    'click .hideAllForcing': 'clickHideAllForcing',
    'click .mapcontrols': 'clickMapControls'
	},

/**
 * Initialize the view. This includes creating the OpenLayers map.
 */
	initialize : function () {
		'use strict';
    _.bindAll(this, 'render', 'updateModel');                                   
		// Create the openlayers map we will use
		this.createMap();

    // from http://stackoverflow.com/questions/43044/algorithm-to-randomly-generate-an-aesthetically-pleasing-color-palette, provide a mixer to generate a palette later
    this.colourMix = new RGBColour(255,255,255);
    this.isReady = false;

	},       

/** 
 * Helper to return a random integer
 *
 * @param {integer} min - Minimum range for random number to be in
 * @param {integer} max - Maximum range for random number to be in
 */
  getRandomInt: function(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
  },

/** 
 * Helper to generate an aesthetically pleasing colour palette. Taken from
 * {@link http://stackoverflow.com/questions/43044/algorithm-to-randomly-generate-an-aesthetically-pleasing-color-palette} 
 *
 * @param {Colour} mix - Colour to mix with randomly generated rgb values
 */
  generateRandomColour: function(mix) {
    var red = this.getRandomInt(0, 255),
        green = this.getRandomInt(0, 255),
        blue = this.getRandomInt(0, 255);

    // mix the colour
    if (mix != null) {
        var rgb = mix.getIntegerRGB();
        red = (red + rgb.r) / 2;
        green = (green + rgb.g) / 2;
        blue = (blue + rgb.b) / 2;
    }

    return new RGBColour(red, green, blue);
  }, 

/** 
 * Helper to handle map controls.
 * @todo Move map controls to their own subview so that different views can
 * be selected to provide context sensitive set of controls
 * 
 * @param {Object} ev - Details of the event 
 *
 */
  clickMapControls: function(ev) {
    if ($(ev.currentTarget).hasClass('zoomfull')) {
      this.map.zoomToMaxExtent();
    } else if ($(ev.currentTarget).hasClass('zoomlayer')) {
      this.map.zoomToExtent(this.vectorLayer.getDataExtent().scale(3));
    }
  },

/** 
 * Helper to disable OL transform feature until manually entered grid changes 
 * are complete.
 */
  disableOLTransformFeature: function() {
    'use strict';
    this.control.deactivate();
    $('.gridaction').removeAttr('disabled');
  },

/** 
 * Helper to extract projection and calculate a grid extent region.
 */
  extractProjectionAndRegion: function() {
		'use strict';
		if (this.model.getSelectedIndex() >= 0) {
     	var region = this.model.getSelectedItem().getRegion(),
		      grid = this.model.getSelectedItem().get('grid');

      var projection = grid['projection-proj4'];
      if (!projection) {
        this.proj = "EPSG:4326";
      } else {
        if (projection.indexOf("stere") > 0) projection = projection.replace("stere", "sterea");
        Proj4js.defs["EPSG:UWE"] = projection;
        this.proj = "EPSG:UWE";
      }
      this.oproj = new OpenLayers.Projection(this.proj);
      this.map.displayProjection = this.oproj;

      // display longs, lats outside of map layer display for better vis
      var that = this;
      this.map.events.register("mousemove", this.map, function(e) {
        var position = this.getLonLatFromPixel(e.xy).transform(this.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
        OpenLayers.Util.getElement("coords").innerHTML = "<label>Lon: " + position.lon.toFixed(4) + " | Lat: " + position.lat.toFixed(4) + "</label>";
      });

      // set the grid extent up as a transform control on the map, rotate
      // around origin
			this.setRegion(region, true, false);

		}
	},

/** 
 * Helper to calculate and set the region that will be used to display the 
 * current grid extent region.
 *
 * @param {Object} region - Region polygon calculated from model grid extent
 * @param {boolean} updateTransOrigin - Update the transformation origin
 * @param {boolean} rotateCentroid - Rotate round the centroid if true, 
 * otherwise use origin
 */
	setRegion: function(region, updateTransOrigin, rotateCentroid) {
		'use strict';
   	region.polygon.transform(this.oproj, this.map.getProjectionObject());
    // rotate the bounds as sometimes the polygon isn't quite rectangular
    region.polygon = region.polygon.getBounds().toGeometry();
    if (rotateCentroid) {
		  region.polygon.rotate(region.options.rotation, region.polygon.getCentroid());
    } else {
		  region.polygon.rotate(region.options.rotation, region.polygon.components[0].components[0]);
    }
  	var feature = new OpenLayers.Feature.Vector(region.polygon);
   	this.control.unsetFeature();
   	this.vectorLayer.removeAllFeatures();
   	this.vectorLayer.addFeatures([feature]);

   	this.map.setCenter(region.polygon.getCentroid());
   	this.map.zoomToExtent(region.polygon.getBounds().scale(3));
   	// Note, this has to come last because of how OL calculates map size:
   	this.control.setFeature(feature, region.options);

    // set initial values of transformed origin in EPSG:4326
    if (updateTransOrigin) {
      var transOrig = region.polygon.components[0].components[0].clone();
      transOrig.transform(this.map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
      this.setTransOrig(transOrig.x, transOrig.y);
    }
  },

/** 
 * Helper to set the translated origin into input fields.
 *
 * @param {Number} x - X coordinate of origin
 * @param {Number} y - Y coordinate of origin
 */
  setTransOrig: function(x,y) {
    // set place holders for transformed origin
    $('#x-transOrigin').val(x.toFixed(4));
    $('#x-transOrigin').prop('defaultValue', x.toFixed(4));
    $('#y-transOrigin').val(y.toFixed(4));
    $('#y-transOrigin').prop('defaultValue', y.toFixed(4));
  },

/** 
 * Helper called when the user checks one of the forcing datasets.
 *
 * @param {Object} ev - Details of the event 
 */
	clickForcingCheck: function(ev) {
    'use strict';
   
		var forcing = $(ev.currentTarget).attr('data-id'),
        checked = $(ev.currentTarget).prop('checked'),
        colour = $(ev.currentTarget).attr('data-colour');
    // find this forcing layer in the vector features
    var vectors = this.forcingLayers.getFeaturesByAttribute("name", forcing),
        that = this;
    _.each(vectors,function(feature, index) {
      if (checked) {
        feature.style.display = '';
        feature.style.fillColor = colour;
        feature.style.strokeColor = colour;
      } else {
        feature.style.display = 'none';
      }
    });
    that.forcingLayers.redraw();
  },

/** 
 * Helper called when the user wants to hide the forcing dataset extents layer
 * in OpenLayers
 */
	clickHideAllForcing: function() {
    'use strict';
   
    // grab all features and set style.display to none
    _.each(this.forcingLayers.features,function(feature, index) {
      feature.style.display = 'none';
    });
    this.forcingLayers.redraw();

    // now traverse the forcingCheck DOM elements and uncheck them
    _.each($(this.el).find('.forcingCheck'), function(checkbox, index) {
      $(checkbox).prop('checked', false);
    });
  },

/** 
 * Helper called when the user clicks on the 'Update Grid' button - usually 
 * after changing one or more of the grid information fields.
 */
	updateGridFromInputs: function() {
		'use strict';

    // update the translated origin after translation and rotation only
    var updateTransOrigin = false;

    // check inputs are valid
    var edits = $(this.el).find(".edit");
    var inputsOk = true;
    _.each(edits, function(input) {
      if (isNaN($(input).val())) {
        $(input).addClass('error-style');
        inputsOk = false; 
      } else {
        $(input).removeClass('error-style');
      }
      var equal = ($(input).prop('defaultValue') !== $(input).val());
      if ($(input).prop('defaultValue') !== $(input).val()) {
        if ($(input).hasClass('originmove')) {
          updateTransOrigin = true;
        }
        $(input).prop('defaultValue', $(input).val());
      }
    });

    // activate control (shouldn't be necessary)
    this.control.activate();

    if (!inputsOk) return;

    // translate from old position to new
    var poly = this.vectorLayer.features[0].geometry;
    poly.transform(this.map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
    var first = poly.components[0].components[0].clone(); // first point
    var xtO = parseFloat($('#x-transOrigin').val()),
        ytO = parseFloat($('#y-transOrigin').val()),
        orig = new OpenLayers.Geometry.Point(parseFloat($('#x-origin').val()), parseFloat($('#y-origin').val()));

    if (this.proj !== "EPSG:4326") {
      orig.transform(this.oproj, new OpenLayers.Projection("EPSG:4326"));
    }
    orig.x += (xtO - first.x);
    orig.y += (ytO - first.y);
    orig.transform(new OpenLayers.Projection("EPSG:4326"), this.oproj);
    $('#x-origin').val(orig.x);
    $('#y-origin').val(orig.y);

    // now calculate new region from origin, size and spacing
    var region = this.getRegionFromElements();

    // set this region as the transform shape, rotate around centroid
		this.setRegion(region, updateTransOrigin, true);

    // activate gridaction button (remove disabled attribute)
    $('.gridaction').attr('disabled','disabled');
	},

/** 
 * Helper called to extract the grid values from the input fields and 
 * recalculate a new grid extent for display on the map
 */
	getRegionFromElements: function() {
		'use strict';
    var x0 = parseFloat($('#x-origin').val()),
        y0 = parseFloat($('#y-origin').val()),
        nx = parseFloat($('#ni').val()),
        ny = parseFloat($('#nj').val()),
        xs = parseFloat($('#dphi').val()),
        ys = parseFloat($('#dlambda').val()),
				rotation = parseFloat($('#rotation').val());
    var x1 = x0 + (nx * xs),
        y1 = y0 + (ny * ys);
    return { 
			polygon: new OpenLayers.Geometry.Polygon([
      	new OpenLayers.Geometry.LinearRing([
        	new OpenLayers.Geometry.Point(x0, y0),
        	new OpenLayers.Geometry.Point(x1, y0),
        	new OpenLayers.Geometry.Point(x1, y1),
        	new OpenLayers.Geometry.Point(x0, y1),
        	new OpenLayers.Geometry.Point(x0, y0)
      	])
    	]),
			options: {
				rotation: rotation
			}
		};
	},

/** 
 * Helper called to create the OpenLayers map used to display the grid extent.
 * Note: can't assume that the model has been set when createMap is run.
 */ 
	createMap: function() {
		'use strict';

    var mapserv = new OpenLayers.Layer.MapServer( "OpenLayers Basic",
       "http://vmap0.tiles.osgeo.org/wms/vmap0",
       {layers: 'basic'},
       {wrapDateLine: true, visibility: true, isBaseLayer: true} );

    var highResBathy = new OpenLayers.Layer.WMS( "GA Bathymetry 2009", 
       "http://www.marine.csiro.au/geoserver/wms",
       {layers: 'GA:GA_2009_bathy', transparent: "TRUE"},
       {wrapDateLine: true, visibility: false, isBaseLayer: false, 
        opacity: 0.5} );

    this.map  = new OpenLayers.Map({
      theme: null,
      maxResolution: 1.40625,
      numZoomLevels: 10,
      projection: "EPSG:4326",
      displayProjection: new OpenLayers.Projection("EPSG:4326"),
      controls: [
        new OpenLayers.Control.Navigation(),
        new OpenLayers.Control.PanZoomBar(),
        new OpenLayers.Control.Graticule({
           numPoints: 2, 
           labelled: true,
           visible: false
        }),
        new OpenLayers.Control.LayerSwitcher(),
        new OpenLayers.Control.KeyboardDefaults()
      ],
      layers: [
        mapserv,
        highResBathy
      ]
    });

    this.vectorLayer = new OpenLayers.Layer.Vector("Grid Definition", {
      styleMap: new OpenLayers.StyleMap({
        // a nice style for the transformation box
        "transform": new OpenLayers.Style({
          display: "${getDisplay}",
          cursor: "${role}",
          pointRadius: 5,
          fillColor: "white",
          fillOpacity: 1,
          strokeColor: "black"
        }, {
          context: {
            getDisplay: function(feature) {
              // hide the resize handle at the south-west corner
              return feature.attributes.role === "sw-resize" ? "none" : "";
            }
          }
        }),
        "rotate": new OpenLayers.Style({
          display: "${getDisplay}",
          pointRadius: 10,
          fillColor: "#ddd",
          fillOpacity: 1,
          strokeColor: "black"
        }, {
          context: {
            getDisplay: function(feature) {
              // only display the rotate handle at the south-west corner
              return feature.attributes.role === "sw-rotate" ? "" : "none";
            }
          }
        })
      })
    });

  	this.control = new OpenLayers.Control.TransformFeature(this.vectorLayer, {
      renderIntent: "transform",
      rotationHandleSymbolizer: "rotate",
      irregular: true
  	});
  	this.map.addControl(this.control);

  	this.map.addLayer(this.vectorLayer);

		var that=this;
		this.control.events.on({
			transform: function(ev) { 
        
        if (!(ev.rotation || ev.center || ev.scale || ev.ratio)) return;

        var points = that.control.box.geometry.clone().getVertices(),
            transOrig = new OpenLayers.Geometry.Point(points[0].x, points[0].y);
        transOrig.transform(that.map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
        that.setTransOrig(transOrig.x, transOrig.y);

				if (ev.rotation) {
				  // update rotation
					var rot = parseInt($("#rotation").val()) + parseInt(ev.rotation);
					
					if (rot >= 360) {
					  rot = rot - 360
					} else if (rot < 0) {
					  rot = 360 - Math.abs(rot)
					}
					$("#rotation").val(rot);
          $("#rotation").prop('defaultValue', rot);
					
				} else if (ev.center) {
          // origin updated already
          return;

        } else {
          var control  = that.control,
		          nx = parseFloat($('#dphi').val()),
		          ny = parseFloat($('#dlambda').val()), 
              centroid = control.center;

          // assume control box geometry is a 9 segment line-string,
          // winding counter-clockwise from the SW corner
          // Taken from Mark Hepburn's webplum code

          var geom = control.box.geometry.clone();
          geom.transform(that.map.getProjectionObject(), that.oproj);

          var bgc = geom.components;
          // width points:
          var wp0 = bgc[0], wp1 = bgc[2];
          // height points:
          var hp0 = wp1, hp1 = bgc[4];

          var dxw = wp1.x - wp0.x, dyw = wp1.y - wp0.y,
              dxh = hp1.x - hp0.x, dyh = hp1.y - hp0.y;
          var cwidth = Math.sqrt(dxw*dxw + dyw*dyw),
              cheight = Math.sqrt(dxh*dxh + dyh*dyh);
		      $('#ni').val(Math.round(cwidth/nx));
		      $('#nj').val(Math.round(cheight/ny));				
        }
			},
			transformcomplete: function(ev) {
				var geom = ev.feature.geometry.clone();
        that.setInputsFromTransformGeom(geom);
      }
		});
  },


/** 
 * Sets inputs for non-rotated origin from the Transform Feature Geometry 
 *
 * @param {Geometry} OpenLayers TransformFeature control geometry
 */ 
  setInputsFromTransformGeom: function(geom) {

	  var centre = geom.getCentroid(),
		    rotation = -1 * parseInt($("#rotation").val()),
		    points = geom.getVertices();

    var that=this;
    // now transform shape and calculate number of cells and origin
		_.each(points, function(item){
			if (rotation != 0) {
				item.rotate(rotation, centre);
			}
			item.transform(that.map.getProjectionObject(), that.oproj);
	  });

		var bounds = geom.getBounds();
		$('#x-origin').val(bounds.left);
		$('#y-origin').val(bounds.bottom);
  },

/** 
 * Waits on sources to be retrieved using 
 * jquery deferred in {@link module:models/SourceList} because the
 * sources (forcing datasets) need to be available so that they can be
 * offered to the user for extent display in the map window. Adds bootstrap
 * clickovers and tooltips to appropriate controls.
 *
 * @todo Make this and all wizard views extend a base class that sets tooltips 
 * for all wizard view modules as tooltips are required by all wizard views. 
 */ 
	render : function () { 
		'use strict';

    var that = this;
    if (this.model.sources.deferred) {
      this.model.sources.deferred.done(function() {

		    if (that.model.getSelectedIndex() >= 0) {
			    var modelToRender = that.model.getSelectedItem(),
              grid = _.clone(modelToRender.get('grid'));
      
          if (grid['type'] === 'geographic-rectangular') {
            that.template = geographicTemplate;
          } else if (grid['type'] === 'rectangular') {
            that.template = rectangularTemplate;
            if (isNaN(grid['rotation'])) grid['rotation'] = '0.0';
          } else {
            // FIXME: Should be trapped elsewhere
          }

          var forcings = [];
          that.model.sources.each(function (item, index) {
            forcings.push({ 
              dataset: item.get('name'),
              colour:  that.generateRandomColour(that.colourMix).getCSSHexadecimalRGB()
            });
          });
          grid['forcingDatasets'] = forcings;

    	    var json = JSON.parse(JSON.stringify(grid));
    	    $(that.el).empty();
    	    $(that.el).append(that.template(json));

          // unfortunate that we have to have a wait here until the DOM
          // DOM settles down and we can render the OL map!
		      setTimeout(function(){
			      that.map.render($(that.mapEl).get(0));
			      that.map.updateSize();
			      that.extractProjectionAndRegion();
			    },400);

          that.addSourceLayers();

          // add clickover on forcing list stuff
          var pop = $(that.el).find('[data-toggle="clickover"]');
          $(pop).clickover({
            html: true,
            width: 300,
            global_close: false,
            esc_close: false,
            content: function() {
              return $(that.el).find('[data-forcing="forcingDatasets"]').html(); 
            },
            onHidden: function() {
              _.each(that.forcingLayers.features, function(feature, index) {
                feature.style.display = 'none';
              });
              that.forcingLayers.redraw();
            }
          });

          // add tooltips stuff
          var tt = $(that.el).find('[data-toggle="tooltip"]');
          $(tt).tooltip();

          that.isReady = true;
        }
      });
		}
		return this;
	},

/** 
 * Called by WizardView to update model from 
 * inputs (see {@link module:views/WizardView})
 *
 * @param {function} success - callback function to exec when successful
 */
  updateModel : function(success){
		'use strict';
		var modelToUpdate = this.model.getSelectedItem();
		var grid = modelToUpdate.get('grid');
		grid['x-origin'] = $('#x-transOrigin').val();
		grid['y-origin'] = $('#y-transOrigin').val();
		grid['ni'] = $('#ni').val();
		grid['nj'] = $('#nj').val();
		grid['rotation'] = $('#rotation').val();
    if (grid['type'] === 'geographic-rectangular') {
		  grid['dphi'] = $('#dphi').val();
		  grid['dlambda'] = $('#dlambda').val();
    } else if (grid['type'] === 'rectangular') {
		  grid['dx'] = $('#dphi').val();
		  grid['dy'] = $('#dlambda').val();
      var proj = grid['projection-proj4'].split("+");
      var outp = "";
      _.each(proj,function(item) {
        if (item.length > 0) {
          if (item.indexOf("lon_0") >= 0) {
            outp += "+lon_0="+grid['x-origin'];
          } else if (item.indexOf("lat_0") >= 0) {
            outp += "+lat_0="+grid['y-origin'];
          } else {
            outp += "+"+item;
          }
        }
      });
      grid['projection-proj4'] = outp;
    } else {
      // FIXME: Should be trapped elsewhere
      return;
    }

    // set the transformed extent into grid for the current model
    var bounds = this.vectorLayer.features[0].geometry.getBounds()
    bounds.transform(this.map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
    grid['bottom'] = bounds.bottom.toString();
    grid['left'] = bounds.left.toString();
    grid['top'] = bounds.top.toString();
    grid['right'] = bounds.right.toString();
		var sets = [];

		// now check that the grid box actually intersects the required 
		// forcing layers
		var theModelVars = modelToUpdate.get('forcing')['variables'];
		var groupBy = _.groupBy(theModelVars, function(variable) {
      return variable['stream'];
    });
		var modelBounds = new OpenLayers.Bounds(
            parseFloat(grid['left']),
            parseFloat(grid['bottom']),
            parseFloat(grid['right']),
            parseFloat(grid['top']));
    this.model.sources.each(function (item, index) {
      var stream = item.get('stream'), ds = item.get('name'),
      		vars = item.get('variables').pluck('name'),
				  disabled = item.get('disabled'),
          srcBounds = item.getBounds();	
			var reqvars = groupBy[stream];
      if (reqvars) {
        var rvars = _.pluck(reqvars, 'name');
        if (_.intersection(vars, rvars).length > 0 && !disabled &&
          srcBounds.containsBounds(modelBounds)) {
          sets.push(stream);
        }
			}
    });
	
		var dsets = _.pluck(theModelVars, 'stream');
		var missing = _.difference(dsets, sets);

		if (!(missing.length == 0)) {
			this.alertmessage('.runalerts', 'failed', 'Grid must intersect BBOX of forcing dataset(s) '+_.uniq(missing).join());
		} else {
			success();
		}
	},

/**
 * Helper to display an alert message using bootstrap alert.
 * @todo code shared with some other wizard views - could be moved to common
 * base class
 *
 * @param {string} container - DOM element to place bootstrap alert in
 * @param {string} alerttype - Type of alert (bootstrap CSS)
 * @param {string} message - Message to display in bootstrap alert
 */
  alertmessage: function(container, alerttype, message) {
    var c = $(this.el).find(container);
    c.empty().append('<div class="alert ' +  alerttype + '"><a class="close" data-dismiss="alert">×</a><span>'+message+'</span></div>');
    c = c.children(":first")
    setTimeout(function() {
      c.fadeTo(500, 0).slideUp(500, function(){
        $(this).remove();
      });
    }, 5000);
  },

/** 
 * Add source (forcing dataset) layers to this.forcingLayers so that there
 * display etc can be controlled from the 'Forcing Datasets' pull down menu.
 */
	addSourceLayers: function() {
		'use strict';

    var polyStyle = {
                strokeColor: "yellow",
                strokeOpacity: 1,
                strokeWidth: 4,
                fillColor: "yellow",
                fillOpacity: 0.2,
                display: 'none'
    };

    // Remove all forcing layers from this.forcingLayers if it exists already
    if (!this.forcingLayers) {
      this.forcingLayers = new OpenLayers.Layer.Vector("Forcing Layers", {
        isBaseLayer: false,
        displayInLayerSwitcher: false
      });
  	  this.map.addLayer(this.forcingLayers);
    } else {
      this.forcingLayers.removeAllFeatures();
    }

    // Now that the map has been rendered, add bbox layers to the 
    // map window to ensure that the user can choose a grid extent that
    // is inside one of the sources
    var that = this;
    this.model.sources.each(function (item, index) {
      var name = item.get('name');
      var bounds = item.getBounds();
      bounds.transform(new OpenLayers.Projection("EPSG:4326"), that.map.getProjectionObject());
      var poly = bounds.toGeometry();
      var polyFeature = new OpenLayers.Feature.Vector(poly, {"name": name});
      polyFeature.style = _.clone(polyStyle);
      that.forcingLayers.addFeatures([polyFeature]);
    });

	}

 });

 return GridView;
});
