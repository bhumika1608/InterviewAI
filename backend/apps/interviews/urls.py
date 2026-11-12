from django.urls import path

from .views import complete_interview, create_interview_session, interview_dashboard, interview_history, record_camera_observation, session_detail, submit_answer

urlpatterns = [
    path('dashboard/', interview_dashboard, name='interview-dashboard'),
    path('history/', interview_history, name='interview-history'),
    path('create/', create_interview_session, name='interview-create'),
    path('<int:session_id>/camera-observation/', record_camera_observation, name='interview-camera-observation'),
    path('<int:session_id>/submit-answer/', submit_answer, name='interview-submit-answer'),
    path('<int:session_id>/', session_detail, name='interview-detail'),
    path('<int:session_id>/complete/', complete_interview, name='interview-complete'),
]
