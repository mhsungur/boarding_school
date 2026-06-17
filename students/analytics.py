import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from django.db.models import Count, Q, Avg
from .models import Student, BedCheck, PrayerAttendance, StudyPerformance

# ==========================================
# GENEL ANALİZ HESAPLAMALARI
# ==========================================
# Bu fonksiyon, tüm öğrencilerin performans verilerini (yatak, namaz, etüt)
# belirli bir tarih aralığı için (varsayılan son 30 gün) analiz eder.
# Pandas kütüphanesi kullanılarak veri işleme ve sıralama yapılır.

def get_overall_analytics(grade=None, days=30, start_date=None, end_date=None):
    """
    Tüm öğrenciler için kapsamlı analiz raporu oluşturur.
    
    Args:
        grade: Sınıf filtresi (Opsiyonel, örn: 8)
        days: Kaç günlük veri analiz edilecek? (Varsayılan: 30 gün)
        start_date: Başlangıç tarihi (Opsiyonel, days yerine kullanılır)
        end_date: Bitiş tarihi (Opsiyonel, days yerine kullanılır)
    
    Returns:
        Öğrenci listesi, sınıf istatistikleri, en iyiler ve uyarılar içeren bir sözlük döner.
    """
    
    # Analiz yapılacak tarih aralığını belirle
    if not end_date:
        end_date = datetime.now().date() # Bugün
    
    if not start_date:
        start_date = end_date - timedelta(days=days) # 'days' gün öncesi
    
    # Öğrencileri ve ilişkili verileri tek seferde çek (Prefetch)
    from django.db.models import Prefetch
    
    # 1. Bed Checks Prefetch
    bed_qs = BedCheck.objects.filter(date__range=[start_date, end_date])
    
    # 2. Prayer Prefetch
    prayer_qs = PrayerAttendance.objects.filter(date__range=[start_date, end_date])
    
    # 3. Study Prefetch
    study_qs = StudyPerformance.objects.filter(date__range=[start_date, end_date])
    
    students_qs = Student.objects.all().prefetch_related(
        Prefetch('bed_checks', queryset=bed_qs, to_attr='prefetched_bed_checks'),
        Prefetch('prayer_attendances', queryset=prayer_qs, to_attr='prefetched_prayers'),
        Prefetch('study_performances', queryset=study_qs, to_attr='prefetched_studies')
    )
    
    if grade:
        students_qs = students_qs.filter(grade=grade)
    
    students_list = []
    
    # Her bir öğrenci için döngü (Artık veritabanına gitmez, hafızadan okur)
    for student in students_qs:
        
        # ------------------------------------------
        # 1. YATAK KONTROL PUANI HESAPLAMA
        # ------------------------------------------
        # Hafızadaki listeyi kullan
        bed_checks = student.prefetched_bed_checks
        
        total_bed = len(bed_checks)
        tidy_bed = sum(1 for b in bed_checks if b.is_tidy)
        
        bed_score = (tidy_bed / total_bed * 100) if total_bed > 0 else 0
        
        # ------------------------------------------
        # 2. NAMAZ YOKLAMA PUANI HESAPLAMA (AĞIRLIKLI SİSTEM)
        # ------------------------------------------
        prayers = student.prefetched_prayers
        total_prayers = len(prayers)
        
        # Her durumun sayısını bul (Python list comprehension ile)
        geldi_count = sum(1 for p in prayers if p.status == 'geldi')
        gec_kaldi_count = sum(1 for p in prayers if p.status == 'gec_kaldi')
        gelmedi_count = sum(1 for p in prayers if p.status == 'gelmedi')
        mazeret_count = sum(1 for p in prayers if p.status == 'mazeret')
        
        # 'Mazeretli' durumları hesaplamaya katma (Nötr)
        total_prayers_for_calc = total_prayers - mazeret_count
        
        # Ağırlıklı Puanlama
        if total_prayers_for_calc > 0:
            prayer_score = (geldi_count * 100 + gec_kaldi_count * 70) / total_prayers_for_calc
        else:
            prayer_score = 0
        
        # ------------------------------------------
        # 3. ETÜT PERFORMANS PUANI HESAPLAMA
        # ------------------------------------------
        studies = student.prefetched_studies
        
        # Sözel notları sayısal puanlara çevir (1-5 arası)
        perf_map = {'mukemmel': 5, 'iyi': 4, 'orta': 3, 'zayif': 2, 'katilmadi': 0}
        study_scores = []
        for s in studies:
            if s.performance in perf_map:
                study_scores.append(perf_map[s.performance])
        
        # Ortalama hesapla
        study_score = np.mean(study_scores) if study_scores else 0
        # 100'lük sisteme çevir
        study_score_percentage = (study_score / 5 * 100) if study_score > 0 else 0
        
        # ------------------------------------------
        # 4. GENEL PUAN (AĞIRLIKLI ORTALAMA)
        # ------------------------------------------
        
        total_weight = 0
        weighted_sum = 0
        
        # Sadece verisi olan (ve mazeretli olmayan) kategorileri hesaba kat
        
        if total_prayers_for_calc > 0:
            weighted_sum += prayer_score * 0.4
            total_weight += 0.4
            
        if total_bed > 0:
            weighted_sum += bed_score * 0.3
            total_weight += 0.3
            
        if study_scores:
            weighted_sum += study_score_percentage * 0.3
            total_weight += 0.3
            
        if total_weight > 0:
            overall_score = (weighted_sum / total_weight)
        else:
            overall_score = 0
        
        # Hesaplanan verileri listeye ekle
        students_list.append({
            'id': student.id,
            'name': f"{student.first_name} {student.last_name}",
            'grade': student.grade,
            'bed_score': round(bed_score, 1),
            'prayer_score': round(prayer_score, 1),
            'study_score': round(study_score, 2),
            'study_score_percentage': round(study_score_percentage, 1),
            'overall_score': round(overall_score, 1),
            'total_bed_checks': total_bed,
            'total_prayers': total_prayers,
            'total_prayers_calc': total_prayers_for_calc, # Mazeretsiz namaz sayısı
            'total_study_sessions': len(study_scores)
        })
    
    # ------------------------------------------
    # VERİ ANALİZİ VE SIRALAMA (PANDAS)
    # ------------------------------------------
    # Listeyi Pandas DataFrame'e çevir (Excel tablosu gibi düşünün)
    df = pd.DataFrame(students_list)
    
    if df.empty:
        return {
            "students": [],
            "grade_stats": {},
            "top_performers": [],
            "needs_attention": [],
            "summary": {
                "total_students": 0,
                "avg_bed": 0,
                "avg_prayer": 0,
                "avg_study": 0,
                "avg_overall": 0
            }
        }
    
    # Genel puana göre sırala (En yüksekten en düşüğe)
    df = df.sort_values('overall_score', ascending=False)
    
    # Sınıf Bazlı İstatistikler
    # Her sınıfın (5, 6, 7, 8) ortalamalarını ayrı ayrı hesapla
    grade_stats = {}
    for g in df['grade'].unique():
        grade_df = df[df['grade'] == g]
        
        # Sadece verisi olan öğrencilerin ortalamasını al (0'ları dahil etme)
        avg_bed = grade_df[grade_df['total_bed_checks'] > 0]['bed_score'].mean()
        avg_prayer = grade_df[grade_df['total_prayers_calc'] > 0]['prayer_score'].mean()
        avg_study = grade_df[grade_df['total_study_sessions'] > 0]['study_score'].mean()
        avg_study_pct = grade_df[grade_df['total_study_sessions'] > 0]['study_score_percentage'].mean()
        
        # Sınıf GENEL Puanını, sınıfın ortalamalarından hesapla (Tutarlılık için)
        # Aksi takdirde "Ortalamaların Ortalaması" ile "Genel Puanların Ortalaması" fark edebilir.
        
        g_total_weight = 0
        g_weighted_sum = 0
        
        if not pd.isna(avg_prayer):
            g_weighted_sum += avg_prayer * 0.4
            g_total_weight += 0.4
            
        if not pd.isna(avg_bed):
            g_weighted_sum += avg_bed * 0.3
            g_total_weight += 0.3
            
        if not pd.isna(avg_study_pct):
            g_weighted_sum += avg_study_pct * 0.3
            g_total_weight += 0.3
            
        if g_total_weight > 0:
            avg_overall = g_weighted_sum / g_total_weight
        else:
            avg_overall = 0
        
        grade_stats[str(g)] = {
            'bed': round(avg_bed, 1) if not pd.isna(avg_bed) else 0,
            'prayer': round(avg_prayer, 1) if not pd.isna(avg_prayer) else 0,
            'study': round(avg_study, 2) if not pd.isna(avg_study) else 0,
            'overall': round(avg_overall, 1),
            'student_count': len(grade_df)
        }
    
    # En İyiler (İlk 5 öğrenci)
    top_performers = df.head(5).to_dict('records')
    
    # İlgi Gerektirenler (Puanı 60'ın altında olanlar veya son 5)
    needs_attention = df[df['overall_score'] < 60].head(5).to_dict('records')
    
    # Okul Geneli Özet İstatistikler
    # Burada da 0'ları filtreleyerek ortalama alıyoruz
    
    avg_bed_total = df[df['total_bed_checks'] > 0]['bed_score'].mean()
    avg_prayer_total = df[df['total_prayers_calc'] > 0]['prayer_score'].mean()
    avg_study_total = df[df['total_study_sessions'] > 0]['study_score'].mean()
    avg_study_pct_total = df[df['total_study_sessions'] > 0]['study_score_percentage'].mean()
    
    # Okul Genel Puanı Hesaplama (Ortalamalardan)
    s_total_weight = 0
    s_weighted_sum = 0
    
    if not pd.isna(avg_prayer_total):
        s_weighted_sum += avg_prayer_total * 0.4
        s_total_weight += 0.4
        
    if not pd.isna(avg_bed_total):
        s_weighted_sum += avg_bed_total * 0.3
        s_total_weight += 0.3
        
    if not pd.isna(avg_study_pct_total):
        s_weighted_sum += avg_study_pct_total * 0.3
        s_total_weight += 0.3
        
    if s_total_weight > 0:
        avg_overall_total = s_weighted_sum / s_total_weight
    else:
        avg_overall_total = 0

    summary = {
        'total_students': len(df),
        'avg_bed': round(avg_bed_total, 1) if not pd.isna(avg_bed_total) else 0,
        'avg_prayer': round(avg_prayer_total, 1) if not pd.isna(avg_prayer_total) else 0,
        'avg_study': round(avg_study_total, 2) if not pd.isna(avg_study_total) else 0,
        'avg_overall': round(avg_overall_total, 1)
    }
    
    return {
        "students": df.to_dict('records'),
        "grade_stats": grade_stats,
        "top_performers": top_performers,
        "needs_attention": needs_attention,
        "summary": summary
    }
