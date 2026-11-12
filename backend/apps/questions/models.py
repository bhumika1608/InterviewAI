from django.db import models


class QuestionBank(models.Model):
    CATEGORY_CHOICES = [
        ('technical', 'Technical'),
        ('behavioral', 'Behavioral'),
        ('communication', 'Communication'),
        ('leadership', 'Leadership'),
        ('aptitude', 'Aptitude'),
    ]

    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]

    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='technical')
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='medium')
    role = models.CharField(max_length=200, blank=True)
    question_text = models.TextField()
    expected_answer = models.TextField(blank=True)
    tags = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['category', 'difficulty', 'id']

    def __str__(self):
        return self.question_text[:80]
