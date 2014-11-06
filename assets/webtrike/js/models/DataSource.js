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
define(['backbone', 'underscore', 'moment', 'webtrike/models/TimeRange', 
				'webtrike/models/VarList', 'openlayers'],
/**
 * A Backbone Model that describes a trike data source (forcing dataset).
 * webmarvl uses a collection of these models - see 
 * {@link module:models/Sources}.
 *
 * @exports models/DataSource
 * @requires models/VarList
 * @requires models/TimeRange
 * @author Mark Hepburn
 * @author Simon Pigot - added extensively
 */
function(Backbone, _, moment, TimeRange, VarList, OpenLayers) {

/**
 * @constructor
 * @augments Backbone.Model 
 */
 var DataSource = Backbone.Model.extend({

    /**
     * Set disabled attribute to false by default.
     */
    defaults: {
      disabled: false
    },

    /**
     * Backbone parse method - Parse the collection but create a 
     * {@link module:models/VarList} model from the variables.
     */
    parse: function(data) {
      data['variables'] = new VarList(data['variables']);
      return data;
    },

    /**
     * Return the min and max time as a {@link module:models/TimeRange} object.
     */
    getTimeRange: function() {
      return new TimeRange({
        min: this.get('min-time'),
        max: this.get('max-time')
      });
    },

    /**
     * Return the bounding box as an OpenLayers.Bounds object  
     */
    getBounds: function() {
      'use strict';
      var b = {};
      b.left = parseFloat(this.get('min-lon')),
      b.right = parseFloat(this.get('max-lon')),
      b.bottom = parseFloat(this.get('min-lat')),
      b.upper = parseFloat(this.get('max-lat'));

      b = this.applyFixes(this.get('name'), b);
      return new OpenLayers.Bounds(b.left, b.bottom, b.right, b.upper);
    },

    /**
     * Hacks to cope with datasets that use 0-360 for longitude
     * That's everything except access-a-... and access-r-...
     * for some strange reason....
     *
     * @param {String} ds - Dataset name
     * @param {Object} b - Bounds as numbers
     */
    applyFixes: function(ds, b) {
      'use strict';
      if ((ds.indexOf('access-a') != 0) && (ds.indexOf('access-r') != 0) &&
          (ds.indexOf('paccsap-wavewatch3-a') != 0) &&
          (ds.indexOf('wavewatch3-a') != 0) && 
          (ds.indexOf('wavewatch3-r') != 0) &&
          (ds.indexOf('foam') != 0)) {
        b.left = b.left - 180.0;
        b.right = b.right - 180.0;
      }

      // sigh - OpenLayers projects the bounding box badly if we get too
      // close to 90/-90
      if (b.upper >= 90) b.upper = 88;
      if (b.bottom <= -90) b.bottom = -88;
      return b;
    }

	});

	return DataSource;
});
