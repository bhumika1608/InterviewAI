from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('apps.users.urls')),
    path('api/interviews/', include('apps.interviews.urls')),
    path('api/questions/', include('apps.questions.urls')),
    path('api/resumes/', include('apps.resumes.urls')),
    path('api/practice/', include('apps.practice.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/evaluations/', include('apps.evaluations.urls')),
    path('api/ai/', include('apps.ai.urls')),
]
