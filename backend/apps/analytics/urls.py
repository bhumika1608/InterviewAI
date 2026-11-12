from django.urls import path

from .views import analytics_health

urlpatterns = [
    path('health/', analytics_health, name='analytics-health'),
]
