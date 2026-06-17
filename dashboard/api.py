from ninja import Router, Schema
from typing import List, Optional
from datetime import date, datetime
from django.db.models import Q
from .models import SliderItem, Announcement, DailyContent
from django.utils import timezone
from students.daily_summary import get_daily_summary as calculate_daily_summary

from students.analytics import get_overall_analytics

router = Router()

class SliderItemSchema(Schema):
    id: int
    title: str
    image: Optional[str] = None
    video: Optional[str] = None
    display_duration: int
    order: int

class AnnouncementSchema(Schema):
    id: int
    title: str
    content: str
    priority: str
    created_at: datetime

class DailyContentSchema(Schema):
    content_type: str
    text: str
    source: Optional[str] = None
    date_to_show: date

class DashboardContentSchema(Schema):
    slider_items: List[SliderItemSchema]
    announcements: List[AnnouncementSchema]
    daily_content: List[DailyContentSchema]
    stats: Optional[dict] = None
    grade_stats: Optional[dict] = None  # Add grade_stats field
    
@router.get("/content", response=DashboardContentSchema)
def get_dashboard_content(request):
    today = timezone.now()
    
    # Fetch active slider items
    slider_items = SliderItem.objects.filter(is_active=True).filter(
        Q(start_date__isnull=True) | Q(start_date__lte=today)
    ).filter(
        Q(end_date__isnull=True) | Q(end_date__gte=today)
    ).order_by('order')

    # Fetch active announcements
    announcements = Announcement.objects.filter(is_active=True).order_by('-priority', '-created_at')

    # Fetch daily content for today (or latest if none for today?)
    # Let's try to get today's, if not, maybe getting the latest one is better?
    # For now, let's just get today's.
    daily_content = DailyContent.objects.filter(date_to_show=today.date())
    
    # Calculate daily statistics
    daily_stats = calculate_daily_summary(today.date())
    
    # Calculate grade stats (Weekly - last 7 days)
    analytics_data = get_overall_analytics(days=7)
    grade_stats = analytics_data.get('grade_stats', {})

    # Convert image/video to URLs if they exist (Django Ninja handles this if using generic FileField but let's be safe)
    # The Schema handles it if the model has a URL property, but ImageField returns a FieldFile object which casts to string as path.
    # We might need request.build_absolute_uri but frontend works with relative if configured.
    
    # Manually serialize to ensure absolute URLs
    slider_data = []
    for item in slider_items:
        image_url = None
        if item.image:
             # If it's already an absolute URL (unlikely for FileField but possible), leave it. 
             # Otherwise build absolute uri. 
             # item.image.url usually returns /media/filename.jpg
             image_url = request.build_absolute_uri(item.image.url)
        
        video_url = None
        if item.video:
            video_url = request.build_absolute_uri(item.video.url)

        slider_data.append({
            "id": item.id,
            "title": item.title,
            "image": image_url,
            "video": video_url,
            "display_duration": item.display_duration,
            "order": item.order
        })

    return {
        "slider_items": slider_data,
        "announcements": list(announcements),
        "daily_content": list(daily_content),
        "stats": daily_stats,
        "grade_stats": grade_stats
    }
