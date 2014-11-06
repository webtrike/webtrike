from os.path import abspath, basename, dirname, join, normpath


########## PATH CONFIGURATION
# Absolute filesystem path to this Django project directory.
DJANGO_ROOT = dirname(dirname(abspath(__file__)))

# Site name.
SITE_NAME = basename(DJANGO_ROOT)

DJANGO_ROOT = dirname(DJANGO_ROOT)

# Absolute filesystem path to the top-level project folder.
SITE_ROOT = DJANGO_ROOT

# Absolute filesystem path to the secret file which holds this project's
# SECRET_KEY. Will be auto-generated the first time this file is interpreted.
SECRET_FILE = normpath(join(SITE_ROOT, 'SECRET'))
########## END PATH CONFIGURATION


########## DEBUG CONFIGURATION
# Disable debugging by default.
DEBUG = False
TEMPLATE_DEBUG = DEBUG
########## END DEBUG CONFIGURATION


########## MANAGER CONFIGURATION
# Admin and managers for this project. These people receive private site
# alerts.
ADMINS = (
    ('Simon Pigot', 'simon.pigot@csiro.au'),
)

MANAGERS = ADMINS
########## END MANAGER CONFIGURATION

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3', # Add 'postgresql_psycopg2', 'mysql', 'sqlite3' or 'oracle'.
        'NAME': '%s.db' % SITE_NAME,     # Or path to database file if using sqlite3.
        'USER': '',                      # Not used with sqlite3.
        'PASSWORD': '',                  # Not used with sqlite3.
        'HOST': '',                      # Set to empty string for localhost. Not used with sqlite3.
        'PORT': '',                      # Set to empty string for default. Not used with sqlite3.
    }
}

########## GENERAL CONFIGURATION
# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# In a Windows environment this must be set to your system time zone.
TIME_ZONE = 'Australia/Hobart'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-gb'

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale.
USE_L10N = False

# If you set this to False, Django will not use timezone-aware datetimes.
USE_TZ = True

# Django (since 1.5) requires this in non-debug mode:
ALLOWED_HOSTS = [
    'localhost',
    '.sf.utas.edu.au',
    '.csiro.au',
    '.marvl.org.au'
]

# Find out real host of user when running behind apache as proxy
USE_X_FORWARDED_HOST = True
########## END GENERAL CONFIGURATION


########## MEDIA CONFIGURATION
# Absolute filesystem path to the directory that will hold user-uploaded files.
MEDIA_ROOT = normpath(join(SITE_ROOT, 'media'))

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash.
MEDIA_URL = 'media/'
########## END MEDIA CONFIGURATION


########## STATIC FILE CONFIGURATION
# Absolute path to the directory static files should be collected to. Don't put
# anything in this directory yourself; store your static files in apps' static/
# subdirectories and in STATICFILES_DIRS.
STATIC_ROOT = normpath(join(SITE_ROOT, 'static'))

# URL prefix for static files.
STATIC_URL = 'static/'

# URL prefix for admin static files -- CSS, JavaScript and images.
ADMIN_MEDIA_PREFIX = 'static/admin/'

# Additional locations of static files.
STATICFILES_DIRS = (
    normpath(join(SITE_ROOT, 'assets')),
)

STATICFILES_STORAGE = 'pipeline.storage.PipelineCachedStorage'

# List of finder classes that know how to find static files in various
# locations.
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    #'django.contrib.staticfiles.finders.DefaultStorageFinder',
)
########## END STATIC FILE CONFIGURATION

########## PIPELINE CONFIGURATION
PIPELINE_CSS = {
    'marvl_css': {
        'source_filenames': (
            'less/bootstrap.less',
            'css/openlayers/style.css',
            'css/jqueryui/jquery-ui.css',
            'css/daterangepicker.css',
            'less/marvl.less',
        ),
        'output_filename': 'css/marvl.css'
    }
}

PIPELINE_COMPILERS = (
    'pipeline.compilers.less.LessCompiler',
)
PIPELINE_LESS_BINARY = '/usr/bin/lessc'

PIPELINE_JS_COMPRESSOR = None
PIPELINE_CSS_COMPRESSOR = None
PIPELINE_YUI_BINARY = 'java -jar {0}'.format(join(SITE_ROOT, 'bin', 'yuicompressor-2.4.7.jar'))
PIPELINE_YUI_JS_ARGUMENTS = ''
PIPELINE_YUI_CSS_ARGUMENTS = ''
########## END PIPELINE CONFIGURATION

########## TEMPLATE CONFIGURATION
# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
#     'django.template.loaders.eggs.Loader',
)

# Directories to search when loading templates.
TEMPLATE_DIRS = (
    normpath(join(DJANGO_ROOT, 'templates')),
)
########## END TEMPLATE CONFIGURATION

########## MIDDLEWARE CONFIGURATION
MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    # Uncomment the next line for simple clickjacking protection:
    # 'django.middleware.clickjacking.XFrameOptionsMiddleware',
)
########## END MIDDLEWARE CONFIGURATION

########## TEMPLATE PROCESSOR CONFIGURATION
TEMPLATE_CONTEXT_PROCESSORS = (
    'django.contrib.auth.context_processors.auth',
    'django.core.context_processors.debug',
    'django.core.context_processors.i18n',
    'django.core.context_processors.media',
    'django.core.context_processors.static',
    'django.core.context_processors.tz',
    'django.contrib.messages.context_processors.messages',
    # This adds a request variable to each template:
    'django.core.context_processors.request',
)
########## END TEMPLATE PROCESSOR CONFIGURATION

########## SERVER CONFIGURATION
ROOT_URLCONF = '%s.urls' % SITE_NAME

# Python dotted path to the WSGI application used by Django's runserver.
WSGI_APPLICATION = '%s.wsgi.application' % SITE_NAME
########## END SERVER CONFIGURATION

########## APP CONFIGURATION
INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.gis',
    # Uncomment the next line to enable admin documentation:
    # 'django.contrib.admindocs',

#    'south',
#    'pipeline',
#    'djcelery',

    # Uncomment the next line to enable the admin:
#    'django.contrib.admin',
    # Uncomment the next line to enable admin documentation:
    # 'django.contrib.admindocs',
#    'django_forms_bootstrap',

    # marvl apps
    'apps.webtrike.trike',
    'apps.webtrike.dmf',
    # webplum apps:
#    'apps.webplum.grids',               # Grid models, views, utilities
    # generic apps:
#    'apps.auth',              # plugs in to account to enable email-usernames
)
########## END APP CONFIGURATION

########## CACHE CONFIGURATION
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'default-trike'
    },
    'rcf': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'rcf-trike'
    },
    'dmf': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'dmf-trike'
    },
    # Want to override staticfiles, so a restart will clear it:
    'staticfiles': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'staticfiles-override'
    }
}
########## END CACHE CONFIGURATION

########## LOGGING CONFIGURATION
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse'
        }
    },
    'formatters': {
        'verbose': {
            'format': '%(levelname)s %(asctime)s %(module)s %(process)d %(thread)d %(message)s'
        },
        'simple': {
            'format': '%(levelname)s %(name)s:%(funcName)s %(message)s'
        },
    },
    'handlers': {
        'console':{
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple'
        },
        'mail_admins': {
            'level': 'ERROR',
            'filters': ['require_debug_false'],
            'class': 'django.utils.log.AdminEmailHandler'
        }
    },
    'loggers': {
        'django.request': {
            'handlers': ['mail_admins'],
            'level': 'ERROR',
            'propagate': True,
        },
        'apps': {
            'level': 'DEBUG',
            'handlers': ['console'],
            'propagate': True
        }
    }
}
########## END LOGGING CONFIGURATION

########## GRIDGEN CONFIGURATION
GRIDGEN_EXE = join(DJANGO_ROOT, 'bin', 'gridgen')
########## END GRIDGEN CONFIGURATION

########## BATHYMETRY CONFIGURATION
GRIDBATHY_EXE = join(DJANGO_ROOT, 'bin', 'gridbathy')
DATA_DIR = join(DJANGO_ROOT, 'data')
COASTLINE_DIR = join(DATA_DIR, 'ful_cst')
BATHY_DATA = join(DATA_DIR, 'bath_ga_2012.nc')
########## END BATHYMETRY CONFIGURATION

########## KEY CONFIGURATION
# Try to load the SECRET_KEY from our SECRET_FILE. If that fails, then generate
# a random SECRET_KEY and save it into our SECRET_FILE for future loading. If
# everything fails, then just raise an exception.
try:
    SECRET_KEY = open(SECRET_FILE).read().strip()
except IOError:
    try:
        with open(SECRET_FILE, 'w') as f:
            from random import choice
            SECRET_KEY = ''.join([choice('abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)')
                                  for i in range(50)])
            f.write(SECRET_KEY)
    except IOError:
        raise Exception('Cannot open file `%s` for writing.' % SECRET_FILE)
########## END KEY CONFIGURATION
