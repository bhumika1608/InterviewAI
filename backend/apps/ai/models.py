from django.db import models


class AIModelConfig(models.Model):
    name = models.CharField(max_length=200)
    provider = models.CharField(max_length=100, default='local')
    model_name = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    config = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
