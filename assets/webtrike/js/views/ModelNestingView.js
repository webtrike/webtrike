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
define(['backbone', 'underscore', 'hb!webtrike/tpl/ModelNestingView.hbs', 
        'webtrike/UIComponents'],
/**
 * A Wizard view intended to be displayed by
 * {@link module:views/WizardView}.
 * This particular view allows specification/choice of the model whose
 * parameters will be defined in the remainder of the workflow. It is the first
 * view in the workflow. The collection
 * it uses is {@link: module:models/ModelSpecification}. 
 * At this stage, the exact 
 * requirements of the workflow depend on the choice of model so this view
 * assembles the required views using {@link module:UIComponents} after the
 * user selects a model.
 *
 * @exports views/ModelNestingView
 * @requires tpl/ModelNestingView.hbs
 * @requires UIComponents
 * @requires models/ModelSpecification
 * @author Simon Pigot
 */
function(Backbone, _, handlebars, UIComponents) {

/**
 * @constructor
 * @augments Backbone.View
 */
 var ModelNestingView = Backbone.View.extend({

/**
 * Handlebars template - passed through RequireJS as tpl/ModelNestingView.hbs
 */
 	template: handlebars,

/**
 * Initialize the view. 
 */
	initialize : function () {
		'use strict';
    _.bindAll(this, 'render', 'updateModel');                                   
    this.isReady = false;
	},        

/**
 * We wait on the jquery deferred in {@link module:models/ModelSpecification} 
 * so that the view cannot be rendered until the
 * model information has been obtained from the server. Note that we render the
 * template first and then add the models and options retrieved to a select 
 * from the template (id="model").
 */
	render : function () { 
		'use strict';
    var that = this;
    if (this.model.deferred) {
      this.model.deferred.done(function() {
        var json = JSON.parse(JSON.stringify(that.model.toJSON()));
        $(that.el).empty();
        $(that.el).append(that.template(json));
		    that.setOptions($(that.el).find("#model select"),that.getModels());
		    var idx = that.model.getSelectedIndex();
		    if (idx >= 0) {
			    $(that.el).find("#model select").prop('selectedIndex', idx);
		    }
        that.isReady = true;
      });
    }
    return this;
  },

/**
 * Called by WizardView to update model from inputs/select
 * (see {@link module:views/WizardView}). Note that in this case we update
 * the model by setting the selected model to that chosen in the select.
 *
 * @param {function} success - callback function to exec when successful
 */
  updateModel : function(success){
		'use strict';

		var idx = $('#model select option:selected',this.el).index();
		if (idx < 0) return;

    // if the model changed then set selected to the new user selection
    if (idx !== this.model.getSelectedIndex()) {
		  this.model.setSelected(idx);

      // now get the required components from the model and add the appropriate
      // views to the wizard
      UIComponents(this.model);
    }

		success();
	},

/**
 * Extract model names and descriptions from collection 
 * {@link module:models/ModelSpecification} push them into an array for use by 
 * {@link module:views/ModelNestingView~setOptions}
 */
	getModels: function () {
		'use strict';
		var mods = [];
    this.model.each(function (item) {
        var desc = item.get('name');
        if (item.get('description')) {
          desc += ': '+item.get('description');
        }
        mods.push({ text: desc,
				            value: item.get('name') });
    });
		return mods;
	},

/**
 * Create select options and add them to the select drop down list.
 */
	setOptions: function(select, options) {
		'use strict';
		select.empty();
   	_.each(options, function (item) {
       var option = $("<option/>", item).appendTo(select);
   	});
	}

 });

 return ModelNestingView;

});
