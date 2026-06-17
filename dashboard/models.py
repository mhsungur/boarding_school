from django.db import models
from django.utils import timezone

class SliderItem(models.Model):
    title = models.CharField(max_length=200, blank=True, verbose_name="Başlık")
    # For now, we'll use a URL field or FileField. 
    # Since we are using Supabase, FileField might need storage config. 
    # Let's keep it simple with FileField, assuming local dev or Supabase storage handling.
    image = models.ImageField(upload_to='slider_images/', blank=True, null=True, verbose_name="Görsel")
    video = models.FileField(upload_to='slider_videos/', blank=True, null=True, verbose_name="Video")
    
    display_duration = models.IntegerField(default=10, verbose_name="Gösterim Süresi (Saniye)")
    order = models.IntegerField(default=0, verbose_name="Sıralama")
    is_active = models.BooleanField(default=True, verbose_name="Aktif mi?")
    
    start_date = models.DateTimeField(blank=True, null=True, verbose_name="Başlangıç Tarihi")
    end_date = models.DateTimeField(blank=True, null=True, verbose_name="Bitiş Tarihi")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Slider Ögesi"
        verbose_name_plural = "Slider Ögeleri"
        ordering = ['order', '-created_at']

    def __str__(self):
        return self.title or f"Slider Item {self.id}"

class Announcement(models.Model):
    PRIORITY_CHOICES = [
        ('normal', 'Normal'),
        ('high', 'Yüksek (Kırmızı)'),
    ]

    title = models.CharField(max_length=200, verbose_name="Başlık")
    content = models.TextField(verbose_name="İçerik")
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal', verbose_name="Öncelik")
    is_active = models.BooleanField(default=True, verbose_name="Aktif mi?")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Duyuru"
        verbose_name_plural = "Duyurular"
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class DailyContent(models.Model):
    CONTENT_TYPES = [
        ('hadith', 'Hadis-i Şerif'),
        ('verse', 'Ayet-i Kerime'),
        ('word', 'Günün Sözü'),
    ]

    content_type = models.CharField(max_length=10, choices=CONTENT_TYPES, verbose_name="Tür")
    text = models.TextField(verbose_name="Metin")
    source = models.CharField(max_length=200, blank=True, verbose_name="Kaynak (Sure/Ravi)")
    
    date_to_show = models.DateField(default=timezone.now, verbose_name="Gösterilecek Tarih")
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Günün İçeriği"
        verbose_name_plural = "Günün İçerikleri"
        ordering = ['-date_to_show']

    def __str__(self):
        return f"{self.get_content_type_display()} - {self.date_to_show}"
