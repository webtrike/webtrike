"""
django-user-accounts provides most of what we want, including the
ability to override a few small things in order to user email as
usernames.  This is the main hook in to that.
"""


from django.conf.urls import patterns, include, url
import apps.auth.views as av

# Over-ride the signup view to use a no-username form, and defer for
# the rest:
urlpatterns = patterns('',
    url(r'^signup/$', av.SignupView.as_view(), name='account_signup'),
    url(r'', include('account.urls')),
)
