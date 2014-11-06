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
define(['backbone', 'underscore', 'hb!webtrike/tpl/MainView.hbs', 
        'webtrike/views/WizardView', 
				'webtrike/views/ModelNestingView', 'webtrike/UIComponents', 
				'webtrike/views/ConfirmView', 'webtrike/views/YesNoView',
				'webtrike/views/StatusView',
        'webtrike/models/Model', 'webtrike/models/StatusList', 
        'config',
        'bootstrappopover'], 
/**
 * The MainView (Backbone view) of the webmarvl application.
 * This is the view that renders and controls the main page of the webmarvl 
 * application.
 * The page is laid out in the handlebars template tpl/MainView.hbs and 
 * controlled as a set of subviews.
 *
 * @exports views/MainView
 * @requires tpl/MainView.hbs
 * @requires views/WizardView
 * @requires views/ModelNestingView
 * @requires views/ConfirmView
 * @requires views/YesNoView
 * @requires views/StatusView
 * @requires models/Model
 * @requires models/StatusList
 * @requires Configuration
 * @author Simon Pigot
 */

function(Backbone, _, handlebars, Wizard,
						ModelNestingView, UIComponents, 
						ConfirmView, YesNoView, StatusView,
            Model, StatusList,
            Configuration) {
/** 
 * @constructor
 * @augments Backbone.View
 */
 var MainView = Backbone.View.extend({


/**
 * Handlebars template - passed through RequireJS as tpl/MainView.hbs
 */
 	template: handlebars,

/**
 * Initialize the view. We do everything here: add events on the model ('add',
 * 'remove', 'reset'), render this view, fetch the StatusList model and on
 * success, render the StatusView subview.
 */
	initialize : function() {
		'use strict';
		_.bindAll(this, 'render', 'newModel', 'editModel', 'cloneModel', 'deleteModel', 'abortModel');
		this.model.on('add', this.selectedModelRun, this);
		this.model.on('remove', this.selectedModelRun, this);
		this.model.on('reset', this.selectedModelRun, this);

    this.render();

		// create the status table list model 
		var statusList = new StatusList();

    var that = this;
		// now fetch the status table list and render it in the status view
		statusList.fetch({success: function(sl, response) {
		 that.statusView = new StatusView({
        el: '#job-status-container',
        model: statusList
     });
		 that.statusView.selectedModelRuns = that.model;
     that.statusView.parent = that;
     that.statusView.render();
		}});


	},        

/**
 * U/I events relating to clicking the large buttons that carry out actions on model runs.
 */
	events: {
	    'click .newModel'   : 'newModel',
	    'click .editModel'  : 'editModel',
	    'click .cloneModel' : 'cloneModel',
	    'click .deleteModel': 'deleteModel',
	    'click .abortModel' : 'abortModel'
	},

/**
 * Offer the user the opportunity to close the workflow modal window. 
 * This dialog is offered in a modal window that temporarily replaces the 
 * modal containing the model definition. The dialog is rendered using 
 * {@link module:views/YesNoView}.
 */
  closeModal: function() {
    'use strict';
    $('#wizardModal').modal('hide');
    var that = this; // this points to WizardView because closeModal is
                     // called when closeModal event is called on WizardView
    var yesno = new YesNoView();
    yesno.message = 'If you continue you will lose your current model run definition. Continue?';
    yesno.once({
      'ok'    : function() { 
            $('#yesNoModal').modal('hide'); 
            yesno.remove(); yesno.unbind();
            that.model.clearSelect();                // clear selected model
            that.model.reset(); that.model.fetch();  // refetch the models
      },
      'cancel': function() { 
            $('#yesNoModal').modal('hide'); 
            yesno.remove(); yesno.unbind(); 
            $('#wizardModal').modal('show'); 
      }
    });
    $('#yesNoModal').empty().append(yesno.render().el);
    $('#yesNoModal').modal({
      backdrop: 'static',
      keyboard: false
    });
  },

/**
 * Standard backbone render override. Renders the handlebars template
 * tpl/MainView.hbs
 */
  render: function () { 
    'use strict';
    $(this.el).empty();
    var json = JSON.parse(JSON.stringify(Configuration.UserInfo));
    $(this.el).append(this.template(json));
    return this;
  },

/**
 * Called to show results of delete or abort operations on selected model runs.
 * The operations are posted to the server (see 
 * {@link module:views/MainView~doOperation}) with the 
 * currently selected set of model runs.
 *
 * @param {string} url - URL to post abort/delete operation to
 * @param {object} theData - Contains operation and array of run-ids to post
 *
 */
  alertmessage: function(alerttype, message) {
    'use strict';
    var c = $(this.el).find('.mainalerts');
    c.empty().append('<div class="alert ' +  alerttype + '"><a class="close" data-dismiss="alert">×</a><span>'+message+'</span></div>');
    c = c.children(":first")
    setTimeout(function() {
      c.fadeTo(500, 0).slideUp(500, function(){
        $(this).remove(); 
      });
    }, 5000);
  },

/**
 * Called to set enable/disable main function buttons when model run(s) 
 * selected. Selecting one or more model runs determines which buttons to 
 * enable. For example, no selected model runs means that only the 'New' button
 * is enabled, select one model run and all buttons are enabled. Select more
 * than one model run and all buttons except 'Edit' are enabled.
 */
	setButtons: function() {
    'use strict';

    var nrSelectedModelRuns = this.model.length;
		if (nrSelectedModelRuns > 0) { // remove disabled class
      if (nrSelectedModelRuns == 1) {
        $('.editModel').removeClass('disabled');
			  //$('.submitModel').removeClass('disabled');
			  $('.cloneModel').removeClass('disabled');
      } else {
			  $('.editModel').addClass('disabled');
			  //$('.submitModel').addClass('disabled');
			  $('.cloneModel').addClass('disabled');
      }
			$('.deleteModel').removeClass('disabled');
			$('.abortModel').removeClass('disabled');
		} else {
			$('.editModel').addClass('disabled');
			$('.cloneModel').addClass('disabled');
			$('.deleteModel').addClass('disabled');
			$('.abortModel').addClass('disabled');
			$('.submitModel').addClass('disabled');
		}
	},

/**
 * Called when model run is to be created - 'New' Button. Creates a
 * {@link module:views/WizardView}
 * view and inserts the ModelNestingView into it as the first view tab. Then
 * renders the WizardView as a modal window. The remainder of the tabs will
 * be added when a model has been selected in 
 * {@link: module:views/ModelNestingView}.
 */
  newModel: function() {
  	'use strict';

    // unselect current model choice and destroy any existing wizard
    this.modelSpec.clearSelect();
    Wizard.destroy();

    // initialize the modal with the model selection view
    Wizard.initialize(this.modelSpec);    
    Wizard.insertView({
         ref: new ModelNestingView({model:this.modelSpec}),
         tab: 'Model'
    });
   	$('#wizardModal').append(Wizard.render().el);    

    // start the modal workflow to define the model run
    $('#wizardModal').modal({
      backdrop: 'static', // clicking in the background doesn't close modal
      keyboard: false     // don't allow escape button to remove modal
    });
    Wizard.on('closeModal', this.closeModal); // confirm that modal is to be closed
	},

/**
 * Called when model run is to be edited - 'Edit' Button.
 * Retrives the model run parameters for the selected model run, adds it to the 
 * current model collection in this.modelSpec. Creates a 
 * {@link module:views/WizardView}
 * view and inserts the required tabs for the model run (see 
 * {@link module:UIComponents.js}) into it and then renders the 
 * WizardView as a modal window.
 * @todo: Not enabled yet.
 */
  editModel: function() {
  	'use strict';

    if ($('.editModel').hasClass('disabled')) return;

    var that = this;

    // fetch the model details of the selected run, add it to modelSpec 
    // set it as the selected model and then start the workflow interface
    var selected = this.model.at(0);  // only one selected for editing
    selected.fetch({success: function(resp) {
      // Check to see whether status is aborted or created otherwise we don't
      // allow editing
      var stat = resp.get('status');
      if (stat !== 'created' && stat !== 'aborted') {
          that.alertmessage('failed', 'Can only edit models with status Created or Aborted.');
          return;
      }
      var theModel = new Model();
      theModel.set(JSON.parse(resp.get('modelparameters')));
      that.modelSpec.push(theModel);
      that.modelSpec.setSelected(that.modelSpec.length - 1);

      // unselect current model choice and destroy any existing wizard
      Wizard.destroy();

      // initialize the modal with the model selection view
      Wizard.initialize(that.modelSpec);    

      // now get the required components from the model and add the appropriate
      // views to the wizard
      UIComponents(that.modelSpec);

   	  $('#wizardModal').append(Wizard.render().el);    

      // start the modal workflow to define the model run
      $('#wizardModal').modal({
        backdrop: 'static', // clicking in the background doesn't close modal
        keyboard: false     // don't allow escape button to remove modal
      });
      Wizard.on('closeModal', that.closeModal); // confirm that modal is to be closed
      }
    });
	},

/**
 * Called when model run is to be cloned - 'Clone' Button.
 * Retrives the model run parameters for the selected model run, clones them 
 * and adds them to the current model collection in this.modelSpec. 
 * Creates a WizardView 
 * {@link module:views/WizardView}
 * view and inserts the required tabs for the 
 * model run (see UIComponents.js)
 * into it and then renders the WizardView as a modal window.
 * @todo: Alter the model run-id on clone. Not enabled yet.
 */
  cloneModel: function() {
  	'use strict';

    if ($('.cloneModel').hasClass('disabled')) return;

    var that = this;

    // fetch the model details of the selected run, clone it, add it to
    // modelSpec, set it as the selected model and then start the workflow
    // interface
    var theModel = this.model.at(0);  // only one selected for editing
    theModel.fetch({success: function(resp) {
      // check to see whether the model is actually running if so don't 
      // allow any changes
      var theModel = new Model();
      theModel.set(JSON.parse(resp.get('modelparameters')));
      that.modelSpec.push(theModel);
      that.modelSpec.setSelected(that.modelSpec.length - 1);

      // unselect current model choice and destroy any existing wizard
      Wizard.destroy();

      // initialize the modal with the model selection view
      Wizard.initialize(that.modelSpec);    

      // now get the required components from the model and add the appropriate
      // views to the wizard
      UIComponents(that.modelSpec);

   	  $('#wizardModal').append(Wizard.render().el);    

      // start the modal workflow to define the model run
      $('#wizardModal').modal({
        backdrop: 'static', // clicking in the background doesn't close modal
        keyboard: false     // don't allow escape button to remove modal
      });
      Wizard.on('closeModal', that.closeModal); // confirm that modal is to be closed
      }
    });
  },

/**
 * Called when existing model run(s) is/are selected and are to be deleted - 
 * 'Delete' button.
 */
  deleteModel: function() {
  	'use strict';

    if ($('.deleteModel').hasClass('disabled')) return;

    var selected = {
      'operation': 'delete',
      'runids': this.model.pluck('runid')
    };
    this.doYesNo(selected);
  },

/**
 * Called when existing model run(s) is/are selected and are to be aborted - 
 * 'Abort' button.
 */
  abortModel: function() {
  	'use strict';

    if ($('.abortModel').hasClass('disabled')) return;

    var selected = {
      'operation': 'abort',
      'runids': this.model.pluck('runid')
    };
    this.doYesNo(selected);
  },

/**
 * Called to display run-ids and confirm or cancel a delete/abort operation. 
 * The confirmation dialog is a modal window. Its contents are rendered using
 * YesNo view from {@link module:views/YesNoView}
 *
 * @param {object} selected - Contains operation and array of run-ids to display
 *
 */
  doYesNo: function(selected) {
  	'use strict';
    var that = this;
    var yesno = new YesNoView();
    yesno.message = 'Do you really want to '+selected.operation+' run id(s) '+selected.runids.toString()+'?';
    yesno.once({
      'ok'    : function() { that.doOperation(Configuration.Urls.manageRuns, selected); $('#yesNoModal').modal('hide'); yesno.remove(); yesno.unbind(); },
      'cancel': function() { $('#yesNoModal').modal('hide'); yesno.remove(); yesno.unbind(); }
    });
    $('#yesNoModal').empty().append(yesno.render().el);
    $('#yesNoModal').modal({
      backdrop: 'static',
      keyboard: false
    });
  },

/**
 * Post delete/abort operation to server and await response. Display result as
 * a bootstrap alert using {@link module:views/MainView~alertmessage}
 *
 * @param {string} url - URL to post abort/delete operation to
 * @param {object} theData - Contains operation and array of run-ids to post
 *
 */
  doOperation: function(url, theData) {
    'use strict';
    var that = this;
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=UTF-8',
        dataType: 'json',
        processData: false,
        data: JSON.stringify( theData ),
        success: function(resp) {
          that.alertmessage('success', theData.operation+' operation on run ids '+theData.runids.toString()+' succeeded');
          that.statusView.refreshStatus();
        },
        error: function() {
          that.alertmessage('failed' , theData.operation+' operation on run ids '+theData.runids.toString()+' failed');
        }
    }); 
	},

/**
 * Called when model runs are selected to enable/disable buttons representing
 * operations
 */
 	selectedModelRun: function() {
  	'use strict';
		this.setButtons();
 	}
 });

 return MainView;

});
