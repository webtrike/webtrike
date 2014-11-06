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
define(['backbone', 'underscore', 'webtrike/models/SelectableCollection', 
'models/Model', 'config'], 
/**
 * A Backbone Collection of trike model specification templates 
 * {@link module:models/Model}.
 * Uses jquery deferreds so that users of this collection can check when a 
 * fetch from the server has completed.
 *
 * @exports models/ModelSpecification
 * @requires models/SelectableCollection
 * @requires models/Model
 * @requires Configuration
 * @author Mark Hepburn
 * @author Simon Pigot - Added jquery deferred support
 */
function(Backbone, _, SelectableCollection, Model, Configuration) {

/**
 * @constructor
 * @augments module:models/SelectableCollection
 */
 var ModelSpecification = SelectableCollection.extend({

  /**
   * Server url to retrieve collection of models {@link module:models/Model}
   */
	url: Configuration.Urls.availableModels,

  /**
   * Model type {@link module:models/Model}
   */
	model: Model,

  /**
   * Initialize the collection. In this case we set up loading indicator 
   * displays
   */
  initialize: function() {
    'use strict';
     _.bindAll(this, 'ajaxStart', 'ajaxComplete');
    this.on('request', this.ajaxStart);
    this.on('sync', this.ajaxComplete);
  },

  /**
   * Show loading indicator when fetch request made
   */
  ajaxStart: function() {
    $('#loading-indicator').fadeIn({duration:100});
  },

  /**
   * Remove loading indicator when fetch request complete
   */
  ajaxComplete: function() {
    $('#loading-indicator').fadeOut({duration:100});
  },

  /**
   * Override default fetch method so that we can set up a jquery deferred
   *
   * @param {Object} options - Backbone fetch options
   */
  fetch: function(options) {
    this.deferred = Backbone.Model.prototype.fetch.apply(this, arguments);
  }
 });

 return ModelSpecification;
});

