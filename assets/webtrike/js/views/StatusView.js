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
define(['backbone', 'underscore', 'webtrike/models/Status', 
'hb!webtrike/tpl/StatusView.hbs', 'handlebars', 'downloadURL', 
'webtrike/views/ParamView', 'webtrike/views/DownloadView', 
'bootstrapxclickover' ],
/**
 * The view that controls the table of model runs built from the collection
 * {@link module:models/StatusList}. The table of model runs is
 * a jquery DataTable {@link http://datatables.net}. Various U/I controls
 * in the data table are controlled through this view.
 *
 * @exports views/StatusView
 * @requires views/ParamView
 * @requires views/DownloadView
 * @requires models/StatusList
 * @author Simon Pigot
 */
function(Backbone, _, Status, handlebars, Handlebars, downloadURL, ParamView,
DownloadView) {

/** 
 * @constructor
 * @augments Backbone.View
 */
 var StatusView = Backbone.View.extend({

/**
 * Handlebars template - passed through RequireJS as tpl/ConfirmView.hbs
 */
 	template: handlebars,

/**
 * Initialize the view. Register some Handlebars helpers and crank up the
 * automated refresh of the status data table.
 */
	initialize: function () {
		'use strict';
		_.bindAll(this, 'render');

    // register a template helper to decide whether to display percentage
    Handlebars.registerHelper('showPercent', function (value, options) {
      var percent = parseInt(value);
      if (!isNaN(percent)) {
        if (percent > 0.0) { // Currently 0.0, but could be other threshold
          return options.fn(this);
        }
      }
      return options.inverse(this);
    });

    // register a template helper to decide whether to display progress bar
    Handlebars.registerHelper('inProgress', function (message, options) {
      if (message == "in-progress") {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    // register a template helper to list the top 5 messages
    // as table rows
    Handlebars.registerHelper('list', function(items, options) {
      var out = "";
      var len = items.length;
      if (len > 5) len = 5; // confine to 5 messages - FIXME: Set to use global 
                            // variable defined by interface
      for(var i=0, l=len; i<l; i++) {
        out += options.fn(items[i]);
      }
      return out;
    });

    this.focusPreventsUpdate = false;

    var that = this;
    // Refresh status regularly
    setInterval(function() {
      if ((that.selectedModelRuns.length <= 0) &&   // if no selections made
          ($("div.popover-content").length <= 0) && // if no popovers displayed
          (!that.focusPreventsUpdate)) {            // focus does not prevent
          that.refreshStatus();
      }
    }, 25000);
	},  

/**
 * U/I events relating to controls in the status data table. Note the general 
 * mouseover event handler that blocks updates to the status data table.
 */
	events: {
	    'click .statusColumn': 'clickStatusColumn',
      'click .refreshStatus': 'clickRefreshStatus',
      'click .downloadButton': 'clickDownloadButton',
      'click .statusCheck': 'clickStatusCheck',
      'click .selectAll': 'clickSelectAll',
      'click .unselectAll': 'clickUnselectAll',
      'mouseover  .blocker': 'blockUpdate',
      'mouseout  .blocker': 'unblockUpdate'
	},

/**
 * When the mouse is over an element that has the blocker css class prevent   
 * automated update of the status data table from the server.
 */
  blockUpdate: function(ev) {
    'use strict';
    this.focusPreventsUpdate = true;
  },

/**
 * When the mouse leaves an element that has the blocker css class   
 * automated update of the status data table is enabled from the server.
 */
  unblockUpdate: function(ev) {
    'use strict';
    this.focusPreventsUpdate = false;
  },

/**
 * Render the view. Before rendering, check for an existing status datatable. 
 * If present, remove it and any bootstrap popovers and clickovers. 
 * After rendering the template in 
 * tpl/StatusView.hbs, create a status datatable on the model
 * runs obtained from the server, attach bootstrap popovers and clickovers as
 * required.
 */
  render: function () { 
    'use strict';

    if (this.statusDataTable) { // clean it up for new data
      _.each(this.statusDataTable.fnGetNodes(),function(node) {
        var pop = $(node).find('[data-toggle="clickover"]');
        _.each(pop, function(n) {
          $(n).clickover('hide');
          $(n).remove();
        });
        pop = $(node).find('[data-toggle="popover"]');
        _.each(pop, function(n) {
          $(n).popover('hide').popover('disable');
          $(n).remove();
        });
      });
      this.statusDataTable.fnDestroy();
    }

    $(this.el).empty();
    $(this.el).append(this.template({run: this.model.toJSON()}));

    // add jquery datatables to status list table
		this.statusDataTable = $('#statusTable').dataTable({
        "bStateSave": true,
        "aaSorting" : [[0,'desc']],
        "aoColumnDefs": [ { 'bSortable': false, 'aTargets': [ 2, 9 ] } ],
				"oLanguage": {
            "sLengthMenu": "_MENU_ model runs per page",
            "sZeroRecords": "<strong>Nothing found</strong>",
            "sInfo": "Showing <strong>_START_</strong> to <strong>_END_</strong> of <strong>_TOTAL_</strong> model runs",
            "sInfoEmpty": "Showing 0 to 0 of 0 jobs",
            "sInfoFiltered": "(filtered from <strong>_MAX_</strong> total model runs)"
        }
		});

    // initialize record of which columns are visible from statusTable
    var cols = this.statusDataTable.fnSettings().aoColumns;
    for (var i = 0; i < cols.length; i++) {
      $(this.el).find('input[name="chk'+i+'"]').prop('checked', cols[i].bVisible);
    }

    // activate message popovers for each status column
		_.each(this.statusDataTable.fnGetNodes(),function(node) {

      // do popovers
      var pop = $(node).find('[data-toggle="popover"]');
      _.each(pop, function(n) {
        var divid = $(n).attr('data-div-id');
        if (divid) { // normal popup using div built by template
          $(n).popover({
            html: true,
            content: function() {
              return $(node).find('div[data-div="'+divid+'"]').html();
            }
          });
        }
      });

      // do clickovers
			pop = $(node).find('[data-toggle="clickover"]');
      _.each(pop, function(n) {
        var divid = $(n).attr('data-div'),
            getRun = $(n).attr('data-getrun');
        
        if (divid) { // normal clickover using div built by template
          $(n).clickover({
            onShown: function() {
              var content = $(node).find('div[data-div="'+divid+'"]').html();
              $("div.clickover").find("div.popover-content").html(content);
              var that = this;
              setInterval(function() {
                that.resetPosition();
              },200);
            }
          });
        } else if (getRun) { // clickover that gets info for a particular model
          $(n).clickover({
            onShown: function() {
              $("div.clickover").find("div.popover-content").html('<div id="params'+getRun+'">Loading....</div>');
              var stat = new Status();
              stat.set('runid', getRun);
              var paramView = new ParamView({model: stat, theId: '#params'+getRun});
              paramView.render(); // content will be added to div when ready
              var that = this;
              setInterval(function() {
                that.resetPosition();
              },200);

            }
          });
        }
      });
    });

    return this;
  },

/**
 * When the refresh status icon is clicked, manually update the status   
 * data table.
 */
  clickRefreshStatus: function() {
  	'use strict';
    this.refreshStatus();
  },

/**
 * When a download button is clicked (in the status column of the data table)
 * render {@link module:views/DownloadView} in a bootstrap modal window.
 */
  clickDownloadButton: function(ev) {
    var par = $(ev.currentTarget).attr('data-id'),
        that = this;
    if (par) {
      var stat = new Status();
      stat.set('runid',par);
      stat.fetch({success: function(resp) {
        var url = resp.get('url');
        if (url.length == 1) {
          downloadURL(url[0]);
        } else if (url.length > 1) {
          var downloadView = new DownloadView({model: {downloads: url}});
          downloadView.once({
            'close'    : function() { $('#downloadModal').modal('hide'); downloadView.remove(); downloadView.unbind(); }
          });
          $('#downloadModal').empty().append(downloadView.render().el);
          $('#downloadModal').modal({
            backdrop: 'static',
            keyboard: false
          });
        } else {
          var mess = 'Download package not available for this run.';
          if (resp.get('message').length > 0) {
            mess += " Message returned was "+resp.get('message');
          }
          that.parent.alertmessage('failed', mess);
        }
      }});
    }
  },

/**
 * When any cell in the status data table is clicked, find the row and thus
 * the model run id, then highlight the row as selected and add the run id to
 * the list of selected runs.
 */
	clickStatusColumn: function(ev) {
  	'use strict';
		var par = $(ev.currentTarget).parent('tr');
		if (par) {
			var id = par.find('.runid').text();
			var selected = this.selectedModelRuns;
      if (!(ev.shiftKey)) selected.reset();
			_.each(this.statusDataTable.fnGetNodes(),function(node) {
				var n = $(node);
        var thisId = n.find('.runid').text();
				if (thisId === id) {
					if (n.hasClass('highlight')) {
						n.removeClass('highlight');
            selected.remove(selected.findWhere({'runid': id}));
					} else {
						n.addClass('highlight');
            var stat = new Status();
            stat.set('runid',id);
						selected.add(stat);
					}
				} else if (!(ev.shiftKey)) {
					n.removeClass('highlight');
          selected.remove(selected.findWhere({'runid': thisId}));
				}
			});
		}
	},

/**
 * When select all button is clicked, traverse the status data table and select
 * all the models, adding their run ids to the list of selected runs.
 */
  clickSelectAll: function(ev) {
	  var selected = this.selectedModelRuns;
    selected.reset();
		_.each(this.statusDataTable.fnGetNodes(),function(node) {
      var n = $(node);
      n.addClass('highlight');
      var id = n.find('.runid').text();
      var stat = new Status();
      stat.set('runid',id);
      selected.add(stat);
    });
  },

/**
 * When unselect all button is clicked, traverse the status data table and
 * unselect all the models, removing their run ids from the list of 
 * selected runs.
 */
  clickUnselectAll: function(ev) {
	  var selected = this.selectedModelRuns;
    selected.reset();
		_.each(this.statusDataTable.fnGetNodes(),function(node) {
			$(node).removeClass('highlight');
    });
  },

/**
 * When one of the status column checkboxes is checked/unchecked, hide/show
 * the appropriate status column in the status data table.
 */
  clickStatusCheck: function(ev) {
    // name attribute of checkbox for status column is chk<integer> eg. chk0
    var columnNo = $(ev.currentTarget).attr('name').substring(3);
    this.statusDataTable.fnSetColumnVis(columnNo, $(ev.currentTarget).is(':checked'));
  },

/**
 * Force refresh of the status data table. This is done simply by rendering
 * the view again after successful fetch of the model runs from the server.
 * See {@link module:views/StatusView~render}.
 */
  refreshStatus: function() {
    var that = this;
    this.model.fetch({success: function() {
      that.render();
      that.selectedModelRuns.reset(); // remove any selected models
    }});
  },
 });

 return StatusView;

});
