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
define(['backbone', 'underscore', 'webtrike/models/License'], 
/**
 * A Backbone Collection of trike license details.
 * {@link module:models/License}.
 *
 * @requires models/License
 * @exports models/LicenseList
 * @author Simon Pigot
 */
function(Backbone, _, License) {

/**
 * @constructor
 * @augments Backbone.Collection
 */
  var LicenseList = Backbone.Collection.extend({

    /**
     * Backbone model for each member of this collection
     * {@link module:models/License}
     */
    model: function(attrs, options) {
      return new License(attrs, options);
    }

  });

  return LicenseList;

});
