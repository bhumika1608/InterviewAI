from django.contrib import admin

from .models import ResumeProfile


@admin.register(ResumeProfile)
class ResumeProfileAdmin(admin.ModelAdmin):
    list_display = ('file_name', 'user', 'file_type', 'scanned_at')
    list_filter = ('file_type', 'scanned_at')
    search_fields = ('file_name', 'user__username', 'user__email', 'summary')
    readonly_fields = ('scanned_at', 'created_at', 'raw_text', 'summary', 'skills', 'experience_years', 'education')