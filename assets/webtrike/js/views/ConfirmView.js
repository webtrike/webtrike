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
define(['backbone', 'underscore', 'config', 'hb!webtrike/tpl/ConfirmView.hbs'],
/**
 * A Wizard view intended to be displayed by 
 * {@link module:views/WizardView}.
 * This particular view summarizes the information from the selected model
 * defined in the collection {@link module:models/ModelSpecification} 
 * and accepts a job name from the user. It is
 * intended to be the final view in the workflow as it submits the model to  
 * the server and hides the WizardView modal window when complete.
 * 
 * @exports views/ConfirmView
 * @requires tpl/ConfirmView.hbs
 * @requires models/ModelSpecification
 * @requires Configuration
 * @author Simon Pigot
 */

function(Backbone, _, Configuration, handlebars) {

/** 
 * @constructor
 * @augments Backbone.View
 */
 var ConfirmView = Backbone.View.extend({

/**
 * Handlebars template - passed through RequireJS as tpl/ConfirmView.hbs
 */
 	template: handlebars,

/**
 * Initialize the view.
 */
	initialize : function () {
		'use strict';
    _.bindAll(this, 'render');                                
    this.isReady = false;
	},       
  
/**
 * U/I events relating to the 'Submit Model' button.
 */
  events: {
    'click .btn-submitmodel':  'clickSubmitModel',
  },

/**
 * Render the view.
 */
	render : function () {
    'use strict';
    $(this.el).empty();
		if (this.model.getSelectedIndex() >= 0) {
      var selected = this.model.getSelectedItem(),
          forcings = selected.get('forcing');
      var licenses = forcings['licensed'],
          variables = forcings['variables'];

      _.each(variables, function(variable) {
        var license = _.findWhere(licenses, {dataset: variable.set});
        if (license) {
          variable['license'] = license; 
        }
      });

			var json = JSON.parse(JSON.stringify(selected)); 
    	$(this.el).append(this.template(json));

      // add tooltips stuff
      var tt = $(this.el).find('[data-toggle="tooltip"]');
      $(tt).tooltip();

      this.isReady = true;
		}
    return this;
	},

/**
 * Update the model - this method for ConfirmView simply execs the success 
 * callback because there are no prerequisites for this view to meet
 * before allowing navigation in wizard tabs.
 */
	updateModel : function(success) {
    'use strict';
    success();
  },

/**
 * Set the model name into the currently selected trike model.
 */
	setModelName : function() {
    'use strict';
    var ready = false;
    if (this.model.getSelectedIndex() >= 0) {
      var modelName = $(this.el).find('#modelName');
      if (modelName.val() === '') {
        $(this.el).find('#modelName').addClass('error-style');
      } else {
        $(this.el).find('#modelName').removeClass('error-style');
        var theModel = this.model.getSelectedItem();
        theModel.set('run-name', modelName.val());
        ready = true;
      }
    }
    return ready;
  },

/**
 * Called to show results of operations from server.
 *
 * @param {string} container - DOM element to place bootstrap alert in
 * @param {string} alerttype - Type of alert (bootstrap CSS)
 * @param {string} message - Message to display in bootstrap alert
 *
 */
  alertmessage: function(container, alerttype, message) {
    'use strict';
    var c = $(this.el).find(container);
    var that = this;
    c.append('<div id="confirmAlert" class="alert ' +  alerttype + '"><a class="close" data-dismiss="alert">×</a><span>'+message+'</span></div>');
    $('#confirmAlert').bind('closed', function() {
      that.model.clearSelect();                // clear selected model
      that.model.reset(); that.model.fetch();  // refetch the models
      $('#wizardModal').modal('hide');
    });
  },

 /**
  * Called when the user clicks on 'Submit Model' button. Submits the currently
  * selected model to the server.
  */
  clickSubmitModel: function() {
    'use strict';

    if (!this.setModelName()) return;

    if ($('.btn-submitmodel').hasClass('disabled')) return;

    // disable the submit button so they can't do it again
    $('.btn-submitmodel').addClass('disabled');

    var that = this;
		if (this.model.getSelectedIndex() >= 0) {
      var theModel = this.model.getSelectedItem();
      $.ajax({
        url: Configuration.Urls.manageRuns,
        type: 'POST',
        contentType: 'application/json; charset=UTF-8',
        dataType: 'json',
        processData: false,
        data: JSON.stringify( theModel ),
        success: function(resp) {
          var runid = resp['runid'];
          if (runid === '-1') {
            that.alertmessage('.runalerts', 'failed', 'Failed. '+resp['error']);
          } else {
            that.alertmessage('.runalerts', 'success', 'Success. Run id is '+runid);
            theModel.set('runid', runid);
            theModel.set('status', 'processing');
          }
        },
        error: function() {
          that.alertmessage('.runalerts', 'failed', 'Failed. Dont know why?');
        }
      });
    }
  }

 });

 return ConfirmView;
});
