import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from students.models import Student
from django.contrib.auth.models import User

# Create superuser
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print("✅ Admin user created: admin/admin123")
else:
    print("ℹ️  Admin user already exists")

# Create students
students_data = [
    ("Ahmet", "Yılmaz", 5, "5001"),
    ("Mehmet", "Kaya", 5, "5002"),
    ("Ali", "Demir", 5, "5003"),
    ("Ayşe", "Çelik", 6, "6001"),
    ("Fatma", "Öztürk", 6, "6002"),
    ("Zeynep", "Arslan", 6, "6003"),
    ("Mustafa", "Doğan", 7, "7001"),
    ("Emine", "Kılıç", 7, "7002"),
    ("Yusuf", "Aslan", 7, "7003"),
    ("Ömer", "Çetin", 8, "8001"),
    ("Elif", "Kara", 8, "8002"),
    ("Hasan", "Koç", 8, "8003"),
]

for first, last, grade, num in students_data:
    student, created = Student.objects.get_or_create(
        student_number=num,
        defaults={
            'first_name': first,
            'last_name': last,
            'grade': grade,
        }
    )
    if created:
        print(f"✅ {first} {last} ({grade}. Sınıf) eklendi")
    else:
        print(f"ℹ️  {first} {last} zaten mevcut")

print(f"\n🎉 Toplam {Student.objects.count()} öğrenci!")
