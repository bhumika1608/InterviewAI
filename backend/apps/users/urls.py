from django.urls import path

from .api import user_summary
from .views import csrf_token, health_check, login, logout, register

urlpatterns = [
    path('csrf/', csrf_token, name='csrf-token'),
    path('health/', health_check, name='health-check'),
    path('login/', login, name='user-login'),
    path('logout/', logout, name='user-logout'),
    path('register/', register, name='user-register'),
    path('me/', user_summary, name='user-summary'),
]
