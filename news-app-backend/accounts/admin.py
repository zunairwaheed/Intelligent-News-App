from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'city', 'country_code', 'is_staff', 'date_joined')
    list_filter = ('is_staff', 'is_active', 'country_code')
    search_fields = ('email', 'username', 'city')
    fieldsets = UserAdmin.fieldsets + (
        ('Location', {'fields': ('city', 'country_code', 'latitude', 'longitude')}),
        ('Profile', {'fields': ('phone', 'bio', 'avatar')}),
    )
