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
define(['backbone'], 
/**
 * A Backbone Collection with selection functions.
 *
 * @exports models/SelectableCollection
 * @author Mark Hepburn
 * @author Simon Pigot
 */

function(Backbone) {

/**
 * @constructor
 * @augments Backbone.Collection
 */
	var SelectableCollection = Backbone.Collection.extend({

    /**
     * Set the selected object in the collection
     *
     * Argument can either be an index, or a dictionary containing the
     * keys "index", "id", "model" (searched for in that order)
     */
    setSelected: function(idxOrOpts) {
      var idx    = parseInt(idxOrOpts, 10),
          oldIdx = this.selectedIndex;
      if (isNaN(idx) && typeof idxOrOpts === 'object') {
        if (idxOrOpts.hasOwnProperty('index'))
          idx = idxOrOpts.index;
        else if (idxOrOpts.hasOwnProperty('id'))
          idx = this.indexOf(this.get(idxOrOpts.id));
        else if (idxOrOpts.hasOwnProperty('model'))
          idx = this.indexOf(idxOrOpts.model);
        else throw "Invalid argument: " + idxOrOpts;
      }
      if (idx < 0 || idx >= this.size()) throw "Can't select index out of bounds: " + idx;
      this.selectedIndex = idx;
      if (idx !== oldIdx) this.trigger('change:selected', idx, this.at(idx));
    },

    /**
     * Get the index of the selected object in the collection
     */
    getSelectedIndex: function() {
      if (typeof this.selectedIndex === 'undefined') {
        this.selectedIndex = -1;
      }
      return this.selectedIndex;
    },

    /**
     * Get the selected object in the collection
     */
    getSelectedItem: function() {
      var idx = this.getSelectedIndex();
      return idx >= 0 ? this.at(idx) : undefined;
    },

    /**
     * Set the currently selected object to undefined
     */
    clearSelect: function() {
      this.selectedIndex = undefined;
    }
	});

	return SelectableCollection;
});
