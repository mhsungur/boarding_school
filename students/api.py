from typing import List
from ninja import NinjaAPI, Schema
from django.shortcuts import get_object_or_404
from .models import Student, BedCheck, PrayerAttendance, StudyPerformance, Subject, Exam
from .services import get_student_summary
from .ai_service import generate_student_report
from .analytics import get_overall_analytics
from .daily_summary import get_daily_summary
from datetime import date, datetime
from decimal import Decimal

# NinjaAPI: Django ile hızlı ve modern API'ler yazmamızı sağlayan kütüphane.
# API (Application Programming Interface), frontend (ekranlar) ile backend (sunucu) arasındaki köprüdür.
api = NinjaAPI()

from dashboard.api import router as dashboard_router
api.add_router("/dashboard", dashboard_router)

# ==========================================
# ŞEMALAR (Schemas)
# ==========================================
# Şemalar, API'ye gelen veya API'den giden verilerin kalıplarıdır.
# "Bana şu formatta veri gönder" veya "Ben sana şu formatta cevap vereceğim" demektir.

# Öğrenci verisinin dışarıya nasıl gönderileceğini belirler.
class StudentSchema(Schema):
    id: int
    first_name: str
    last_name: str
    grade: int
    student_number: str

# Yatak kontrolü verisinin dışarıya nasıl gönderileceğini belirler.
class BedCheckSchema(Schema):
    student_id: int
    date: date
    is_tidy: bool

# Yatak kontrolü kaydederken frontend'den beklediğimiz veri formatı.
# "Bana öğrenci ID'sini ve yatak düzenli mi bilgisini ver" diyoruz.
class BedCheckIn(Schema):
    student_id: int
    is_tidy: bool

class PrayerAttendanceSchema(Schema):
    student_id: int
    date: date
    prayer_time: str
    status: str

# Namaz yoklaması kaydederken beklediğimiz veri.
class PrayerAttendanceIn(Schema):
    student_id: int
    status: str

class StudyPerformanceSchema(Schema):
    student_id: int
    date: date
    session_type: str
    performance: str

# Etüt performansı kaydederken beklediğimiz veri.
class StudyPerformanceIn(Schema):
    student_id: int
    performance: str

class SubjectSchema(Schema):
    id: int
    name: str
    grade: int

class ExamSchema(Schema):
    id: int
    student_id: int
    subject: SubjectSchema
    exam_type: str
    term: str
    score: float
    exam_date: date

# Sınav notu kaydederken beklediğimiz veri.
class ExamIn(Schema):
    subject_id: int
    exam_type: str
    term: str
    score: float
    exam_date: date

# ==========================================
# API UÇ NOKTALARI (Endpoints)
# ==========================================
# Frontend'in istek gönderebileceği adresler buradadır.

# 1. ÖĞRENCİ İŞLEMLERİ
# GET /students: Öğrenci listesini getirir.
# response=List[StudentSchema]: Cevap olarak bir öğrenci listesi döneceğimizi belirtir.
@api.get("/students", response=List[StudentSchema])
def list_students(request, grade: int = None):
    # Eğer sınıf filtresi (grade) varsa, sadece o sınıfı getir.
    if grade:
        return Student.objects.filter(grade=grade).order_by('first_name')
    # Yoksa tüm öğrencileri, önce sınıfa sonra isme göre sıralayarak getir.
    return Student.objects.all().order_by('grade', 'first_name')

# 2. YATAK KONTROL İŞLEMLERİ
# GET /bed-checks: Belirli bir tarihteki yatak kontrollerini getirir.
@api.get("/bed-checks", response=List[BedCheckSchema])
def list_bed_checks(request, date: str, grade: int = None):
    checks = BedCheck.objects.filter(date=date)
    if grade:
        # student__grade: İlişkili öğrenci tablosundaki sınıf alanına göre filtrele.
        checks = checks.filter(student__grade=grade)
    return checks

# POST /bed-checks: Yatak kontrollerini kaydeder.
# payload: List[BedCheckIn]: Frontend'den bir liste halinde veri bekleriz.
@api.post("/bed-checks")
def save_bed_checks(request, bed_date: str, payload: List[BedCheckIn]):
    for item in payload:
        # update_or_create: Varsa güncelle, yoksa yeni oluştur.
        # Bu sayede aynı gün için mükerrer kayıt oluşmaz, düzeltme yapılabilir.
        BedCheck.objects.update_or_create(
            student_id=item.student_id,
            date=bed_date,
            defaults={'is_tidy': item.is_tidy} # Güncellenecek alan
        )
    return {"success": True}

# 3. NAMAZ YOKLAMA İŞLEMLERİ
@api.get("/prayer-attendance", response=List[PrayerAttendanceSchema])
def list_prayer_attendance(request, date: str, prayer: str):
    # Belirli bir tarih ve vakit (örn: 2023-10-27 Sabah) için kayıtları getir.
    return PrayerAttendance.objects.filter(date=date, prayer_time=prayer)

@api.post("/prayer-attendance")
def save_prayer_attendance(request, att_date: str, prayer: str, payload: List[PrayerAttendanceIn]):
    for item in payload:
        PrayerAttendance.objects.update_or_create(
            student_id=item.student_id,
            date=att_date,
            prayer_time=prayer,
            defaults={'status': item.status}
        )
    return {"success": True}

# 4. ETÜT PERFORMANS İŞLEMLERİ
@api.get("/study-performance", response=List[StudyPerformanceSchema])
def list_study_performance(request, date: str, session: str):
    return StudyPerformance.objects.filter(date=date, session_type=session)

@api.post("/study-performance")
def save_study_performance(request, perf_date: str, session: str, payload: List[StudyPerformanceIn]):
    for item in payload:
        StudyPerformance.objects.update_or_create(
            student_id=item.student_id,
            date=perf_date,
            session_type=session,
            defaults={'performance': item.performance}
        )
    return {"success": True}

# 5. DERS VE SINAV İŞLEMLERİ
@api.get("/subjects", response=List[SubjectSchema])
def list_subjects(request, grade: int = None):
    if grade:
        return Subject.objects.filter(grade=grade).order_by('name')
    return Subject.objects.all().order_by('grade', 'name')

@api.get("/exams")
def list_exams(request, student_id: int):
    # get_object_or_404: Öğrenci bulunamazsa 404 hatası ver.
    student = get_object_or_404(Student, id=student_id)
    # select_related('subject'): Performans için, sınavları çekerken ders bilgilerini de tek seferde çek.
    exams = Exam.objects.filter(student=student).select_related('subject').order_by('-exam_date')
    
    # Veriyi frontend'in beklediği özel formata dönüştür.
    return [{
        'id': exam.id,
        'subject': {
            'id': exam.subject.id,
            'name': exam.subject.name,
            'grade': exam.subject.grade
        },
        'exam_type': exam.exam_type,
        'exam_type_display': exam.get_exam_type_display(), # Okunabilir sınav türü (örn: "1. Yazılı")
        'term': exam.term,
        'term_display': exam.get_term_display(),
        'score': float(exam.score),
        'exam_date': exam.exam_date
    } for exam in exams]

@api.post("/exams")
def save_exam(request, student_id: int, payload: ExamIn):
    student = get_object_or_404(Student, id=student_id)
    subject = get_object_or_404(Subject, id=payload.subject_id)
    
    # Sınav notunu kaydet veya güncelle.
    exam, created = Exam.objects.update_or_create(
        student=student,
        subject=subject,
        exam_type=payload.exam_type,
        term=payload.term,
        defaults={
            'score': payload.score,
            'exam_date': payload.exam_date
        }
    )
    
    return {"success": True, "exam_id": exam.id}

@api.delete("/exams/{exam_id}")
def delete_exam(request, exam_id: int):
    exam = get_object_or_404(Exam, id=exam_id)
    exam.delete() # Sınav kaydını sil.
    return {"success": True}

# 6. ÖZET VE ANALİZ İŞLEMLERİ
@api.get("/student-summary/{student_id}")
def get_summary(request, student_id: int):
    # Tek bir öğrencinin detaylı özetini getiren servisi çağır.
    summary = get_student_summary(student_id)
    if summary:
        return summary
    return {"error": "Student not found"}

@api.post("/generate-report/{student_id}")
def generate_report(request, student_id: int):
    # Yapay zeka ile öğrenci raporu oluşturan servisi çağır.
    report = generate_student_report(student_id)
    return {
        "report": report,
        "generated_at": date.today()
    }

@api.get("/analytics")
def get_analytics(request, grade: int = None, days: int = 30, start_date: str = None, end_date: str = None):
    """
    Genel analiz verilerini getirir.
    Sınıf ve gün sayısına göre filtreleme yapılabilir.
    Ayrıca özel tarih aralığı (start_date, end_date) verilebilir.
    """
    # Tarih stringlerini date objesine çevir
    s_date = None
    e_date = None
    
    if start_date:
        try:
            s_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        except ValueError:
            pass
            
    if end_date:
        try:
            e_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            pass
            
    analytics_data = get_overall_analytics(grade=grade, days=days, start_date=s_date, end_date=e_date)
    return analytics_data

@api.get("/daily-summary")
def get_daily_summary_api(request, date: str = None):
    """
    Günün özeti verilerini getirir.
    Ana sayfadaki kartlar için kullanılır.
    """
    if date:
        try:
            # Gelen tarih string'ini (2023-10-27) tarih objesine çevir.
            summary_date = datetime.strptime(date, '%Y-%m-%d').date()
        except ValueError:
            return {"error": "Invalid date format. Use YYYY-MM-DD"}
    else:
        summary_date = None
    
    return get_daily_summary(summary_date)

@api.get("/student-weekly-report/{student_id}")
def get_student_weekly_report_endpoint(request, student_id: int, start_date: str = None, end_date: str = None):
    """
    Belirli bir öğrencinin haftalık performans raporunu getirir.
    Velilere sunmak için kullanılır.
    
    Args:
        student_id: Öğrenci ID
        start_date: Başlangıç tarihi (YYYY-MM-DD formatında, opsiyonel)
        end_date: Bitiş tarihi (YYYY-MM-DD formatında, opsiyonel)
    
    Returns:
        Haftalık rapor verisi
    """
    from .weekly_report import get_student_weekly_report
    
    # Tarih stringlerini date objesine çevir
    s_date = None
    e_date = None
    
    if start_date:
        try:
            s_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        except ValueError:
            return {"error": "Invalid start_date format. Use YYYY-MM-DD"}
    
    if end_date:
        try:
            e_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return {"error": "Invalid end_date format. Use YYYY-MM-DD"}
    
    report = get_student_weekly_report(student_id, s_date, e_date)
    
    if report is None:
        return {"error": "Student not found"}
    
    return report
