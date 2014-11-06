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
define(['backbone', 'underscore', 'config', 'webtrike/models/Status'], 
/**
 * A Backbone Collection of trike model run status Models.
 * {@link module:models/Status}.
 * Uses jquery deferreds so that users of this collection can check when a 
 * fetch from the server has completed.
 *
 * @exports models/StatusList
 * @requires Configuration
 * @author Mark Hepburn
 * @author Simon Pigot - Added jquery deferred support, other changes
 */
function(Backbone, _, Configuration) {

/**
 * @constructor
 * @augments Backbone.Collection
 */
  var StatusList = Backbone.Collection.extend({

    /**
     * Server url to retrieve collection of run status 
     * {@link module:models/Status}
     */
    url: Configuration.Urls.manageRuns,

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
     * Map status message to bootstrap css button style classes
     */
    mapmessage: function(message) {
      'use strict';
      var result = 'btn-inverse';
      switch (message) {
      case 'scheduled':
        result = 'btn-info';
        break;
      case 'in-progress':
        result = 'btn-info';
        break;
      case 'finished':
        result = 'btn-success';
        break;
      case 'suspended':
        result = 'btn-warning';
        break;
      case 'aborted':
        result = 'btn-danger';
        break;
      case 'error':
        result = 'btn-danger';
        break;
      case 'stalled':
        result = 'btn-danger';
        break;
      case 'initialising':
        result = 'btn-warning';
        break;
      case 'postprocessing':
        result = 'btn-info';
        break;
      case 'waiting':
        result = 'btn-info';
        break;
      case 'created':
        result = 'btn-inverse';
        break;
      }
      return result;
    },

    /**
     * Backbone parse method override. 
     * When parsing the collection, add the cssbutton attribute to each Status
     * model according to the status message using 
     * {@link module:models/StatusList~mapmessage}
     */
    parse: function(data) {
      'use strict';
      var that = this;
      _.each(data, function(model) {
        model['cssbutton'] = that.mapmessage(model['message']);
      });
      return data;
    }

  });

  return StatusList;

});
