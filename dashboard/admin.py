from django.contrib import admin
from .models import SliderItem, Announcement, DailyContent

@admin.register(SliderItem)
class SliderItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'order', 'is_active', 'start_date', 'end_date', 'created_at')
    list_editable = ('order', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('title',)

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'priority', 'is_active', 'created_at')
    list_editable = ('priority', 'is_active')
    list_filter = ('priority', 'is_active')
    search_fields = ('title', 'content')

@admin.register(DailyContent)
class DailyContentAdmin(admin.ModelAdmin):
    list_display = ('content_type', 'date_to_show', 'source', 'created_at')
    list_filter = ('content_type', 'date_to_show')
    search_fields = ('text', 'source')
    date_hierarchy = 'date_to_show'
