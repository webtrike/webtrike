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
define(['backbone', 'underscore', 'moment', 'webtrike/models/DataSource', 
'webtrike/models/TimeRange', 'config'],
/**
 * A Backbone Collection of sources (forcing datasets) 
 * {@link module:models/DataSource}.
 * Uses jquery deferreds so that users of this collection can check when a 
 * fetch from the server has completed.
 *
 * @exports models/Sources
 * @requires models/DataSource
 * @requires models/TimeRange
 * @requires Configuration
 * @author Mark Hepburn
 * @author Simon Pigot - added extensively
 */
function(Backbone, _, moment, DataSource, TimeRange, Configuration) {

/**
 * @constructor
 * @augments Backbone.Collection
 */
	var Sources = Backbone.Collection.extend({

    /**
     * Model type {@link module:models/DataSource}
     */
    model: DataSource,

    /**
     * Initialize the collection. In this case we set up loading indicator 
     * displays and various change events triggered when a datasource is 
     * selected or disabled etc
     */
    initialize: function() {
      'use strict';
      _.bindAll(this, 'onSelect', 'onChangeModel', 'onDisabled', 'clearSelected', 'clearDisabled', 'ajaxStart', 'ajaxComplete');
      this.on('change:selected', this.onSelect);
      this.on('change:disabled', this.onDisabled);
      this.on('change:clearselected', this.clearSelected);
      this.on('change:clearselectedforstream', this.clearSelectedForStream);
      this.on('change:cleardisabled', this.clearDisabled);
      this.on('request', this.ajaxStart);
      this.on('sync', this.ajaxComplete);
    },

    /**
     * Show loading indicator when fetch request made
     */
    ajaxStart: function() {
      $('#modal-loading-indicator').fadeIn({duration:100});
    },

    /**
     * Remove loading indicator when fetch request complete
     */
    ajaxComplete: function() {
      $('#modal-loading-indicator').fadeOut({duration:100});
    },

    /**
     * Triggered when the selected trike model specification changes. Need to
     * fetch all relevant dataSources (forcing datasets) from the server for
     * new trike model specification name.
     */
    onChangeModel: function(_idx, model) {
      'use strict';

      this.supportedsets = model.get('forcing')['supportedsets'];
      this.url = Configuration.Urls.modelProviders + model.get('name') + '/';
      this.baseDate = moment(model.get('base-date'));
      this.deferred = this.fetch({reset: true});
    },

    /**
     * Triggered when we need to clear any selected data source 
     * (forcing dataset) for a particular trike data stream.
     * Do this by traversing the list of data sources and unselecting any that
     * belong to the specified stream.
     *
     * @param {String} streamName - Name of the stream to clear selections for
     */
    clearSelectedForStream: function(streamName) {
      'use strict';
      var stream = this.where({stream: streamName});
      _.each(stream, function(source) {
        source.set('selected', false);
      });
    },

    /**
     * Triggered when a data source (forcing dataset) is selected.
     * Do this by traversing the list of data sources and selecting the 
     * required data source (if it belongs to the specified data stream).
     * Only one data source per data stream can be selected.
     *
     * @param {String} streamName - Name of the stream to which selected 
     * data source belongs
     * @param {String} sourceName - Name of the data source being selected
     * @param {boolean} selected - Are we selecting?
     */
    onSelect: function(streamName, sourceName, selected) {
      'use strict';
      if (!selected) return;
      var stream = this.where({stream: streamName});
      _.each(stream, function(source) {
        if (source.get('name') !== sourceName) {
          source.set('selected', false);
        } else {
          source.set('selected', true);
				}
      });
    },

    /**
     * Triggered when a data source (forcing dataset) is disabled.
     * Do this by traversing the list of data sources and disabling the
     * specified data source (if it belongs to the specified data stream).
     *
     * @param {String} streamName - Name of the stream to which  
     * data source to be disabled belongs
     * @param {String} sourceName - Name of the data source being disabled
     */
    onDisabled: function(streamName, sourceName) {
      'use strict';
      var stream = this.where({stream: streamName});
      _.each(stream, function(source) {
        if (source.get('name') === sourceName) {
          source.set('disabled', true);
				}
      });
    },

    /**
     * Triggered when all data sources need to be enabled.
     */
    clearDisabled: function() {
      'use strict';
      this.each(function(source) {
        source.set('disabled', false);
      });
    },

    /**
     * Triggered when all data sources need to be unselected.
     */
    clearSelected: function() {
      'use strict';
      this.each(function(source) {
        source.set('selected', false);
      });
    },

    /**
     * Get selected data source(s) for all streams.
     * Only one data source can be selected for each data stream.
     */
    getSelected: function() {
      var results = new Backbone.Collection();
      this.each(function(source) {
        if (source.get('selected')) {
          results.add(source);
        }
      });
      return results;
    },

    /**
     * Do we have one selected data source for each data stream?
     */
    isReady: function() {
      var ready = false,
          streams = this.pluck('stream');
      streams = _.uniq(streams);
      var selected = this.getSelected().pluck('stream');
      return _.difference(streams, selected).length == 0;
    },

    /**
     * Returns the time extent, as a TimeRange object, that
     * contains all enabled data sources.
     */
    getTimeRange: function() {
      'use strict';
      var minDateSource = _.min(this.where({'disabled':false}), function(source) {
        return moment(source.get('min-time')).valueOf();
      });
      var maxDateSource = _.max(this.where({'disabled':false}), function(source) {
        return moment(source.get('max-time')).valueOf();
      });
      // We should have objects, but if the collection is empty these
      // return +/-Infinity, which is numeric:
      if (typeof minDateSource === 'number' || typeof maxDateSource === 'number') {
        return new TimeRange();
      }
      // Fix range to include model base-date
      var calcMin = minDateSource.get('min-time'),
          calcMax = maxDateSource.get('max-time');
      if (this.baseDate.isAfter(calcMin) && this.baseDate.isBefore(calcMax)) {
        calcMin = this.baseDate;
      }
      return new TimeRange({
        min: calcMin,
        max: calcMax 
      });
    },

    /**
     * Backbone parse function - called when collection has been fetched
     * Use it to exclude data sources (forcing datasets) that don't 
     * have the required extent or that aren't supported by the current 
     * trike model specification template - see 
     * {@link module:models/Sources~onChangeModel}.
     */
    parse: function(data) {
      'use strict';

      var that = this;

      // pre-process to remove any entries with nulls that might mess things up:
      return _.filter(data, function(ds) {
        var extentTest = 
              ('min-lat' in ds && !(isNaN(parseFloat(ds['min-lat']))) && 
               'max-lat' in ds && !(isNaN(parseFloat(ds['max-lat']))) && 
               'min-lon' in ds && !(isNaN(parseFloat(ds['min-lon']))) && 
               'max-lon' in ds && !(isNaN(parseFloat(ds['max-lon']))) && 
               'min-time' in ds && ds['min-time'] &&
               'max-time' in ds && ds['max-time']);

        if (!extentTest) return false;

        // if valid extent then check to see whether the set is supported by
        // the current model
        return (_.indexOf(that.supportedsets, ds.name) !== -1);
      });
    }
	});

	return Sources;

});
