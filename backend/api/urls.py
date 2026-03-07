from django.urls import path
from .views import signup_and_profiles

urlpatterns = [
    path('profiles/', signup_and_profiles),
]