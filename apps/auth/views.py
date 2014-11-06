import account.forms
import account.views
import apps.auth.forms
import random
import string


class LoginView(account.views.LoginView):
    form_class = account.forms.LoginEmailForm



class SignupView(account.views.SignupView):
    form_class = apps.auth.forms.SignupForm

    def generate_username(self, form):
        # do something to generate a unique username (required by the
        # Django User model, unfortunately)
        username = ''.join([random.choice(string.ascii_lowercase) for _ in range(12)])
        return username
