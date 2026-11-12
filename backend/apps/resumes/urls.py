from django.urls import path

from .views import resume_health, resume_summary, upload_resume

urlpatterns = [
    path('health/', resume_health, name='resume-health'),
    path('upload/', upload_resume, name='resume-upload'),
    path('summary/', resume_summary, name='resume-summary'),
]
