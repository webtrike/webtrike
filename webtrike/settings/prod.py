from common import *

"""
This file should contain settings relevant to the PRODUCTION
environment, for example the production database or logging settings.

The above import line MUST be left as-is!
"""

DEBUG = True
PIPELINE = True

##################### Cache Over-rides: file-based for production:
CACHES.update({
    #'rcf': {
    #  'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    #},
    #'dmf': {
    #  'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    #}

    'rcf': {
        'BACKEND': 'django.core.cache.backends.filebased.FileBasedCache',
        'LOCATION': '/tmp/marvl/rcf',
        'TIMEOUT': 24 * 60 * 60 # 1 day
    },
    'dmf': {
        'BACKEND': 'django.core.cache.backends.filebased.FileBasedCache',
        'LOCATION': '/tmp/marvl/dmf',
        'TIMEOUT': 24 * 60 * 60 # 1 day
    }
})

#####################
## Settings for the Trike RCF+DMF interface layer:
#####################
# The fully-qualified name of the interface class for the DMF:
TRIKE_DMF_INTERFACE = 'apps.webtrike.comms.SocketComms'
# Constructor arguments for the DMF interface class, as a list (iterable):
TRIKE_DMF_INTERFACE_ARGS = ('your-host.your-domain.com', 20079)

# The fully-qualified name of the interface class for the RCF:
TRIKE_RCF_INTERFACE = 'apps.webtrike.comms.SocketComms'
# Constructor arguments for the RCF interface class, as a list (iterable):
TRIKE_RCF_INTERFACE_ARGS = ('your-host.your-domain.com', 20078)

