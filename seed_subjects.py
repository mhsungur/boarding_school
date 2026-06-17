import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from students.models import Subject

# Grade-specific subjects based on user's school curriculum
SUBJECTS = {
    5: [
        'Türkçe', 'Matematik', 'Fen Bilimleri', 'Sosyal Bilgiler', 'Yabancı Dil',
        'Din Kültürü', 'Kuran-ı Kerim', 'Beden Eğitimi', 'Görsel Sanatlar', 'Müzik',
        'Bilişim Teknolojileri', 'Spor ve Fiziki Etkinlikler', 'Yazarlık ve Yazma Becerileri', 'Rehberlik'
    ],
    6: [
        'Türkçe', 'Matematik', 'Fen Bilimleri', 'Sosyal Bilgiler', 'Yabancı Dil',
        'Din Kültürü', 'Seçmeli İngilizce', 'Beden Eğitimi', 'Görsel Sanatlar', 'Müzik',
        'Bilişim Teknolojileri', 'Ahlak ve Yurttaşlık Eğitimi', 'Görgü Kuralları ve Nezaket', 'Rehberlik'
    ],
    7: [
        'Türkçe', 'Matematik', 'Fen Bilimleri', 'Sosyal Bilgiler', 'Yabancı Dil',
        'Din Kültürü', 'Beden Eğitimi', 'Görsel Sanatlar', 'Müzik',
        'Teknoloji Tasarım', 'Matematik ve Bilim Uygulamaları', 'Ahlak ve Yurttaşlık Eğitimi',
        'Görgü Kuralları ve Nezaket', 'Rehberlik'
    ],
    8: [
        'Türkçe', 'Matematik', 'Fen Bilimleri', 'T.C İnkılap Tarihi', 'Yabancı Dil',
        'Din Kültürü', 'Beden Eğitimi', 'Görsel Sanatlar', 'Müzik',
        'Teknoloji Tasarım', 'Matematik ve Bilim Uygulamaları', 'Ahlak ve Yurttaşlık Eğitimi',
        'Görgü Kuralları ve Nezaket', 'Rehberlik'
    ]
}

def seed_subjects():
    """Seed subjects for all grades"""
    total_created = 0
    
    for grade, subjects in SUBJECTS.items():
        for subject_name in subjects:
            subject, created = Subject.objects.get_or_create(
                name=subject_name,
                grade=grade
            )
            if created:
                total_created += 1
                print(f"✅ Created: {subject}")
            else:
                print(f"⏭️  Already exists: {subject}")
    
    print(f"\n🎉 Seeding complete! Created {total_created} new subjects.")
    print(f"📊 Total subjects in database: {Subject.objects.count()}")

if __name__ == '__main__':
    print("🌱 Seeding subjects...")
    seed_subjects()
