from django.conf import settings
from django.db import models

from apps.interviews.models import InterviewSession


class PerformanceMetric(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='performance_metrics')
    session = models.ForeignKey(InterviewSession, on_delete=models.SET_NULL, null=True, blank=True, related_name='metrics')
    metric_name = models.CharField(max_length=100)
    metric_value = models.FloatField(default=0.0)
    metric_group = models.CharField(max_length=100, default='overall')
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-recorded_at']

    def __str__(self):
        return f'{self.metric_name}: {self.metric_value}'
