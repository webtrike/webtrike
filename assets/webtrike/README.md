This is the web client interface to Trike. With a little modification it can be applied to any model specification and scheduling framework.

# Project Layout

* [js/main.js - Start here](module-main.html)
* js/views - Backbone Views
* js/models - Backbone Models
* js/tpl - Handlebars Templates
* js/libs - Javascript Libs
* css - Cascading Style Sheets
* img - Images/Icons required by the client interface. 

# Brief Overview

[main.js](module-main.html) sets up RequireJS, creates the basic Backbone models
[ModelSpecification](module-models_ModelSpecification.html), [Sources](module-models_Sources.html), 
connects the models together with change events and then fetches the model specification templates from the trike-django server.

After success, the [MainView](module-views_MainView.html) is created and rendered. MainView handles the main operations on a trike-model run: 'New', 'Delete', 'Abort' (and 'Edit' and 'Clone' though these are not yet enabled). It creates a sub-view called [StatusView](module-views_StatusView.html) which retrieves the current status of all models that have been submitted to Trike. 

The model specification workflow takes place when the user selects 'New' in MainView. The basic steps to create the workflow are:

* Create a [WizardView](module-views_WizardView.html)
* Push [ModelNestingView](module-views_ModelNestingView.html) into it as the first tab to show in the workflow
* Display the WizardView in a bootstrap modal window.

After the user has chosen a model:

* The model specification is examined to determine which views will be required (see [UIComponents](module-UIComponents.html)).
* The required views are added to the WizardView (eg. [GridView](module-views_GridView.html), [SliderForcingView](module-views_SliderForcingView.html))
* Last view always added to WizardView is [ConfirmView](module-views_ConfirmView.html).

The user can then navigate through these views using either 'Next'/'Previous' buttons or directly via the tab display. These controls are all handled by WizardView.

# Dependencies

* [backbone](http://backbonejs.org/)
* [lodash.underscore](http://lodash.com/) - Utility lib for backbone and generally useful
* [handlebars](http://handlebarsjs.com/) - Templating library used in backbone views
* [jquery](http://jquery.com/) -  1.9.1
* [jquery-ui](https://jqueryui.com/) - Provides widgets like sliders
* [jquery.cookie](https://github.com/carhartl/jquery-cookie) - 1.3.1 - Used to handle cookies (security token passing to django)
* [jquery-datatables](http://datatables.net) Shows and controls model run table
* [datatables-bootstrap](https://datatables.net/blog/Twitter_Bootstrap_2) - Plugin to style datatables using bootstrap2
* [bootstrap-2 + bootstrap-popover, bootstrap-tooltip](http://getbootstrap.com/2.3.2/) - Basic boostrap 2.3.2 plus JS components, bootstrap3 is now out
* [bootstrap-modal](https://github.com/jschr/bootstrap-modal) - Better and more advanced modal window handling than standard bootstrap-modal
* [bootstrapx-clickover](https://github.com/lecar-red/bootstrapx-clickover) - Advanced bootstrap popovers – these popovers can have widget contents (eg. buttons)
* [daterangepicker.js](http://www.dangrossman.info/) - bootstrap date-time range picker
* [OpenLayers](http://openlayers.org/) - Version 2.13
* [proj4js](http://download.osgeo.org/proj4js/proj4js-1.1.0.zip) - 1.0.1 – later versions don't work well with RequireJS and OpenLayers – for extended projection support in OpenLayers
* [RequireJS](http://requirejs.org/docs/download.html) - AMD
* [text](https://github.com/requirejs/text) - Used by RequireJS to load text resources
* [moment](http://momentjs.com/) - time operations
* [twix](http://icambron.github.io/twix.js/) - moment plugin for time range operations

# Server URLs and JSON Data

The webtrike-ui package has to communicate with a RESTful server side in order to receieve and send models from/to the trike (or some other) model runner software. The serverside URLs are held in assets/js/lib/config.js. The structure of the model(s) received from the server side are described in the following sections.

## Model parameter specification (Get model parameter specifications)

* JS module field containing URL: Configuration.Urls.availableModels
* Example URL: http://localhost:8000/webtrike/rcf/models/
* Http request method: GET 
* JS module that GETs this object: [js/main.js](module-main.html)
* Returns an array of JSON objects representing the models that can be parameterized and submitted by the webtrike-ui interface as a model specification. 

Example response/request body is an array of model specifications:
	
	[
		{
			"model": "mom4", 
			"name": "mom_wf"
			"description": "MOM4, relocatable model", 
			"base-date": "2000-01-01 00:00 +00", 
			"model-type": "mom4",                // not used
			"grid": 
				{
					"ni": "?",                       // nr of grid cells x-axis (integer)
					"nj": "?",                       // nr of grid cells y-axis (integer)
					"x-origin": "?",                 // longitude grid origin (decimal)
					"y-origin": "?",                 // latitude grid origin (decimal)
					"dlambda": "?",                  // grid cell x-size (decimal)
					"dphi": "?",                     // grid cell y-size (decimal)
					"rotation": "?",                 // angle (decimal)
					"type": "?"                      // geographic-rectangular, rectangular
					"requires-UI": "grid", 
					"requires-valid": "type,x-origin,y-origin,ni,nj,rotation", 
				}, 
			"temporalextent": 
				{	
					"spinup-time": "4 days", 
					"requires-UI": "temporal-extent", 
					"start-time": "?"
					"stop-time": "?", 
					"requires-valid": "start-time, stop-time, run.base-date", 
				}, 
			"forcing": {
				"requires-UI": "forcing-data-matching", 
				"requires-consolidated-provider": [
					{
						"variables": [
							{	
								"set": "?",  // forcing dataset name
								"name": "wind_u,wind_v", 
								"stream": "global-atmos", 
								"variable_key": "wind", 
								"unit": "m/s", 
								"description": "surface wind velocities"
							}, 
							{
								"set": "?",  // forcing dataset name
								"name": "salt", 
								"stream": "global-ocean", 
								"variable_key": "salinity", 
								"unit": "PSU", 
								"description": "water salinity"
							}, 
							{
								"set": "?",  // forcing dataset name
								"name": "u,v", 
								"stream": "global-ocean", 
								"variable_key": "velocity", 
								"unit": "m/s", 
								"description": "velocities of water currents"
							}, 
							{
								"set": "?",  // forcing dataset name
								"name": "eta", 
								"stream": "global-ocean", 
								"variable_key": "eta", 
								"unit": "meters", 
								"description": "sea level elevation"
							}, 
							{
								"set": "?",  // forcing dataset name
								"name": "temp", 
								"stream": "global-ocean", 
								"variable_key": "temperature", 
								"unit": "degC", 
								"description": "water temperature"
							}, 
							{
								"set": "?",  // forcing dataset name
								"name": "mslp", 
								"stream": "global-atmos", 
								"variable_key": "pressure", 
								"unit": "Pascal", 
								"description": "Mean Sea Level Pressure"
							}
					], 
					"licensed": [
						{
							"url": "blue-dmf.hba.marine.csiro.au/licences/bran3.htm", 
							"accepted": ?,  // true or false
							"dataset": "bran3"
						}
					], 
					"supportedsets":  // can be used to fill in set field in variables array
							["access-r-surface", "nrt_anal", "bran3", "ofam2-nrt", "ofam2-1-an", "ofam2-fc", "access-g-surface", "ofam2-an", "brt_anal", "foam1-an", "foam1", "access-a-surface", "ofam2-1-nrt", "ofam2-1-fc", "ncep", "ofam"]
				}, 
				......
			]
		}
	]
	

## Model parameter specification (POST model parameter specifications)

* JS module field containing URL: Configuration.Urls.manageRuns
* Example URL: http://localhost:8000/webtrike/rcf/runs/
* JS module that POSTs the model parameter specification object to this url [js/views/ConfirmView.js](module-views_ConfirmView.html)

POST model parameter specification (ie. any one of the model parameter specifications returned in the previous section) after U/I has been used to fill in the fields with "?" shown in the example response from the previous section.

## Model Run Status (GET info on All runs)

* JS module field containing URL: Configuration.Urls.manageRuns
* Example URL: http://localhost:8000/webtrike/rcf/runs/
* Http request method: GET to retrieve
* JS modules that GET this object: [js/views/StatusView.js](module-views_StatusView.js) and [js/models/StatusList.js](module-models_StatusList.html), 
* Returns an array of JSON objects describing the status the model run(s) that have been submitted. 

Example response body:

	[
		{
			"id": "575"
			"modelname": "ww3_marvl", 
			"name": "ww3 test", 
			"modelstart": "2014-05-20 06:27:19",           // model started executing
			"modelstop": "2014-05-20 06:27:19",            // model stopped executing
			"start": "2013-03-11 00:00:00",                // model temporal extent begin
			"stop": "2013-03-13 00:00:00",                 // model temporal extent end
			"message": "error",                            // status message 
			"percent": "0.0",                              // percent complete
			"messages": [																	 // all messages generated by model run
				{"importance": "significant", "text": "Cleaning up ...", "time": "2014-05-20 06:27:19"}, 
				{"importance": "significant", "text": "Skipped, 'finalize' process", "time": "2014-05-20 06:27:19"}, 
				{"importance": "significant", "text": "Finalising...", "time": "2014-05-20 06:27:19"}
			],  
		},	
		.....
	]

## Model Run Status (Specific run)

* JS module field containing URL: Configuration.Urls.manageRuns
* Example URL: http://localhost:8000/webtrike/rcf/runs/19/ (retrieve info on run 19)
* Http request method: GET
* JS modules that GET this object: [js/views/ParamView.js](module-views_ParamView.html) and [js/models/Status.js](module-models_Status.html)
* Returns a JSON object describing the parameters and status of the requested model run. 

Example response body:

	{
		"status": "error", 
		"url": [], 
		"modelparameters": 
			{
				"temporalextent": 
					{
						"spinup-time": "0 days", 
						"requires-UI": "temporal-extent", 
						"stop-time": "1 days", 
						"requires-valid": "start-time,stop-time,run.base-date", 
						"start-time": "0 days"
					}, 
				"forcing": 
					{
						"requires-UI": "forcing-data-matching", 
						"requires-consolidated-provider": [], 
						"variables": [
							{
								"set": "access-a-surface", 
								"name": "wind_u,wind_v", 
								"stream": "global-atmos", 
								"variable_key": "wind", 
								"unit": "m/s", 
								"description": "surface wind velocities"
							}, 
							{
								"set": "wavewatch3-a", 
								"name": "sig_wav_ht", 
								"stream": "global-ocean", 
								"variable_key": "wave", 
								"unit": "meters", 
								"description": "Significant Wave Height"
							}, 
							{
								"set": "wavewatch3-a", 
								"name": "mn_wav_dir", 
								"stream": "global-ocean", 
								"variable_key": "wave", 
								"unit": "deg", 
								"description": "Wave direction"
							}, 
							{
								"set": "wavewatch3-a", 
								"name": "mn_wav_per", 
								"stream": "global-ocean", 
								"variable_key": "wave", 
								"unit": "sec", 
								"description": "Wave period"
							}
						], 
						"licensed": [], 
						"supportedsets": ["access-r-surface", "wavewatch3-a", "wavewatch3-g", "access-a-surface", "wavewatch3-r", "access-g-surface", "paccsap-wavewatch3-g", "paccsap-wavewatch3-a", "paccsap-wavewatch3-r", "ncep"]
					}, 
				"description": "twss run at 2014-09-02T21:22:31.682810", 
				"workflow": "true", 
				"default": "false", 
				"model-type": "swan", 
				"base-date": "2012-01-09 00:00 +00", 
				"grid": 
					{
						"ni": "66", 
						"nj": "83", 
						"right": "115.71566708789", 
						"y-origin": "-33.3611", 
						"projection": "proj|stere,lon_0|115.3652,lat_0|-33.3611", 
						"bottom": "-33.3611", 
						"top": "-32.98641418844001", 
						"dy": "500", 
						"requires-UI": "grid", 
						"max-cell-size": "1000", 
						"x-origin": "115.3611", 
						"dx": "500", 
						"projection-proj4": "+proj=stere+lon_0=115.3611+lat_0=-33.3611", 
						"rotation": "0.0", 
						"type": "rectangular", 
						"left": "115.3611"
					}
				}
			}
		"runid": "578", 
		"message": "Cannot access/find output file /home/blue-quad/trike/instances/trial/workspace/swan/swan_marvl/85/archive_swan-85.tgz"   // last message generated
	}

## Model Run Operations (Edit, Delete, Abort)

* JS module field containing URL: Configuration.Urls.manageRuns
* Example URLs: http://localhost:8000/webtrike/rcf/runs/
* Http request method: POST to submit operation and run ids to apply it to
* JS module that POSTs operation and job ids [js/views/MainView.js](module-views_MainView.html)

Example of POST request is:

	{
		operation: 'delete',     // edit, delete, abort
		runids: [ .... array of job ids (integer) .... ]
	}

## Request metadata about forcing datasets that can provide variables for a particular model

* JS module field containing URL: Configuration.Urls.modelProviders
* Example URLs: http://localhost:8000/webtrike/providers/mom_wf/
* Http request method: GET
* JS module that GETs dataset [js/views/GridView.js](module-views_GridView.html)

Example of response is an array of forcing datasets (these are filtered by [js/views/SliderForcingView.js](module-views_SliderForcingView.js) to display only those forcing datasets that can supply the variables required by the model and which have a bounding box that contains the specified grid):

	[
		{
			"dataset-id": "1da43560-dd5c-4084-a097-fecabe7dbe66", 
			"name": "access-a", 
			"description": "ACCESS 12km Australian Regional Model",
			"data-avail": "false",                                       // ignored if false
			"stream": "global-atmos", 
			"variables": [
				{ "id": "50", "name": "mslp", "unit": "Pascal", "description": "Mean Sea Level Pressure"}, 
				{"id": "11", "name": "wind_u,wind_v", "unit": "m/s", "description": "U direction wind speed"}
			], 
			"min-lon": "0.0", 
			"min-lat": "0.0", 
			"max-lon": "0.0", 
			"max-lat": "0.0", 
			"min-time": null, 
			"max-time": null 
		}, 
		{
			"dataset-id": "2ad8d7ed-5b45-48e4-922c-0f8105af605c", 
			"name": "access-a-surface", 
			"description": "ACCESS Surface 12km Australian Regional Model",
			"data-avail": "true", 
			"stream": "global-atmos", 
			"variables": [
				{"id": "50", "name": "mslp", "unit": "Pascal", "description": "Mean Sea Level Pressure"}, 
				{"id": "11", "name": "wind_u,wind_v", "unit": "m/s", "description": "U direction wind speed"}
			], 
			"min-lon": "95.0", 
			"min-lat": "-55.0", 
			"max-lon": "169.69", 
			"max-lat": "4.730000000000004", 
			"min-time": "2010-08-04 00:00:00", 
			"max-time": "2013-05-08 18:00:00", 
		},
		.....
	]
