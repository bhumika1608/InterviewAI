from django.conf import settings
from django.db import models


class ResumeProfile(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='resumes')
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50, default='pdf')
    raw_text = models.TextField(blank=True)
    summary = models.TextField(blank=True)
    skills = models.JSONField(default=list, blank=True)
    experience_years = models.FloatField(default=0.0)
    education = models.TextField(blank=True)
    scanned_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.file_name
