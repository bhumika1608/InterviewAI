from django.contrib import admin

from .models import InterviewQuestion, InterviewSession


class InterviewQuestionInline(admin.TabularInline):
    model = InterviewQuestion
    extra = 0
    fields = ('question_order', 'question_text', 'user_answer', 'score', 'is_answered')
    readonly_fields = fields
    show_change_link = True


@admin.register(InterviewSession)
class InterviewSessionAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'role', 'status', 'overall_score', 'created_at', 'completed_at')
    list_filter = ('status', 'interview_type', 'difficulty', 'created_at')
    search_fields = ('title', 'role', 'user__username', 'user__email')
    readonly_fields = (
        'created_at',
        'completed_at',
        'overall_score',
        'summary',
        'transcript',
        'evaluation_data',
        'expression_score',
        'camera_verified',
        'voice_verified',
    )
    inlines = (InterviewQuestionInline,)


@admin.register(InterviewQuestion)
class InterviewQuestionAdmin(admin.ModelAdmin):
    list_display = ('session', 'question_order', 'score', 'is_answered', 'created_at')
    list_filter = ('is_answered', 'created_at')
    search_fields = ('question_text', 'user_answer', 'session__title', 'session__user__username')
    readonly_fields = ('created_at', 'answered_at')