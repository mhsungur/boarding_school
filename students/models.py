from django.db import models

# ==========================================
# ÖĞRENCİ MODELİ (Student)
# ==========================================
# Bu model, okuldaki öğrencilerin temel bilgilerini saklar.
# Veritabanında 'students_student' adında bir tablo oluşturur.
class Student(models.Model):
    # Sınıf seçenekleri (5, 6, 7, 8. sınıflar)
    # Veritabanında sadece sayı (5) tutulur, ama kullanıcıya yazı ('5. Sınıf') gösterilir.
    GRADES = [
        (5, '5. Sınıf'),
        (6, '6. Sınıf'),
        (7, '7. Sınıf'),
        (8, '8. Sınıf'),
    ]
    
    # CharField: Kısa metinler için kullanılır.
    # max_length=50: En fazla 50 karakter girilebilir.
    first_name = models.CharField(max_length=50, verbose_name="Ad")
    last_name = models.CharField(max_length=50, verbose_name="Soyad")
    
    # IntegerField: Tam sayı değerleri için kullanılır.
    # choices=GRADES: Sadece yukarıdaki listedeki değerler seçilebilir.
    grade = models.IntegerField(choices=GRADES, verbose_name="Sınıf")
    
    # unique=True: Bu alan benzersiz olmalıdır. Yani aynı okul numarasına sahip iki öğrenci kaydedilemez.
    # Bu, veri tutarlılığı için çok önemlidir.
    student_number = models.CharField(max_length=20, unique=True, verbose_name="Okul No")
    
    # blank=True, null=True: Bu alanın doldurulması zorunlu değildir. Boş bırakılabilir.
    parent_phone = models.CharField(max_length=15, verbose_name="Veli Telefon", blank=True, null=True)
    
    # auto_now_add=True: Kayıt İLK oluşturulduğunda o anki tarihi otomatik atar.
    created_at = models.DateTimeField(auto_now_add=True)
    # auto_now=True: Kayıt HER güncellendiğinde o anki tarihi otomatik günceller.
    updated_at = models.DateTimeField(auto_now=True)

    # __str__ Metodu:
    # Bu nesne (öğrenci) bir yerde yazdırıldığında veya admin panelinde listelendiğinde
    # nasıl görüneceğini belirler. Burada "Ad Soyad (Sınıf)" formatını kullandık.
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.grade}. Sınıf)"

    class Meta:
        verbose_name = "Öğrenci"
        verbose_name_plural = "Öğrenciler"
        # ordering: Veritabanından veriler çekildiğinde varsayılan sıralamayı belirler.
        # Önce sınıfına göre (küçükten büyüğe), sonra adına göre (A'dan Z'ye) sıralar.
        ordering = ['grade', 'first_name']

# ==========================================
# YATAK KONTROL MODELİ (BedCheck)
# ==========================================
# Öğrencilerin yatak düzenini (Düzenli/Düzensiz) günlük olarak takip eder.
class BedCheck(models.Model):
    STATUS_CHOICES = [
        ('tidy', 'Düzenli'),
        ('untidy', 'Düzensiz'),
    ]

    # ForeignKey (Yabancı Anahtar): Başka bir tabloyla ilişki kurar.
    # Burada her yatak kontrolünün bir 'Student'a ait olduğunu belirtiyoruz.
    # on_delete=models.CASCADE: Eğer ilişkili 'Student' silinirse, ona ait bu yatak kontrol kayıtlarını da SİL.
    # related_name='bed_checks': Student nesnesinden bu kayıtlara erişmek için kullanılacak isim.
    # Örn: student.bed_checks.all() diyerek o öğrencinin tüm yatak kontrollerini alabiliriz.
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='bed_checks')
    
    date = models.DateField(verbose_name="Tarih")
    
    # BooleanField: Doğru/Yanlış (True/False) değeri tutar.
    # default=True: Eğer bir değer belirtilmezse varsayılan olarak 'True' (Düzenli) kabul et.
    is_tidy = models.BooleanField(default=True, verbose_name="Düzenli mi?") 
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # unique_together: Birden fazla alanın kombinasyonunun benzersiz olmasını sağlar.
        # Yani: Bir öğrenci (student) için aynı tarihte (date) İKİNCİ bir kayıt oluşturulamaz.
        # Bu, mükerrer veri girişini engeller.
        unique_together = ['student', 'date']
        verbose_name = "Yatak Kontrolü"
        verbose_name_plural = "Yatak Kontrolleri"

# ==========================================
# NAMAZ YOKLAMA MODELİ (PrayerAttendance)
# ==========================================
# Öğrencilerin 5 vakit namaz durumunu takip eder.
class PrayerAttendance(models.Model):
    PRAYER_CHOICES = [
        ('sabah', 'Sabah'),
        ('ogle', 'Öğle'),
        ('ikindi', 'İkindi'),
        ('aksam', 'Akşam'),
        ('yatsi', 'Yatsı'),
    ]
    
    STATUS_CHOICES = [
        ('geldi', 'Geldi'),
        ('gec_kaldi', 'Geç Kaldı'),
        ('gelmedi', 'Gelmedi'),
        ('mazeret', 'Mazeretli'),
    ]
    
    # related_name='prayer_attendances': student.prayer_attendances.all() ile erişim sağlar.
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='prayer_attendances')
    date = models.DateField(verbose_name="Tarih")
    prayer_time = models.CharField(max_length=10, choices=PRAYER_CHOICES, verbose_name="Namaz Vakti")
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, verbose_name="Durum")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        # get_FIELD_display(): choices kullanılan alanlarda, veritabanındaki değeri ('sabah') değil,
        # okunabilir değeri ('Sabah') almak için Django'nun sağladığı otomatik metot.
        return f"{self.student} - {self.get_prayer_time_display()} ({self.date}): {self.get_status_display()}"
    
    class Meta:
        # Bir öğrenci, bir tarihte, bir vakit için sadece TEK bir duruma sahip olabilir.
        # Hem 'Geldi' hem 'Gelmedi' olamaz.
        unique_together = ['student', 'date', 'prayer_time']
        verbose_name = "Namaz Devamsızlık Kaydı"
        verbose_name_plural = "Namaz Devamsızlık Kayıtları"
        ordering = ['date', 'prayer_time', 'student']

# ==========================================
# ETÜT PERFORMANS MODELİ (StudyPerformance)
# ==========================================
# Etüt ve dini derslerdeki performansı (Mükemmel, İyi vb.) takip eder.
class StudyPerformance(models.Model):
    SESSION_CHOICES = [
        ('etut', 'Etüt'),
        ('dini_ders', 'Dini Ders'),
    ]
    
    PERFORMANCE_CHOICES = [
        ('mukemmel', 'Mükemmel'),
        ('iyi', 'İyi'),
        ('orta', 'Orta'),
        ('zayif', 'Zayıf'),
        ('katilmadi', 'Katılmadı'),
        ('izinli', 'İzinli'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='study_performances')
    date = models.DateField(verbose_name="Tarih")
    session_type = models.CharField(max_length=15, choices=SESSION_CHOICES, verbose_name="Oturum Türü")
    performance = models.CharField(max_length=15, choices=PERFORMANCE_CHOICES, verbose_name="Performans")
    # TextField: CharField'dan daha uzun metinler için kullanılır. Sınırı yoktur.
    notes = models.TextField(blank=True, verbose_name="Notlar")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.student} - {self.get_session_type_display()} ({self.date}): {self.get_performance_display()}"
    
    class Meta:
        # Bir öğrenci için aynı tarihte ve aynı oturum türünde (örn: Etüt) tek kayıt olabilir.
        unique_together = ['student', 'date', 'session_type']
        verbose_name = "Etüt/Ders Performansı"
        verbose_name_plural = "Etüt/Ders Performansları"
        ordering = ['date', 'session_type', 'student']

# ==========================================
# DERS MODELİ (Subject)
# ==========================================
# Okul derslerini tanımlar (Matematik, Türkçe vb.)
class Subject(models.Model):
    name = models.CharField(max_length=100, verbose_name="Ders Adı")
    grade = models.IntegerField(verbose_name="Sınıf")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} ({self.grade}. Sınıf)"
    
    class Meta:
        # Aynı isimde ve aynı sınıfta ikinci bir ders olamaz.
        # Örn: 5. Sınıf Matematik dersi bir kere tanımlanabilir.
        unique_together = ['name', 'grade']
        verbose_name = "Ders"
        verbose_name_plural = "Dersler"
        ordering = ['grade', 'name']

# ==========================================
# SINAV MODELİ (Exam)
# ==========================================
# Okul sınav sonuçlarını saklar.
class Exam(models.Model):
    EXAM_TYPE_CHOICES = [
        ('yazili_1', '1. Yazılı'),
        ('yazili_2', '2. Yazılı'),
        ('sozlu', 'Sözlü'),
        ('performans', 'Performans/Proje'),
    ]
    
    TERM_CHOICES = [
        ('donem_1', '1. Dönem'),
        ('donem_2', '2. Dönem'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='exams')
    
    # on_delete=models.PROTECT: Bu ders silinmek istendiğinde, eğer bu derse ait sınav notları varsa
    # silme işlemini ENGELLE. Bu, yanlışlıkla ders silip öğrencilerin notlarını kaybetmeyi önler.
    subject = models.ForeignKey(Subject, on_delete=models.PROTECT, verbose_name="Ders")
    
    exam_type = models.CharField(max_length=20, choices=EXAM_TYPE_CHOICES, verbose_name="Sınav Türü")
    term = models.CharField(max_length=10, choices=TERM_CHOICES, verbose_name="Dönem")
    
    # DecimalField: Hassas sayısal değerler (para, not ortalaması vb.) için kullanılır.
    # max_digits=5: Toplam 5 basamak olabilir (örn: 100.00)
    # decimal_places=2: Virgülden sonra 2 basamak saklar.
    score = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Not (0-100)")
    
    exam_date = models.DateField(verbose_name="Sınav Tarihi")
    notes = models.TextField(blank=True, verbose_name="Notlar")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.student} - {self.subject} ({self.get_exam_type_display()}): {self.score}"
    
    class Meta:
        # Bir öğrencinin, bir dersten, aynı dönemde ve aynı sınav türünde sadece bir notu olabilir.
        # Örn: Ahmet'in 1. Dönem Matematik 1. Yazılı notu sadece bir tane olabilir.
        unique_together = ['student', 'subject', 'exam_type', 'term']
        verbose_name = "Sınav"
        verbose_name_plural = "Sınavlar"
        ordering = ['-exam_date', 'student']

from django.contrib.auth.models import User
import uuid

# ==========================================
# KİMLİK DOĞRULAMA TOKEN MODELİ (AuthToken)
# ==========================================
# Kullanıcıların sisteme giriş yaptığında aldığı güvenli anahtardır.
# Bu token sayesinde kullanıcı her işlemde şifresini tekrar girmek zorunda kalmaz.
class AuthToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='auth_tokens')
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # save metodu override (ezme) edilmiştir.
    # Kayıt işlemi yapılmadan hemen önce çalışır.
    def save(self, *args, **kwargs):
        # Eğer token henüz oluşturulmamışsa (yeni kayıtsa)
        if not self.token:
            # Rastgele, benzersiz bir UUID (örn: 550e8400-e29b-41d4-a716-446655440000) oluştur ve ata.
            self.token = str(uuid.uuid4())
        # Standart kaydetme işlemini yap.
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Token for {self.user.username}"

