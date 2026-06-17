import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from students.models import PrayerAttendance, BedCheck, StudyPerformance, Exam

def reset_data():
    print("Veriler sıfırlanıyor...")
    
    # Prayer Attendance
    count = PrayerAttendance.objects.all().delete()[0]
    print(f"Silindi: {count} Namaz Kaydı")
    
    # Bed Check
    count = BedCheck.objects.all().delete()[0]
    print(f"Silindi: {count} Yatak Kontrolü")
    
    # Study Performance
    count = StudyPerformance.objects.all().delete()[0]
    print(f"Silindi: {count} Etüt/Ders Performansı")
    
    # Exam
    count = Exam.objects.all().delete()[0]
    print(f"Silindi: {count} Sınav Notu")
    
    print("Tüm takip verileri başarıyla sıfırlandı.")

if __name__ == "__main__":
    reset_data()
