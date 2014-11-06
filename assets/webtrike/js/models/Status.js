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
define(['backbone', 'underscore', 'config'], 
/**
 * A Backbone Model that describes the status of a model run on the server. 
 * Status information 
 * includes the modelparameters and runparameters used to create the run.
 * Should be instantiated with the run id for which the status information
 * is required. eg. stat = new Status({runid: 5});
 * Used in collection {@link module:models/StatusList}.
 *
 * @exports models/Status
 * @requires Configuration
 * @author Mark Hepburn
 * @author Simon Pigot - added jquery deferreds
 */
function(Backbone, _, Configuration) {

/**
 * @constructor
 * @augments Backbone.Model 
 */
  var Status = Backbone.Model.extend({

    /**
     * Set defaults for status, url, message and cssbutton class
     */
    defaults: {
      status: '',               // status-label from trike
      url: '',                  // When download is ready a url will be present
      message: '',              // if relevant (eg, error message)
      cssbutton: 'btn-info'

    },

    /**
     * Initialize the Model. In this case we set up loading indicator 
     * displays
     */
    initialize: function() {
      _.bindAll(this, 'fetch', 'ajaxStart', 'ajaxComplete');
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
     * Manufacture the URL we require to fetch specific model run status for 
     * a particular runid
     */
    url: function() {
      return Configuration.Urls.manageRuns + this.get('runid') + '/';
    }


  });

  return Status;

});
