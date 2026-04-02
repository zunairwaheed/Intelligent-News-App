from django.contrib import admin
from django.utils import timezone
from .models import UserSubmittedNews


@admin.register(UserSubmittedNews)
class UserSubmittedNewsAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'location_name', 'country_code', 'is_ai_generated', 'created_at')
    list_filter = ('is_ai_generated', 'country_code', 'created_at')
    search_fields = ('title', 'content', 'location_name', 'author__email')
    readonly_fields = ('author', 'created_at', 'updated_at', 'embedding_vector')
