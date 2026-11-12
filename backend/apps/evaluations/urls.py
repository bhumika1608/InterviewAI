from django.urls import path

from .views import evaluation_health

urlpatterns = [
    path('health/', evaluation_health, name='evaluation-health'),
]
