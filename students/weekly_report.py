from datetime import datetime, timedelta
from .models import Student, BedCheck, PrayerAttendance, StudyPerformance

def get_student_weekly_report(student_id, start_date=None, end_date=None):
    """
    Öğrencinin haftalık performans raporunu oluşturur.
    Velilere sunmak için detaylı günlük ve genel istatistikler döner.
    
    Args:
        student_id: Öğrenci ID
        start_date: Başlangıç tarihi (datetime.date)
        end_date: Bitiş tarihi (datetime.date)
    
    Returns:
        Haftalık rapor verisi (dictionary)
    """
    
    # Öğrenciyi getir
    try:
        student = Student.objects.get(id=student_id)
    except Student.DoesNotExist:
        return None
    
    # Tarih aralığını belirle (varsayılan: son 7 gün)
    if not end_date:
        end_date = datetime.now().date()
    
    if not start_date:
        start_date = end_date - timedelta(days=6)  # 7 günlük veri (bugün dahil)
    
    # Verileri topla
    bed_checks = BedCheck.objects.filter(
        student=student,
        date__range=[start_date, end_date]
    ).order_by('date')
    
    prayers = PrayerAttendance.objects.filter(
        student=student,
        date__range=[start_date, end_date]
    ).order_by('date', 'prayer_time')
    
    studies = StudyPerformance.objects.filter(
        student=student,
        date__range=[start_date, end_date]
    ).order_by('date', 'session_type')
    
    # Yatak puanı hesaplama
    total_bed = bed_checks.count()
    tidy_bed = bed_checks.filter(is_tidy=True).count()
    bed_score = (tidy_bed / total_bed * 100) if total_bed > 0 else 0
    
    # Namaz puanı hesaplama
    total_prayers = prayers.count()
    geldi_count = prayers.filter(status='geldi').count()
    gec_kaldi_count = prayers.filter(status='gec_kaldi').count()
    mazeret_count = prayers.filter(status='mazeret').count()
    
    total_prayers_for_calc = total_prayers - mazeret_count
    if total_prayers_for_calc > 0:
        prayer_score = (geldi_count * 100 + gec_kaldi_count * 70) / total_prayers_for_calc
    else:
        prayer_score = 0
    
    # Etüt puanı hesaplama
    perf_map = {'mukemmel': 5, 'iyi': 4, 'orta': 3, 'zayif': 2, 'katilmadi': 0}
    study_scores = []
    for s in studies:
        if s.performance in perf_map:
            study_scores.append(perf_map[s.performance])
    
    avg_study = sum(study_scores) / len(study_scores) if study_scores else 0
    study_score_percentage = (avg_study / 5 * 100) if avg_study > 0 else 0
    
    # Genel puan (ağırlıklı)
    total_weight = 0
    weighted_sum = 0
    
    if total_prayers_for_calc > 0:
        weighted_sum += prayer_score * 0.4
        total_weight += 0.4
    
    if total_bed > 0:
        weighted_sum += bed_score * 0.3
        total_weight += 0.3
    
    if study_scores:
        weighted_sum += study_score_percentage * 0.3
        total_weight += 0.3
    
    overall_score = (weighted_sum / total_weight) if total_weight > 0 else 0
    
    # Günlük detaylar oluştur
    daily_details = []
    current_date = start_date
    
    while current_date <= end_date:
        # O günün verileri
        day_bed = bed_checks.filter(date=current_date).first()
        day_prayers = prayers.filter(date=current_date)
        day_studies = studies.filter(date=current_date)
        
        # Namaz detayları
        prayer_details = {}
        for prayer in day_prayers:
            prayer_details[prayer.prayer_time] = {
                'status': prayer.status,
                'display': prayer.get_status_display()
            }
        
        # Etüt detayları
        study_details = {}
        for study in day_studies:
            study_details[study.session_type] = {
                'performance': study.performance,
                'display': study.get_performance_display()
            }
        
        daily_details.append({
            'date': current_date.isoformat(),
            'day_name': current_date.strftime('%A'),  # Pazartesi, Salı, vb.
            'bed': {
                'status': 'tidy' if day_bed and day_bed.is_tidy else ('untidy' if day_bed else 'no_data'),
                'display': 'Düzenli' if day_bed and day_bed.is_tidy else ('Düzensiz' if day_bed else '-')
            },
            'prayers': prayer_details,
            'studies': study_details
        })
        
        current_date += timedelta(days=1)
    
    # Performans durumu belirleme
    if overall_score >= 90:
        performance_level = 'excellent'
        performance_text = 'Mükemmel'
    elif overall_score >= 75:
        performance_level = 'good'
        performance_text = 'İyi'
    elif overall_score >= 60:
        performance_level = 'fair'
        performance_text = 'Gelişmeli'
    else:
        performance_level = 'needs_attention'
        performance_text = 'Dikkat Gerekli'
    
    return {
        'student': {
            'id': student.id,
            'name': f"{student.first_name} {student.last_name}",
            'grade': student.grade,
            'student_number': student.student_number
        },
        'period': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'days_count': (end_date - start_date).days + 1
        },
        'summary': {
            'overall_score': round(overall_score, 1),
            'performance_level': performance_level,
            'performance_text': performance_text,
            'bed_score': round(bed_score, 1),
            'prayer_score': round(prayer_score, 1),
            'study_score': round(study_score_percentage, 1),
            'bed_stats': {
                'total': total_bed,
                'tidy': tidy_bed,
                'untidy': total_bed - tidy_bed
            },
            'prayer_stats': {
                'total': total_prayers,
                'geldi': geldi_count,
                'gec_kaldi': gec_kaldi_count,
                'gelmedi': total_prayers - geldi_count - gec_kaldi_count - mazeret_count,
                'mazeret': mazeret_count
            },
            'study_stats': {
                'total': len(study_scores),
                'average': round(avg_study, 2)
            }
        },
        'daily_details': daily_details
    }
