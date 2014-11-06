# Introduction

This is a client-server for implementing a web interface to
configuring, running, monitoring model runs. The initial target for this 
web interface is the TRIKE model control system. The idea behind this open
source release is to allow other model control systems to be used.

The server component is implemented on top of the Django 1.5
framework, although it is not really an idiomatic Django project: in
particular, instead of using the Django ORM we implement a similar
interface for simplifying interaction with Trike itself.

The server ideally just provides a simplified interface to Trike
itself, and basic management and coordination functionality: the bulk
of the application is implemented in javascript.

# Project Layout

Project layout and management borrows from the following links:

* [http://www.deploydjango.com/django\_project\_structure/index.html](http://www.deploydjango.com/django_project_structure/index.html)
* [http://rdegges.com/the-perfect-django-settings-file](http://rdegges.com/the-perfect-django-settings-file)
* [http://justcramer.com/2011/01/13/settings-in-django/](http://justcramer.com/2011/01/13/settings-in-django/)

## Server

The project/main app is `webtrike/`.  This just contains settings, and
the root URL configuration.

All other apps and helper modules live in `apps/webtrike` (and should be
imported as `apps.webtrike.rcf.cmds`, etc).  Note, most Django documentation
and tutorials tend to assume that each app is in the top-level (or a
sub-directory of the project directory, if you're reading older docs).
This has minor implications for testing; see below.

Global templates, and over-rides, are in the top-level `templates/`
directory.  

## Client (Browser)

All browser assets are contained in `assets/webtrike`.  The directory
`static/` is configured as Django's `STATIC_ROOT`, which is where the
`collectstatic` command will place everything.  Note though if you see
`static/` in the directory, remember this is non-versioned and should
be considered read-only.

This has the following sub-layout:

* `less/`: By default, we use [LessCSS](http://lesscss.org/) for all
  styling.  This is actually just
  [Twitter Bootstrap](http://getbootstrap.com) in uncompiled form (so
  you have access to its variables), plus a custom file for anything we
  need to style ourselves (`marvl.less`).
* `css/`: This contains the plain CSS for any third-party components
  included (such as OpenLayers)
* `img/`: Any image assets.
* `js/`: All javascript.

The javascript sub-directory is further structured:

* `libs/`: This contains (mainly third-party) libraries such as
  requirejs, Backbone, jquery, etc.
* `models/`: Contains all Backbone models (including collections).
* `views/`: Contains all Backbone views and routers.
* `tpl/`: All javascript templates; we are just using
  [Handlebars templates](http://handlebarsjs.com)

The top-level file `main.js` is the top-level file loaded by
requirejs.  Note, we use a custom build of OpenLayers; the file
`ol-build.cfg` can be used to create another, for example if you need
to use another component that isn't already included.

Note that compilation of assets (lesscss, for example) is done
automatically by
[django-pipeline](http://django-pipeline.readthedocs.org/en/latest/).

## Miscellaneous

* `requirements/`: Python dependencies, in the format used by
  [pip](http://www.pip-installer.org/).  You will want to install via
  `pip install -r requirements/dev.txt` (or `.../prod.txt`); note that
  most requirements are actually specified in `common.txt`.  For
  convenience there is also a top-level `requirements.txt` file that
  installs the production requirements.
* `assets/webtrike/jsdoc/`: Documentation relating to the JS interface.
* `bin/`: A few archives, scripts, etc.

# Technologies and Libraries

WebTRIKE utilises quite a lot
of third-party code.  This has all been chosen to be, where possible,
a modern consensus choice with a strong community in order to minimise
risk.

## Server

As already mentioned, the server is built on
[Django](https://www.djangoproject.com/).  Given that the server is
currently fairly light-weight, Django might almost be over-kill.
However, django has excellent documentation,
and will easily grow if and as necessary.

[Django-pipeline](http://django-pipeline.readthedocs.org/en/latest/)
is used to manage static assets; this can include compilation of
LessCSS files, concatenation and minification of CSS, cache-busting
renaming (including updating references), etc.

## Client

Two main technologies need to be understood to navigate your way
around the interface: [Backbone](http://backbonejs.org/), and
[RequireJS](http://requirejs.org/).

### Backbone

Backbone provides a very lightweight and flexible ("un-opinionated")
MVC framework for Javascript.  It is well-documented, but don't be
afraid to dive into the source if you're ever unclear how something
works; it's terse, but very readable, and quite small.  There is also
a wealth of community tutorials, plugins, etc.  One slight caution is
because it is so flexible it can sometimes get confusing when multiple
tutorials all have a different approach.  Another issue is that at
scale it can get difficult to manage, memory leaks become a problem,
etc.  

A "view" in Backbone is actually a fairly lightweight concept; it
essentially just manages a particular DOM element, and there are a few
conventions around implementing them, but ultimately you have as much
flexibility as you need. One convention we've adopted to standardize the way
in which templates are displayed is the through the use of handlebars 
templates, as previously mentioned.

### RequireJS

RequireJS is an implementation of **AMD**, or Asynchronous Model
Definition.  This is a means of defining self-contained javascript
modules, in terms of their dependencies.  When a module is requested,
RequireJS will ensure that its dependencies have first been loaded.
Each module is a separate file, which helps keep things manageable in
terms of size.  If necessary this can also be used with an optimiser
(called [`r.js`](http://requirejs.org/docs/optimization.html)), which
will concatenate files, and ignore an unused files.  You will notice
that the main page just has a single script tag, which loads requirejs
and specifies (via the `data-main` attribute) the initial file to
load.  In our case this is `main.js` (see above), which simply
configures requirejs and loads the initial module.

Requirejs is also extendable via plugins; we only make use of `tpl.js`
(which itself uses `text.js`), which will pre-compile templates when
they are specified as dependencies.

### Miscellaneous

Backbone depends on [`underscore.js`](http://underscorejs.org/) and
[`jquery`](http://jquery.com/) (although jquery is not used much
directly; please avoid the temptation yourself, as it can easily lead
to spaghetti code!).  We actually use the
[`lodash`](http://lodash.com/) implementation of the underscore API.

We use [`moment.js`](http://momentjs.com/) for date/time handling, and
[OpenLayers](http://openlayers.org/) for map rendering and
interaction. We also use the bootstrap javascript components and 
[jquery datatables](https://datatables.net/) to manage the table of model 
runs shown in the main view.

### Developer Documentation

Developer documentation for the webtrike client interface uses [jsdoc3](https://github.com/jsdoc3/jsdoc). The documentation can be built using the script `builddocs.sh` and the `jsdoc.conf` file in the directory `assets/webtrike`.

A [`README.md`](https://github.com/webtrike/webtrike/tree/master/assets/webtrike) in the directory `assets/webtrike` gives and overview of the client interface and more details on the technologies that it uses.

## Setup and Installation

Installation is (mostly) done from `server/requirements.txt`, which
sources additional files in `server/requirements/` (starting with
`common.txt`).

Note that the default `requirements.txt` installs the production
dependencies; you probably want to install `requirements/dev.txt`
instead for development.  Most dependencies will be specified in
`requirements/common.txt` anyway.

### Server Integration

WebTRIKE uses the traditional `mod_wsgi`-and-Apache approach.  This is
reliable and will work, but if you have the flexibility you might want
to investigate using a separate evented WSGI application server, and
just use the web server to reverse-proxy to it.  The standard
application server in this case is [gunicorn](http://gunicorn.org/).
The Django docs have sections on
[deployment in general](https://docs.djangoproject.com/en/1.5/howto/deployment/),
[specifically via wsgi](https://docs.djangoproject.com/en/1.5/howto/deployment/wsgi/),
and
[using gunicorn](https://docs.djangoproject.com/en/1.5/howto/deployment/wsgi/gunicorn/).
One advantage of the gunicorn approach is that if you need to restart
you don't need to touch your web server; additionally, once you
no-longer need `mod_wsgi` you can use [nginx](http://nginx.org/)
instead of Apache, which is leaner and more efficient, and
(personally) easier to configure as well.

Regardless of the approach used, remember to make sure the server is
serving all static content, not Django!

# Development Requirements

You will need to have installed:

* Python
* [Virtualenv](http://www.virtualenv.org/) (for bootstrapping)
* The lessc compiler for [LessCSS](http://lesscss.org/), from
  node.js/npm.  Make sure you have a recent version of of node/npm
  first (your linux distribution may have an old one), as older
  versions may not install lessc correctly.

## Virtualenv

[Virtualenv](http://www.virtualenv.org/en/latest/) is used for
repeatable and testable python-based deployments.  In a nutshell, this
simply creates a local directory with its own python environment.  The
advantages of this is you don't need root permissions to install
anything, if anything goes wrong you can simply delete it and start
again, and of course it makes the installation process much easier to
test.

## Django Settings

We use a settings *module* instead of the traditional single file
(although, there is a *lot* of discussion about the best to handle
Django settings!).  You should use `webtrike.settings.dev` during
development and `webtrike.settings.prod` for production; both of these
actually just import `webtrike.settings.common` which is where the
majority of the configuration lives, but this should never be used
directly.

Note that you will need to specify these (or set the
`DJANGO_SETTINGS_MODULE` environment variable) every time you run a
`manage.py` command; for example `manage.py runserver_plus 0.0.0.0:8000
--threaded --settings=webtrike.settings.dev` (which itself assumes that you have
initialised and activated the virtualenv).  Setting the variable is
probably easier.

## Testing

[Django-nose](http://pypi.python.org/pypi/django-nose) is installed in
the dev settings, and should be mostly transparent.  Because of the
project layout though there is one point to be aware of: you need to
be a bit more explicit when running just one app's tests.  That is,
by example, you need to run
    ./manage.py test --settings=webtrike.settings.dev apps.trike.tests
not
    ./manage.py test --settings=webtrike.settings.dev apps.trike
as you ordinarily would.  You can however run all apps for example
with
    ./manage.py test --settings=webtrike.settings.dev apps
