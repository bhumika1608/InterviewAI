from django.urls import path

from .views import practice_health

urlpatterns = [
    path('health/', practice_health, name='practice-health'),
]
