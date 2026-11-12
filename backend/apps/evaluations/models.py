from django.conf import settings
from django.db import models

from apps.interviews.models import InterviewSession


class InterviewEvaluation(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='evaluations')
    session = models.ForeignKey(InterviewSession, on_delete=models.CASCADE, related_name='evaluations')
    score = models.FloatField(default=0.0)
    strengths = models.JSONField(default=list, blank=True)
    improvements = models.JSONField(default=list, blank=True)
    feedback = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Evaluation for {self.session.title}'
