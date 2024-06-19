from django.contrib.auth import login as create_session, logout as destroy_session
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.shortcuts import redirect

from .models import DriveBCUser

def login(request):
  user = DriveBCUser.objects.get(username='admin')
  create_session(request, user)
  return redirect('//localhost:3000/')


def status(request):
  if request.user.is_authenticated:
    return HttpResponse('logged in')

  return HttpResponse('logged out')


def logout(request):
  destroy_session(request)

  return redirect('//localhost:3000/')


def profile(request):
  return redirect('//localhost:3000/')