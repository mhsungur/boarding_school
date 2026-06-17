import os
import django
import sys

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from dashboard.models import Announcement, SliderItem, DailyContent
from django.utils import timezone
from datetime import date

def seed():
    print("Seeding Dashboard Data...")
    
    # Announcement
    if not Announcement.objects.exists():
        Announcement.objects.create(
            title="Sisteme Hoş Geldiniz",
            content="Dijital Pano sistemimiz test yayınındadır. Hayırlı olsun.",
            priority="high",
            is_active=True
        )
        print("Created Announcement.")

    # Slider Item (Placeholder)
    if not SliderItem.objects.exists():
        SliderItem.objects.create(
            title="Hasbahçe Talebe Takip",
            order=1,
            is_active=True,
            display_duration=10
        )
        print("Created Slider Item.")

    # Daily Content
    today = timezone.now().date()
    if not DailyContent.objects.filter(date_to_show=today).exists():
        DailyContent.objects.create(
            content_type="hadith",
            text="İlim talep etmek her Müslümana farzdır.",
            source="İbn Mâce, Mukaddime, 17",
            date_to_show=today
        )
        print("Created Daily Content.")

    print("Dashboard seeding complete.")

if __name__ == "__main__":
    seed()
