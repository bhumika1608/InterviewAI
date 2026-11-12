from django.urls import path

from .views import ai_health, analyze_resume, evaluate_answer_endpoint

urlpatterns = [
    path('health/', ai_health, name='ai-health'),
    path('resume/analyze/', analyze_resume, name='resume-analyze'),
    path('answer/evaluate/', evaluate_answer_endpoint, name='answer-evaluate'),
]
