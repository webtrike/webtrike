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
define(['backbone', 'underscore', 'handlebars', 'hb!webtrike/tpl/SliderForcingView.hbs', 'webtrike/models/TimeRange', 'webtrike/views/LicenseView', 'webtrike/models/LicenseList', 'config', 'openlayers', 'daterangepicker', 'jqueryui'],
/**
 * A Wizard view intended to be displayed by
 * {@link module:views/WizardView}.
 * This particular view allows editing of the temporal extent 
 * and selection of forcing information for the selected model defined in 
 * the collection {@link module:models/ModelSpecification}. 
 *
 * @exports views/SliderForcingView
 * @requires tpl/SliderForcingView.hbs
 * @requires models/TimeRange
 * @requires views/LicenseView
 * @requires models/LicenseList
 * @requires models/ModelSpecification
 * @requires models/Sources
 * @author Simon Pigot
 */
function(Backbone, _, HandleBars, handlebars, TimeRange, LicenseView,
LicenseList, Configuration, OpenLayers) {

/**
 * @constructor
 * @augments Backbone.View
 */
 var ForcingView = Backbone.View.extend({

/**
 * Handlebars template - passed through RequireJS as tpl/SliderForcingView.hbs
 */
 	template: handlebars,

/**
 * Lookup to provide mapping between TRIKE streams and some more sensible names.
 * @todo Replace with? Otherwise this will have to be extended whenever a new
 * stream is added (fortunately it seems that this pretty much covers it for 
 * now)
 */
	streams: {
		'global-ocean': 'Ocean',
		'global-atmos': 'Atmosphere'
	},

/**
 * U/I events relating to U/I elements displayed in the SliderForcingView.
 */
  events: {
    'change .setSelect'  : 'changeDataSet',
    'click .zoomExtent'  : 'render',
    'click .resetExtent' : 'resetExtent',
    'click .setDisable'  : 'disableDataSet',
  },

/**
 * Initialize the view. This includes a handlebars template helper to process
 * the sources (grouped by stream).
 */
	initialize: function () {
		'use strict';
		_.bindAll(this, 'render', 'updateModel', 'changeDataSet', 'resetExtent', 'disableDataSet');

		var streams = this.streams;

		// register a template helper to process sets and variables grouped by data 
		// stream - see groupBy statement in render function
		Handlebars.registerHelper('groupedVars', function(dataObject, options) {
			var templateWithVariableData = "";
			for (var x in dataObject) {
				if (dataObject.hasOwnProperty(x)) {
					var theData = { 
            stream: x, 
            streamName: streams[x], 
            sets: dataObject[x] 
          };
					templateWithVariableData += options.fn(theData)
				}
			}
			return templateWithVariableData;
		});

		this.extentLimitDays = 30;
    this.isReady = false;
	},  

/** 
 * Waits on sources to be retrieved using 
 * jquery deferred in {@link module:models/SourceList} because the
 * sources (forcing datasets) need to be available for this view.
 */
  render: function () { 
    'use strict';
    var that = this;
    // only render the view when the sources have been fetched ie. the
    // jquery deferred is done
    if (this.model.sources.deferred) {
      this.model.sources.deferred.done(function() {
        $(that.el).empty();
		    if (that.model.getSelectedIndex() >= 0) {
			    var theModelVars = that.model.getSelectedItem().get('forcing')['variables'];
					that.spinupTime = parseInt(that.model.getSelectedItem().get('temporalextent')['spinup-time']);
					if (isNaN(that.spinupTime)) that.spinupTime = 0;

			    var groupBy = _.groupBy(theModelVars, function(variable) {
				    return variable['stream'];
			    });

          // now suck out the enabled datasets for each set of variables by 
          // stream name, rejecting those that don't supply the required vars 
          // or have been disabled by the user or don't contain the bounds
          // of the grid definition
          var sets = {};

          var grid = that.model.getSelectedItem().get('grid');
          var modelBounds = new OpenLayers.Bounds(
            parseFloat(grid['left']), 
            parseFloat(grid['bottom']), 
            parseFloat(grid['right']), 
            parseFloat(grid['top']));
          that.model.sources.each(function (item, index) {
            var stream = item.get('stream'), ds = item.get('name'),
                vars = item.get('variables').pluck('name'),
                disabled = item.get('disabled'), srcBounds = item.getBounds();
            var reqvars = groupBy[stream];
            if (reqvars) {
              var rvars = _.pluck(reqvars, 'name');
              if (_.intersection(vars, rvars).length > 0 && !disabled &&
                  srcBounds.containsBounds(modelBounds)) {
                if (!sets[stream]) sets[stream] = [];
                sets[stream].push({
                  set: ds,
                  variables: reqvars
                });
              }
            }
          });

			    var json = JSON.parse(JSON.stringify({streams: sets})); 
    	    $(that.el).append(that.template(json));

          // add popups with variable info
          $(that.el).find('[rel="popover"]').each(function(index) {
            var ds = $(this).attr("data-set"); // see <span> in template
            if (ds) {
              $(this).popover({
                html: true,
                content: function() {
                  return $(that.el).find('.setVariables[data-set="'+ds+'"]').html();
                }
              });
            }
          });

          var min = moment(that.model.userTimeRange.get('min')),
              max = moment(that.model.userTimeRange.get('max'));

          var days = max.diff(min,'days'),
              rangeMin = moment(min).subtract('days', Math.max(days/5,5)),
              rangeMax = moment(max).add('days', Math.max(days/5,5));
           var rangeTr = new TimeRange();
           rangeTr.set({min: rangeMin, max: rangeMax});

			    // now that the template has been rendered, get the temporal extent
          // and attach as a slider
          var minVal = 0,
              base = moment(rangeMin),
              maxVal = moment(rangeMax).diff(rangeMin, 'days');
         
          // add temporal extent slider using range of all sources containing it
          var textentSlider = that.addSlider(base, minVal, maxVal, that.calcRange(base, that.model.userTimeRange, that.model.userTimeRange), 'textent', false);
          $(textentSlider).on("slidestop", function(evt, ui) {
            that.model.sources.each(function (item, index) {
              var stream = item.get('stream'), ds = item.get('name'), 
                  tr = item.getTimeRange(),
                  disabled = item.get('disabled'),
                  selected = item.get('selected'),
                  setSelect = $(that.el).find('.setSelect[data-set="'+ds+'"]');
              if (tr.contains(that.model.userTimeRange, that.spinupTime) && !disabled) {
                setSelect.show();
                setSelect.attr('disabled', false);
                if (selected) setSelect.attr('checked', true);
              } else {
                setSelect.hide();
                setSelect.attr('disabled', true);
                if (selected) { 
                  setSelect.attr('checked', false);
                  // only one dataset selected for this stream so clear it
                  that.model.sources.trigger('change:clearselectedforstream', stream); 
                }
              }
            });
          });

          // create manual date picker as well
          that.createDatePicker();

          // now add sliders for all sources that overlap with the 
          // current sliderRange (these are disabled for comparison only)
          that.model.sources.each(function (item, index) {
            var stream = item.get('stream'), ds = item.get('name'),
                tr = item.getTimeRange(),
                disabled = item.get('disabled'),
                selected = item.get('selected');
            if (tr.overlaps(that.model.userTimeRange, that.spinupTime) && !disabled) {
              that.addSlider(base, minVal, maxVal, that.calcRange(base, tr, rangeTr), ds, true);
              if (tr.contains(that.model.userTimeRange, that.spinupTime)) {
                var setSelect = $(that.el).find('.setSelect[data-set="'+ds+'"]');
                setSelect.show();
                if (selected) setSelect.attr('checked', true);
                setSelect.attr('disabled',false);
              } else {
                $(that.el).find('.setSelect[data-set="'+ds+'"]').hide().attr('disabled', true);
              }
            } else {
              $(that.el).find('.setSelect[data-set="'+ds+'"]').hide().attr('disabled', true);
              if (!disabled) {
                $(that.el).find('.setDisplay[data-set="'+ds+'"]').val('Outside Range');
              }
            }
          });

          that.isReady = true;
		    }
      });
    }
    return this;
  },

/**
 * Helper to add/update bootstrap daterange picker to temporal extent 
 * input (data-set="textent"). 
 */
  createDatePicker: function() {
    'use strict';
    var that = this;
    var thisElem = $(that.el).find('.setDisplay[data-set="textent"]')[0];

    // update it if already present
    var datepicker = $(thisElem).data('daterangepicker');
    if (datepicker) {
      datepicker.startDate = moment(that.model.userTimeRange.get('min'));
      datepicker.endDate   = moment(that.model.userTimeRange.get('max'));
      datepicker.updateView();
      datepicker.updateCalendars();

    // create it because it isn't present
    } else {
      $(thisElem).daterangepicker({
              timePicker: true,
              timePickerIncrement: 30,
              format: 'YYYY-MM-DD',
              showDropdowns: true,
              timePicker12Hour: false,
              startDate: moment(that.model.userTimeRange.get('min')),
              endDate:   moment(that.model.userTimeRange.get('max')),
              parentEl: that.el 
            },
            function(start, end) {
              'use strict';
              var days = moment(end).diff(start,'days');
              $(that.el).find('.setDisplay[data-set="textent"]').val(start.format('YYYY-MM-DD')+' - '+end.format('YYYY-MM-DD') +' ('+days+' days)');
              that.model.userTimeRange.set({
                min: start, max: end
              });
              that.render();
            }
      );
    }
  },

/**
 * Helper to calculate range for a particular slider (extent tr1) that 
 * overlaps or is inside the extent tr2. tr1 is trimmed to tr2. 
 *
 * @param {Moment} base - origin of currently defined temporal extent
 * @param {TimeRange} tr1 - Time range (temporal extent) of dataset slider to be trimmed against tr2
 * @param {TimeRange} tr2 - Time range (temporal extent) to trim tr1 against
 */
  calcRange: function(base, tr1, tr2) {
    'use strict';
    var trimmed = tr1.trim(tr2); 
    return [ moment(trimmed[0]).diff(base,'days'), moment(trimmed[1]).diff(base,'days')];
  },

/**
 * Helper to add a slider with the defined parameters.
 *
 * @param {Moment} base - origin of currently defined temporal extent
 * @param {Number} minVal - Minimum value in days of slider to be added
 * @param {Moment} maxVal - Maximum value in days of slider to be added
 * @param {Array} range - The time range (temporal extent) to display
 * @param {String} domId - The DOM id of the element to add the slider too
 * @param {boolean} disabled - Is the slider disabled? All sliders are 
 * disabled except for the actual temporal extent slider manipulated by the user
 */
  addSlider: function(base, minVal, maxVal, range, domId, disabled) {
    'use strict';
    var that = this;
    var theSlider = $(this.el).find('#'+domId);
    theSlider.empty().slider({
      range: true,
      min: minVal,
      max: maxVal,
      values: range,
      disabled: disabled,
      slide: function(evt, ui) {
        var d1 = ui.values[0], d2 = ui.values[1];
        // Prevent overlapping, which would create a zero-day
        // extraction
        if (d1 == d2) {
          return false;
        }
        if (!disabled) { // must be the temporal extent
          that.model.userTimeRange.set({
             min: moment(base).add('days', d1),
             max: moment(base).add('days', d2)
          });

        }
        that.displayRange(base, d1, d2, domId);
        return true;
      },
      create: function(evt, ui) {
        var d1 = range[0], d2 = range[1];
        that.displayRange(base, d1, d2, domId);
        return true;
      },
      stop: function(evt, ui) {
        // update manual date time picker
        that.createDatePicker();
      }
    });
    return theSlider;
  },

/**
 * Helper to display the current time range for a slider.
 */
  displayRange: function(base, d1, d2, domId) {
    var tMin = moment(base).add('days', d1),
        tMax = moment(base).add('days', d2),
        days = d2 - d1;
    var datMin = moment(tMin).format("YYYY-MM-DD"),
        datMax = moment(tMax).format("YYYY-MM-DD");            
    $(this.el).find('.setDisplay[data-set="'+domId+'"]').val(datMin+' - '+datMax+' ('+days+' days)');
  },

/**
 * Helper to display an alert message using bootstrap alert.
 * @todo code shared with some other wizard views - could be moved to common
 * base class
 *
 * @param {string} container - DOM element to place bootstrap alert in
 * @param {string} alerttype - Type of alert (bootstrap CSS)
 * @param {string} message - Message to display in bootstrap alert
 */
  alertmessage: function(container, alerttype, message) {
    var c = $(this.el).find(container);
    c.empty().append('<div class="alert ' +  alerttype + '"><a class="close" data-dismiss="alert">×</a><span>'+message+'</span></div>');
    c = c.children(":first")
    setTimeout(function() {
      c.fadeTo(500, 0).slideUp(500, function(){
        $(this).remove();
      });
    }, 5000);
  },

/**
 * Update the model. Called by the 
 * {@link module:views/WizardView} 
 * tab handler when 'Next'/'Previous' button is
 * clicked. This method will display a license modal window
 * if any of the forcing datasets have a license condition that needs
 * to be accepted before proceeding to the next workflow step.
 *
 * @param {function} success - callback function to exec when successful
 */
  updateModel: function(success) {
  	'use strict';
    if (!this.model.sources.isReady()) {
      this.alertmessage('.runalerts', 'failed', 'Set the temporal extent and select one forcing dataset from each group');
			return;
    }

    var min = moment(this.model.userTimeRange.get('min')),
    		max = moment(this.model.userTimeRange.get('max'));
    var days = max.diff(min,'days');
		if (days > this.extentLimitDays) {
      this.alertmessage('.runalerts', 'failed', 'Temporal extent greater than '+this.extentLimitDays+' days is not allowed in this instance of webMARVL');
			return;
    }

    // get the selected set of datasets for each forcing group and set them 
    // into the variables attribute of the model
    var variables = [];
    var sets = [];
    var selects = this.model.sources.getSelected();
    selects.each(function(theSource) {
      var varList = theSource.get('variables'),
          set = theSource.get('name');
      varList.setNames(theSource.get('stream'), set);
      sets.push(set);
      variables.push(varList.toJSON());
    });

    var ready = false, later = false, selectLicenses = false;
    if (variables.length > 0) {
      var forcing = this.model.getSelectedItem().get('forcing');

      // find any license agreements that haven't already been accepted
      var selectLicenses = false,
          licensed = forcing['licensed'];
      if (!licensed) licensed = [];
      _.each(_.uniq(sets), function(set) {
        _.each(licensed, function(licenseSet) {
          licenseSet['selected'] = false;
          if (licenseSet['dataset'] === set) {
            if (!(licenseSet['accepted'])) {
              console.log('Request license acceptance for '+set+' from '+licenseSet['url']);
              licenseSet['selected'] = true;
              selectLicenses = true;
            } else {
              console.log('License for '+set+' from '+licenseSet['url']+' accepted by '+licenseSet['username']);
            }
          }
        });
      });

      // display any license agreements that we found
      var that = this;
      if (selectLicenses) {
        var licenseView = new LicenseView({model: new LicenseList(licensed)});
        $('#wizardModal').modal('hide');
        later = true;
        licenseView.once({
            'ok' : function() {
              forcing['licensed'] = licenseView.model.toJSON();
              $('#licenseModal').modal('hide'); 
              licenseView.remove(); licenseView.unbind();
              $('#wizardModal').modal('show');
              success();
            },
            'cancel': function() {
              $('#licenseModal').modal('hide'); 
              licenseView.remove(); licenseView.unbind();
              $('#wizardModal').modal('show');
              that.alertmessage('.runalerts', 'failed', 'Cannot proceed unless data license conditions are accepted.');
            }
        });
        $('#licenseModal').empty().append(licenseView.render().el);
        $('#licenseModal').modal({
          backdrop: 'static',
          keyboard: false
        });
      }
      
      // now set the variables into the model
      forcing['variables'] = _.flatten(variables);
      ready = true;
    }

    if (!later) {
      if (!ready) {
        this.alertmessage('.runalerts', 'failed', 'Set the temporal extent and select one forcing dataset from each group');
      } else {
        success();
      }
    }
	},


/**
 * Called when the data set radio button is clicked, select the appropriate 
 * data set and clear any other selections for this data stream.
 *
 * @param {Object} ev - Details of the event
 */
  changeDataSet: function(ev) {
  	'use strict';
    var theRadio = $(ev.currentTarget);
    var stream = theRadio.attr('data-stream'),
        set = theRadio.attr('data-set');
    this.model.sources.trigger('change:selected', stream, set, true); 

    var radios = $(this.el).find('.setSelect[data-stream="'+stream+'"]');
    _.each(radios, function(radio) {
      var radSet = $(radio).attr('data-set');
      if (radSet !== set) $(radio).attr('checked', false);
      else $(radio).attr('checked', true);
    });
  },

/**
 * Called when the Reset button is clicked. Reset the temporal extent to 
 * the maximum of all data sources, clear selected and disabled datasets and 
 * then render the view again to show all sliders.
 */
  resetExtent: function() {
  	'use strict';
    this.model.sources.trigger('change:clearselected'); 
    this.model.sources.trigger('change:cleardisabled'); 
    var maxTr = this.model.sources.getTimeRange();
    this.model.userTimeRange.set({
      min: maxTr.get('min'),
      max: maxTr.get('max')
    });
    this.render();
  },

/**
 * Called when the user elects to disable a dataset by clicking on the cross
 * next to the dataset definition. The dataset slider will be hidden and 
 * and its extent will no longer included in the temporal extent calculation.
 *
 * @param {Object} ev - Details of the event
 */
  disableDataSet: function(ev) {
  	'use strict';
    var theClose = $(ev.currentTarget);
    var stream = theClose.attr('data-stream'),
        set = theClose.attr('data-set');
    this.model.sources.trigger('change:disabled', stream, set); 
    /* FIXME: Sometimes it makes sense to reset the user time range
       eg. when they haven't set it 
    var maxTr = this.model.sources.getTimeRange();
    this.model.userTimeRange.set({
      min: maxTr.get('min'),
      max: maxTr.get('max')
    });
    */
    this.render();
  }

 });

 return ForcingView;
});
