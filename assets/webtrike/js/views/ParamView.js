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
define(['backbone', 'underscore', 'hb!webtrike/tpl/ParamView.hbs'],
/**
 * The view that controls the model parameters display in 
 * {@link module:views/StatusView}. The model used is 
 * {@link module:models/Status}.
 *
 * @exports views/ParamView
 * @requires tpl/ParamView.hbs
 * @requires model/Status
 * @author Simon Pigot
 */
function(Backbone, _, handlebars) {

/** 
 * @constructor
 * @augments Backbone.View
 */
 var ParamView = Backbone.View.extend({

/**
 * Handlebars template - passed through RequireJS as tpl/ConfirmView.hbs
 */
 	template: handlebars,

/**
 * Initialize the view. In this case we fetch {@link module:models/Status}
 * and set a jquery deferred so that we can render when the Status model fetch
 * has returned the data from the server.
 */
	initialize : function () {
		'use strict';
    _.bindAll(this, 'render');                                
    this.deferred = this.model.fetch();
	},       

/**
 * Render the view. Wait upon the jquery deferred until the Status model fetch
 * has returned the data from the server.
 */
	render : function () {
    'use strict';
    var that = this;
    this.deferred.done(function() {
      $(that.el).empty();
		  var modelparams = that.model.get('modelparameters'), 
          forcings = modelparams['forcing'],
          licenses = forcings['licensed'],
          variables = forcings['variables'];

      _.each(variables, function(variable) {
        var license = _.findWhere(licenses, {
                  dataset: variable.set, 
                  accepted: true
        });
        if (license) {
          variable['license'] = license; 
        }
      });
      $(that.el).append(that.template(modelparams));
      $(that.options.theId).empty().append($(that.el));

      // add tooltips stuff
      var tt = $(that.el).find('[data-toggle="tooltip"]');
      $(tt).tooltip();
    });
    return this;
	}
 });

 return ParamView;

});
