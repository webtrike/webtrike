from common import *

"""
This file should contain settings relevant to a development
environment, for example relating to debug toolbars, or packages only
installed in a development environment, or the development database.

The above import line MUST be left as-is!
"""

DEBUG = True
TEMPLATE_DEBUG = True
PIPELINE = False

INSTALLED_APPS += (
    'django_extensions',
    'django_nose',
)

# Nose integration for testing:
TEST_RUNNER = 'django_nose.NoseTestSuiteRunner'

DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': 'your_site', # SITE_NAME,
        'USER': 'your_user',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

##################### Cache Over-rides: file-based for prod, dummy for dev:
CACHES.update({
    'rcf': {
      'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    },
    'dmf': {
      'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }

    #'rcf': {
    #    'BACKEND': 'django.core.cache.backends.filebased.FileBasedCache',
    #    'LOCATION': '/tmp/marvl/rcf',
    #    'TIMEOUT': 24 * 60 * 60 # 1 day
    #},
    #'dmf': {
    #    'BACKEND': 'django.core.cache.backends.filebased.FileBasedCache',
    #    'LOCATION': '/tmp/marvl/dmf',
    #    'TIMEOUT': 24 * 60 * 60 # 1 day
    #}
})
#####################
## Settings for the Trike RCF+DMF interface layer:
#####################
# The fully-qualified name of the interface class for the DMF:
TRIKE_DMF_INTERFACE = 'apps.webtrike.comms.SocketComms'
# Constructor arguments for the DMF interface class, as a list (iterable):
TRIKE_DMF_INTERFACE_ARGS = ('your-machine.yourdomain.com', 20059)

# The fully-qualified name of the interface class for the RCF:
TRIKE_RCF_INTERFACE = 'apps.webtrike.comms.SocketComms'
# Constructor arguments for the RCF interface class, as a list (iterable):
TRIKE_RCF_INTERFACE_ARGS = ('your-machine.yourdomain.com', 20098)

### Can use these settings for offline testing:
# TRIKE_DMF_INTERFACE = 'apps.webtrike.comms.LookupMockComms'
# TRIKE_DMF_INTERFACE_ARGS = ('dmf.json',)
# TRIKE_RCF_INTERFACE = 'apps.webtrike.comms.LookupMockComms'
# TRIKE_RCF_INTERFACE_ARGS = ('rcf.json',)

########## GEOSERVER CONFIGURATION
GEOSERVER_URL = "http://localhost:8080/geoserver/"
GEOSERVER_LAYER_NAMESPACE = 'topp'
GEOSERVER_LAYER_DATASTORE = 'postgis_grids'
GEOSERVER_REST_URL = '{}rest/'.format(GEOSERVER_URL)
GEOSERVER_LAYER_POST_URL = '{}workspaces/{}/datastores/{}/featuretypes/'.format(GEOSERVER_REST_URL,GEOSERVER_LAYER_NAMESPACE,GEOSERVER_LAYER_DATASTORE)
GEOSERVER_LAYER_WMS = "{}{}/wms".format(GEOSERVER_URL,GEOSERVER_LAYER_NAMESPACE)
GEOSERVER_USER = 'admin'
GEOSERVER_PASSWORD = 'geoserver'
########## END GEOSERVER CONFIGURATION
