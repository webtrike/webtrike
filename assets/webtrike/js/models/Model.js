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
define(['backbone', 'openlayers', 'proj4'],
/**
 * A Backbone Model that describes a trike model specification template.
 * webmarvl uses a collection of these models - see 
 * {@link module:models/ModelSpecification}.
 *
 * @exports models/Model
 * @author Mark Hepburn
 * @author Simon Pigot - added extensively
 */
function(Backbone, OpenLayers, Proj4js) {

/**
 * @constructor
 * @augments Backbone.Model 
 */
 var Model = Backbone.Model.extend({

  /**
   * Get the region of the grid definition in the trike model, as an 
   * unrotated rectangular region in coordinates of the model
   */
  getRegion: function() {
    var grid = this.get('grid');
    // Assume type:geographic-rectangular or rectangular for now:
    if (grid['type'] === 'geographic-rectangular') {
      var x0 = parseFloat(grid['x-origin']),
          y0 = parseFloat(grid['y-origin']),
          nx = parseInt(grid['ni'], 10),
          ny = parseInt(grid['nj'], 10),
          xs = parseFloat(grid['dphi']),
          ys = parseFloat(grid['dlambda']),
				  rotation = parseFloat(grid['rotation']);
      var x1 = x0 + nx * xs,
          y1 = y0 + ny * ys;
      return this.createPolygon(x0, y0, x1, y1, rotation);
    } else if (grid['type'] === 'rectangular') {
      // FIXME: Need to take note of origin-location 
      var x0 = 0.0,
          y0 = 0.0,
          nx = parseInt(grid['ni'], 10),
          ny = parseInt(grid['nj'], 10),
          xs = parseFloat(grid['dx']),
          ys = parseFloat(grid['dy']),
				  rotation = parseFloat(grid['rotation']);
          if (isNaN(rotation)) rotation = 0.0;
      var x1 = x0 + nx * xs,
          y1 = y0 + ny * ys;
      return this.createPolygon(x0, y0, x1, y1, rotation);
    } else {
      // FIXME trouble: this should be caught earlier when we attempt to
      // select a model that has a grid type we don't recognize
    }
  },

  /**
   * Helper to create an object with a few extra useful properties as 
   * well as the polygon region representing the grid definition of 
   * trike model
   */
  createPolygon: function(x0, y0, x1, y1, rotation) {
    return { 
			polygon: new OpenLayers.Geometry.Polygon([
     	 new OpenLayers.Geometry.LinearRing([
        new OpenLayers.Geometry.Point(x0, y0),
        new OpenLayers.Geometry.Point(x1, y0),
        new OpenLayers.Geometry.Point(x1, y1),
        new OpenLayers.Geometry.Point(x0, y1)
      	])
    	]),
			options: {
				rotation: rotation
			}
		};
  },

  /**
   * Set the bounding box of the polygon region into the grid section of the
   * trike model (note we need to use strings to avoid problems with trike
   * parsing this section). This bounding box can be used to determine whether
   * the user is defining a model in a particular area of interest eg. 
   * it is currently used in {@link module:views/SliderForcingView} to 
   * exclude forcing datasets that don't contain it when the user selects 
   * forcing datasets.
   */
  setBounds: function() {
    var poly = this.getRegion().polygon,
        grid = this.get('grid'),
        projection = grid['projection-proj4'],
        proj = "EPSG:4326";

    if (projection) {
      if (projection.indexOf("stere") > 0) projection = projection.replace("stere", "sterea");
      Proj4js.defs["EPSG:UWE"] = projection;
      poly.transform(new OpenLayers.Projection("EPSG:UWE"), 
                     new OpenLayers.Projection("EPSG:4326"));
    }
    
    var bounds = poly.getBounds();
    grid['bottom'] = bounds.bottom.toString();
    grid['left'] = bounds.left.toString();
    grid['top'] = bounds.top.toString();
    grid['right'] = bounds.right.toString();
  }

	});

	return Model;
});
