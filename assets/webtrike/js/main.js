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
require.config({
  waitSeconds: 0,
	paths: {
		backbone: '../../libs/backbone-min',
    backbonebindings: '../../libs/backbone-bindings',
		bootstrap: '../../libs/bootstrap.min',
		bootstrapmodal: '../../libs/bootstrap-modal',
		bootstrapmodalmanager: '../../libs/bootstrap-modalmanager',
		bootstrappopover: '../../libs/bootstrap-popover',
		bootstraptooltip: '../../libs/bootstrap-tooltip',
		bootstrapxclickover: '../../libs/bootstrapx-clickover',
		colour: '../../libs/Colour',
    config: '../../libs/config',
		datatables: '../../libs/jquery.dataTables',
		datatablesbootstrap: '../../libs/DT_bootstrap',
		daterangepicker: '../../libs/daterangepicker',
    downloadURL: '../../libs/downloadURL',
		handlebars: '../../libs/handlebars-1.0.0.beta.6',
		hb: '../../libs/hbtemplate',
		jquery: '../../libs/jquery-1.10.2.min',
    jqueryui: '../../libs/jquery-ui',
    jquerycookies: '../../libs/jquery.cookie',
    marionette: '../../libs/backbone.marionette.min',
		moment: '../../libs/moment',
    openlayers: '../../libs/PatchOL',
		origopenlayers: '../../libs/OpenLayers',
		proj4: '../../libs/proj4js-combined',
    stickit: '../../libs/backbone.stickit',
		text: '../../libs/text',
    tpl: '../../libs/tpl',
		twix: '../../libs/twix',
		underscore: '../../libs/lodash.compat.min',
    // redirect paths
    libs: '../../libs',
    webtrike: '../../webtrike/js'
	},
	shim: {
    backbone: {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    },
    backbonebindings: ['backbone'],
		bootstrap: {
			deps: ['jquery']
		},
		bootstrapmodal: {
			deps: ['bootstrap']
		},
		bootstrapmodalmanager: {
			deps: ['bootstrapmodal']
		},
		bootstrappopover: {
			deps: ['bootstraptooltip']
		},
		bootstraptooltip: {
			deps: ['bootstrap']
		},
		bootstrapxclickover: {
			deps: ['bootstrappopover']
		},
    colour: {
      exports: 'RGBColour'
    },
		daterangepicker: {
			deps: ['bootstrap', 'moment']
		},
		datatables: {
			deps: ['jquery']
		},
		datatablesbootstrap: {
			deps: ['datatables', 'bootstrap']
		},
    downloadURL: ['jquery'],
		handlebars: {
			exports: 'Handlebars'
		},
    jqueryui: ['jquery'],
    jquerycookies: ['jquery'],
    marionette: {
      deps: ['jquery', 'underscore', 'backbone'],
      exports: 'Marionette'
    },
    origopenlayers: {
      exports: 'OpenLayers'
    },
    proj4: {
      exports: 'Proj4js'
    },
    stickit: ['backbone'],
		twix: {
			deps: ['moment']
		}
  }	
});



require(['backbone', 'underscore', 'jquery',
				'webtrike/views/MainView', 
				'webtrike/models/ModelSpecification', 
        'webtrike/models/Sources', 
        'webtrike/models/TimeRange',
        'webtrike/models/SelectedModelRuns',
        'config',
				'datatables', 'datatablesbootstrap', 
				'bootstrapmodal', 'bootstrapmodalmanager',
        'libs/ajaxsetup'
				], 
function(Backbone, _, $, MainView,
						ModelSpecification, Sources, TimeRange,
						SelectedModelRuns,
            Configuration
					) {
		'use strict';

/**
 *
 * Defines paths and exports for RequireJS configuration in
 * require.config object and the main function to be called by the server 
 * from the application's initial web page. 
 *
 * @example <caption>How to use this client in django templates/main.html</caption>
 * <script data-main="static/js/main" src="static/libs/require.min.js"></script>
 *
 * @module main
 *
 * @author Mark Hepburn
 * @author Simon Pigot - simplified
 * 
 * @requires views/MainView
 * @requires models/ModelSpecification
 * @requires models/Sources
 * @requires models/TimeRange
 * @requires models/SelectedModelRuns
 */

    console.log("User Info: "+Configuration.UserInfo.email+", "+Configuration.UserInfo.username+", "+Configuration.UserInfo.organisation,", "+Configuration.UserInfo.forwarded+", "+Configuration.UserInfo.ipaddress);
	 	// create all the basic models and user stuff required 
		var modelSpec = new ModelSpecification();
		var sources = new Sources();
		var userTimeRange = new TimeRange();

		// when sources are read, set the userTimeRange to the temporal extent of
		// all available sources
		sources.on('reset', function() {
			userTimeRange.set(this.getTimeRange().attributes);
			userTimeRange.trigger('reset');
		});

    // ensure a change in the temporal extent will update the selected model
    userTimeRange.on('change', function() {
       var min = this.get('min'), max = this.get('max');
       if (typeof min !== 'object') min = moment(min);
       if (typeof max !== 'object') max = moment(max);
       var selectedModel = modelSpec.getSelectedItem();
       if (selectedModel) {
         selectedModel.set({
          'start-time': min && min.format('YYYY-MM-DD 00:00 +00'),
          'end-time': max && max.diff(this.get('min'), 'days') + ' days'
         });
       }
    });

		// now set the sources as property of modelSpec so
		// everything else has access to them
		modelSpec.sources = sources;
    modelSpec.userTimeRange = userTimeRange;

		// ensure a change in the selected model is reflected in the data sources
		modelSpec.on('change:selected', function(idx, model) {
      this.sources.onChangeModel(idx, model);
      this.getSelectedItem().setBounds();
    });

		// kick things off by fetching the models into modelSpec and rendering the
		// main view
		modelSpec.fetch({success: function(ms, response) {
			modelSpec.each(function(item){
        item.setBounds();
			});

      // create the selected model runs backbone model
		  var selectedModelRuns = new SelectedModelRuns();
			
		  // create the main view and render it
		  var mainView = new MainView({
			  el: '#mainView', 
			  model: selectedModelRuns
		  });
      mainView.modelSpec = modelSpec;

		}});
});

