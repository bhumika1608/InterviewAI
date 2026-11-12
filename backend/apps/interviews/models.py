from django.conf import settings
from django.db import models

from apps.resumes.models import ResumeProfile


class InterviewSession(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    INTERVIEW_TYPES = [
        ('technical', 'Technical'),
        ('behavioral', 'Behavioral'),
        ('system_design', 'System Design'),
        ('case', 'Case Study'),
        ('resume_based', 'Resume Based'),
    ]

    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='interview_sessions')
    resume = models.ForeignKey(ResumeProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='interviews')
    title = models.CharField(max_length=255)
    role = models.CharField(max_length=200, blank=True)
    interview_type = models.CharField(max_length=30, choices=INTERVIEW_TYPES, default='technical')
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    mode = models.CharField(max_length=50, default='voice')
    duration_minutes = models.PositiveIntegerField(default=30)
    overall_score = models.FloatField(default=0.0)
    summary = models.TextField(blank=True)
    transcript = models.TextField(blank=True)
    expression_score = models.FloatField(default=0.0)
    camera_verified = models.BooleanField(default=False)
    voice_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    evaluation_data = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class InterviewQuestion(models.Model):
    session = models.ForeignKey(InterviewSession, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    expected_answer = models.TextField(blank=True)
    user_answer = models.TextField(blank=True)
    score = models.FloatField(default=0.0)
    follow_up = models.TextField(blank=True)
    question_order = models.PositiveIntegerField(default=1)
    is_answered = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    answered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['question_order']

    def __str__(self):
        return f"Question {self.question_order} for {self.session.title}"
