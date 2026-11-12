from django.urls import path

from .views import question_health

urlpatterns = [
    path('health/', question_health, name='question-health'),
]
