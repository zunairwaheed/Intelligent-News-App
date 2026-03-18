from django.contrib import admin
from django.utils import timezone
from .models import UserSubmittedNews


@admin.register(UserSubmittedNews)
class UserSubmittedNewsAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'location_name', 'country_code', 'status', 'created_at')
    list_filter = ('status', 'country_code', 'created_at')
    search_fields = ('title', 'content', 'location_name', 'author__email')
    readonly_fields = ('author', 'created_at', 'updated_at', 'reviewed_by', 'reviewed_at')
    actions = ['approve_news', 'reject_news']

    def approve_news(self, request, queryset):
        queryset.update(
            status=UserSubmittedNews.STATUS_APPROVED,
            reviewed_by=request.user,
            reviewed_at=timezone.now(),
        )
        self.message_user(request, f'{queryset.count()} articles approved.')
    approve_news.short_description = 'Approve selected news articles'

    def reject_news(self, request, queryset):
        queryset.update(
            status=UserSubmittedNews.STATUS_REJECTED,
            reviewed_by=request.user,
            reviewed_at=timezone.now(),
        )
        self.message_user(request, f'{queryset.count()} articles rejected.')
    reject_news.short_description = 'Reject selected news articles'
