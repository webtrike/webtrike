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
define(['backbone', 'underscore', 'jquery', 'hb!webtrike/tpl/WizardView.hbs'],

/**
 * This is the core Wizard workflow view. It renders 
 * using the template tpl/WizardView.hbs. 
 * which provides the user with controls to navigate through an ordered set
 * of views using either 'Previous'/'Next' buttons in a sequence or 
 * directly by selecting the required view in the sequence from a tab bar.
 * The ordered set of views are built and held in a linked list in 
 * {@link module:views/WizardView~WizardViewList}. The view has a publish 
 * pattern interface which amongst other things, ensures that WizardView is a 
 * singleton.
 * 
 * @exports views/WizardView
 * @requires tpl/WizardView.hbs
 *
 * Taken from ideas and code by Athens Holloway 
 * {@link https://twitter.com/athensholloway/status/177510164398739456}.
 */
function(Backbone, _, $, handlebars) {


  /**
   * WizardViewList handles the linked list of Backbone views that make up the
   * current workflow. WizardViewList is used by 
   * {@link module:views/WizardView~WizardView}. 
   *
   * @constructor
   */
  function WizardViewList() {

    /**
     * Node in the linked list
     */
 		var Node = function (view) {
	    'use strict';
			var _next = null; //reference next node
			var _previous = null; //reference previous node
			var _view = view.ref; //reference current view
			var _tab = view.tab;
			return {
				setPrevious: function (node) { _previous = node; return this; }, 
				getPrevious: function () { return _previous; },
				setNext: function (node) { _next = node; return this; },
				getNext: function () { return _next; },
				getView: function () { return _view; },
				getTab: function () { return _tab; }
			};
		};

    /**
     * Dump the list (for debugging purposes only)
     */
    var dumpList = function(start) {
	    'use strict';
        var node = _head;
        var i = 1;
        while (node !== null) {
          console.log(start+'          : '+node.getTab()+': index: '+i); 
          if (_current.getTab() === node.getTab()) console.log('DING');
          i += 1;
          node = node.getNext();
        }
    };

		var _head = null;
		var _tail = null;
		var _current = null;

    /**
     * Published interface
     * @namespace
     */
    var WizardViewListInterface = {
      /**
       * First view in list
       * @inner
       */
			first: function() { return _head; },

      /**
       * Last view in list
       * @inner
       */
			last: function() { return _tail; },

      /**
       * Advance current to next view in list
       * @inner
       */
			moveNext: function() {
				return (_current !== null) ? _current = _current.getNext() : null;
			},

      /**
       * Set current to previous view in list
       * @inner
       */
			movePrevious: function() {
				return (_current !== null) ? _current = _current.getPrevious() : null;
			}, 

      /**
       * Get current view
       * @inner
       */
			getCurrent: function() { return _current; },

      /**
       * Insert view into list at end
       * @inner
       */
			insertView: function(view) {
				if (_tail === null) { // list is empty (implied head is null)
					_current = _tail = _head = new Node(view);
				} else {//list has nodes                    
					_tail = _tail.setNext(new Node(view).setPrevious(_tail)).getNext();
				}
			},

      /**
       * Set current view directly
       * @inner
       */
			setCurrentByTab: function(tab) {
				var node = _head;
				while (node !== null) {
					if (node.getTab() !== tab) { node = node.getNext(); }
					else { _current = node; break; }
				}
			},

      /**
       * Remove all views from list
       * @inner
       */
      cleanViews: function() {
        if (_tail === null) return false; // nothing to do

        _current = _tail;
        while ( _current.getTab() !== _head.getTab() ) {
          var temp = _current,
              view = temp.getView();

          // Now remove, unbind and onClose the view - Why? See:
          // http://lostechies.com/derickbailey/2011/09/15/zombies-run-managing-page-transitions-in-backbone-apps/
          view.remove();
          view.unbind();
          if (view.onClose) {
            view.onClose();
          }

          // remove links
          _current = temp.getPrevious();
          _current.setNext(null);
          temp.setPrevious(null);
        }
        _tail = _current = _head;
        return true;
      }

    };

    return WizardViewListInterface;
	};

/**
 * @constructor
 * @augments Backbone.View
 */

  var WizardView = Backbone.View.extend({

/**
 * Handlebars template - passed through RequireJS as tpl/WizardView.hbs
 */
				template: handlebars,

/**
 * Initialize the view. 
 */
        initialize: function () {
            _.bindAll(this, 'render', 'movePrevious', 'moveNext', 'insertView',  'moveToTab');             
            $(this.el).empty();
            $(this.el).append(this.template());            
            this.wizardViewTabs = $(this.el).find('#wizard-view-tabs');            
            this.wizardViewContainer = $(this.el).find('#wizard-view-container');            
            this.WizardViewList = new WizardViewList();
        },    

/**
 * U/I events relating to U/I elements displayed in the WizardView.
 */
        events: {            
            "click .btn-previousView": "movePrevious",
            "click .btn-nextView": "moveNext",
            "click .nav-tabs a": "moveToTab",
            "click .closeModal": "close"
        },

/**
 * Called when user attempts to close the WizardView - in reality this
 * just triggers a closeModal event that listeners can listen for and act
 * upon.
 */
        close: function(ev) {
            this.trigger("closeModal", $(ev.currentTarget));
        },

/**
 * Render the WizardView. Select current view from WizardViewList and render it.
 * Do some simple checks to decide whether to display 'Previous'/'Next'
 * buttons. Don't do anything if the current view has not been set in
 * WizardViewList.
 */
        render: function () {
            var currentView = this.WizardViewList.getCurrent();            
            if (currentView !== null) {
                
                if (currentView.getNext() === null && currentView.getPrevious() !== null) {
                    $('.btn-nextView', this.el).hide();
                } else {
                    $('.btn-nextView', this.el).show();
                }
                if (currentView.getPrevious() === null) {
                    $('.btn-previousView', this.el).hide();
                } else {
                    $('.btn-previousView', this.el).show();
                }
                
                //clear the active tab css class
                this.wizardViewTabs.
                    find('li').removeClass('active');
                
                //set the active tab for the current view
                this.wizardViewTabs.
                    find('a[title=' + currentView.getTab() + ']').
                    parents('li:first').addClass('active').show();                    
                
                //show only the current view
                this.wizardViewContainer.find('.wizard-view:parent').empty();

								var domView = $(currentView.getView().render().el);
								if (currentView.getView().afterRender) {
									currentView.getView().afterRender();
								} 
                this.wizardViewContainer.append(domView);
                
            }
            return this;
        },

/**
 * Insert a view - the display tabs are updated to include the
 * title of the tab and the tab is inserted into WizardViewList.
 */
        insertView: function (view) {
            
            var tab = view.tab;
            view.tab = view.tab.replace(/\s/g, '-');            
            
            this.wizardViewTabs.
                append('<li><a href="#' + view.tab + '" title="' + view.tab + '">' + tab + '</a></li>');
            this.wizardViewTabs.
                find('a[title=' + view.tab + ']').
                parents('li:first').hide();                    
            
            this.WizardViewList.insertView(view);
        },

/**
 * Move to the previous view and render it.
 */
        movePrevious: function () {
            if (!this.currentViewReady()) return true;
            this.WizardViewList.movePrevious();
            this.render();
            return false;
        },

/**
 * Move to the next view and render it.
 */
        moveNext: function () {
            if (!this.currentViewReady()) return true;
            var that = this;
            this.updateModel(function() { 
              that.WizardViewList.moveNext();
              that.render(); 
            });
            return false;
        },

/**
 * Move directly to the name tab and render it.
 */
        moveToTab: function (e) {
            if (!this.currentViewReady()) return true;
            e = e || window.event;
            var anchor = $(e.srcElement || e.target);
            var that=this;
            this.updateModel(function() {
              that.WizardViewList.setCurrentByTab($(anchor).attr('title'));
              that.render();
            });
            return false;
        },

/**
 * Check whether the current view is ready to move next/previous or jump to
 * a different view.
 */
        currentViewReady: function () {
						return this.WizardViewList.getCurrent().getView().isReady;
        },

/**
 * Call updateModel on the current tab - usually called before moving to a
 * different view.
 */
        updateModel: function (callback) {
						this.WizardViewList.getCurrent().getView().updateModel(callback);
            //favor view update method convention to force synchronous updates
        },

/**
 * Clean out all views in WizardViewList - after that clean up the tabs part of 
 * the WizardView HTML.
 */
        cleanViews: function() {
            if (this.WizardViewList.cleanViews()) {
              var tab = this.WizardViewList.getCurrent().getTab();
              _.each(this.wizardViewTabs.find('a:not([title="'+tab+'"])'), function(item) {
                $(item).parents('li:first').remove();
              });
            }
        }
  });    

/**
 * This view is a singleton. 
 * @todo WizardViewList is really the model for this view! 
 */
  var _wizardView = null;
 
  return {
        initialize: function(wizardModel){
            _wizardView = new WizardView({model:wizardModel});
        },
        insertView: function (view) {            
            _wizardView.insertView(view);
        },
        cleanViews: function () {            
            _wizardView.cleanViews();
        },
        render: function () {
            return _wizardView.render();
        },
        destroy: function() {
            if (_wizardView) {
              _wizardView.remove();
              _wizardView.unbind();
            }
        },
        on: function(ev, cb) {
            _wizardView.on(ev, cb);
        }
  };

});

