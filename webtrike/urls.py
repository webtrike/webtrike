from django.conf import settings
from django.conf.urls import patterns, include, url
from django.views.generic import TemplateView

urlpatterns = patterns('',
    url(r'^$', TemplateView.as_view(template_name='webtrike.html'), name='home'),
    url(r'^(?P<email>\w+)(?P<username>\w+)(?P<organisation>\w+)$', TemplateView.as_view(template_name='webtrike.html'), name='home'),
    url(r'^webtrike/dmf/', include('apps.webtrike.dmf.urls')),
    url(r'^webtrike/rcf/', include('apps.webtrike.rcf.urls')),
)

from django.contrib.staticfiles.urls import staticfiles_urlpatterns
urlpatterns += staticfiles_urlpatterns()

# For testing error views:
if settings.DEBUG:
    urlpatterns += patterns('',
        url(r'^404/$', TemplateView.as_view(template_name='404.html'), name='404'),
        url(r'^500/$', TemplateView.as_view(template_name='500.html'), name='500'),
        (r'^media/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.MEDIA_ROOT, 'show_indexes':True}),
    )
