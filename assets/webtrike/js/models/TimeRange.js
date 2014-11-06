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
define(['backbone', 'moment', 'twix'], 
/**
 * A Backbone Model that describes a TimeRange or temporal extent.
 * Uses {@link http://isaaccambron.com/twix.js/} to do time range/temporal 
 * extent comparisons.
 *
 * @exports models/TimeRange
 * @author Mark Hepburn
 * @author Simon Pigot - added extensively
 */
function(Backbone, moment) {

  /**
   * @constructor
   * @augments Backbone.Model 
   */
	var TimeRange = Backbone.Model.extend({

    /**
     * Set min and max to null by default.
     */
    defaults: {
      min: null,
      max: null
    },

    /**
     * Check if this range contains (both ends) the argument range.
     */
    contains: function(range, spinupTime) {
      // Note that moment(null)===null:
      var min      = moment(this.get('min')).add('days',spinupTime),
          max      = moment(this.get('max')),
          otherMin = moment(range.get('min')),
          otherMax = moment(range.get('max')),
          thisRange = moment.twix(min, max),
          otherRange =  moment.twix(otherMin, otherMax);
          
      return (min && max && otherMin && otherMax) &&
              (thisRange.engulfs(otherRange));
    },

    /**
     * Check if this range overlaps (either ends) the argument range.
     * Note: contains is considered to be an overlap
     */
    overlaps: function(range, spinupTime) {
      // Note that moment(null)===null:
      var min      = moment(this.get('min')).add('days',spinupTime),
          max      = moment(this.get('max')),
          otherMin = moment(range.get('min')),
          otherMax = moment(range.get('max')),
          thisRange = moment.twix(min, max),
          otherRange =  moment.twix(otherMin, otherMax);

      return (min && max && otherMin && otherMax) &&
             (thisRange.overlaps(otherRange));
    },

    /**
     * Trim this range to the argument range if it overlaps and return an 
     * array with the trimmed range in it. 
     */
    trim: function(range) {
      var min      = moment(this.get('min')),
          max      = moment(this.get('max')),
          otherMin = moment(range.get('min')),
          otherMax = moment(range.get('max')),
          thisRange = moment.twix(min, max),
          otherRange =  moment.twix(otherMin, otherMax);

      var inter = thisRange.intersection(otherRange);

      return [ moment(inter.start), moment(inter.end) ];
    }
	});

	return TimeRange;
});
