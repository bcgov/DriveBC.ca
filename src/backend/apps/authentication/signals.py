# apps/authentication/signals.py

from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from django.dispatch import receiver


def get_ip(request):
    if not request:
        return None
    x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded:
        return x_forwarded.split(",")[0]
    return request.META.get("REMOTE_ADDR")

def get_request_meta(request, key, default=None):
    if not request:
        return default
    return request.META.get(key, default)


@receiver(user_logged_in)
def log_login(sender, request, user, **kwargs):
    ip = get_ip(request)

    print(f"[LOGIN] user={user.username} ip={ip}")


@receiver(user_logged_out)
def log_logout(sender, request, user, **kwargs):
    ip = get_ip(request)


    print(f"[LOGOUT] user={user} ip={ip}")

@receiver(user_login_failed)
def log_failed_login(sender, credentials, request, **kwargs):
    ip = get_ip(request)

    print(f"[FAILED LOGIN] username={credentials.get('username')} ip={ip}")