/*
CSIRO Version of BSD Licence 

ROAM, Trike and LOMS

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
define(['underscore', 
				'webtrike/views/GridView', 
				'webtrike/views/SliderForcingView', 
        //'webtrike/views/ParametersView',
        'webtrike/views/ConfirmView',
        'webtrike/views/WizardView'], 
/**
 * The module responsible for finding and building a list of component views
 * that will be displayed in the wizard ie. {@link module:views/WizardView}. 
 * At present, new views can be added to the list of those that can be
 * selected by including the view in the require define statement for this 
 * module, extending the InterfaceComponentsMap 
 * object and adding code to find when the component is required to 
 * {@link module:UIComponents~UIComponents}. 
 * Alternatively this module could be replaced with another that does a similar
 * task.
 * 
 * @exports UIComponents
 * @requires tpl/GridView.hbs
 * @requires tpl/SliderForcingView.hbs
 * @requires tpl/ConfirmView.hbs
 * @requires tpl/WizardView.hbs
 */
function(_, 
         GridView,
				 SliderForcingView, 
         //ParametersView,
         ConfirmView,
         Wizard) {

/** 
 * Maps component names (grid, temporal-extent etc) to
 * Backbone views. The object returned is ready for insertion as a view into
 * WizardViews.
 */
 var InterfaceComponentsMap = {
    'grid'                  : function(modelSpec) {
       return { 
         tab: 'Grid', 
         ref: new GridView({model: modelSpec})
       };
    },
    'forcing-data-matching' : function(modelSpec) {
       return { 
         tab: 'Temporal Extent and Forcing', 
         ref: new SliderForcingView({model:modelSpec})
       };
    }/*,
    'parameters'            : function(modelSpec) {
       return {     
         tab: 'Run Parameters', 
         ref: new RunParametersView({model:modelSpec})
       };
    }
    */
 };

/** 
 * When passed a {@link module:models/ModelSpecification}, get the selected 
 * model and find the components it requires by passing them through 
 * InterfaceComponentsMap. Insert the resulting set of views into the 
 * WizardView and finish with a {@link module:views/ConfirmView}.
 *
 * @params {ModelSpecification} modelSpec - {@link module:models/ModelSpecification}
 */
 var UIComponents = function(modelSpec) {
	  'use strict';

    // clean out the views in the wizard apart from the root view (first one)
    Wizard.cleanViews();

    var currentModel = modelSpec.getSelectedItem();

    var components = [];
    components.push(currentModel.get('grid')['requires-UI']);
    components.push(currentModel.get('forcing')['requires-UI']);
    components.push(currentModel.get('runparams')['requires-UI']);

    _.each(components,function(component) {
      if (component) {
        var view = InterfaceComponentsMap[component]; 
        if (view) Wizard.insertView(view(modelSpec));
      }
    });

    // finally, insert the ConfirmView as the last view in the wizard
    Wizard.insertView({ 
      tab: 'Submit',
      ref: new ConfirmView({model:modelSpec})
    });

  };

 return UIComponents;
});
