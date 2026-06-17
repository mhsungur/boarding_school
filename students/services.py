from django.db.models import Count, Q, Avg
from .models import Student, BedCheck, PrayerAttendance, StudyPerformance, Exam
from datetime import datetime, timedelta

def get_student_summary(student_id):
    """
    Aggregates all tracking data for a student into a structured summary.
    """
    try:
        student = Student.objects.get(id=student_id)
    except Student.DoesNotExist:
        return None

    # Time range: Last 30 days for trends (can be adjusted)
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=30)

    # 1. Bed Checks
    bed_checks = BedCheck.objects.filter(student=student, date__range=[start_date, end_date])
    total_bed = bed_checks.count()
    tidy_count = bed_checks.filter(is_tidy=True).count()
    bed_stats = {
        "total_checks": total_bed,
        "tidy_count": tidy_count,
        "tidy_rate": (tidy_count / total_bed * 100) if total_bed > 0 else 0
    }

    # 2. Prayer Attendance (Weighted System)
    prayers = PrayerAttendance.objects.filter(student=student, date__range=[start_date, end_date])
    total_prayers = prayers.count()
    
    # Count each status
    geldi_count = prayers.filter(status='geldi').count()
    gec_kaldi_count = prayers.filter(status='gec_kaldi').count()
    gelmedi_count = prayers.filter(status='gelmedi').count()
    mazeret_count = prayers.filter(status='mazeret').count()
    
    # Exclude 'mazeret' from calculation (neutral)
    total_prayers_for_calc = total_prayers - mazeret_count
    
    # Weighted scoring: geldi=100%, gec_kaldi=70%, gelmedi=0%
    if total_prayers_for_calc > 0:
        attendance_rate = (geldi_count * 100 + gec_kaldi_count * 70) / total_prayers_for_calc
    else:
        attendance_rate = 0
    
    prayer_stats = {
        "total_tracked": total_prayers,
        "attended": geldi_count,
        "late": gec_kaldi_count,
        "missed": gelmedi_count,
        "excused": mazeret_count,
        "attendance_rate": round(attendance_rate, 1)
    }

    # 3. Study Performance
    studies = StudyPerformance.objects.filter(student=student, date__range=[start_date, end_date])
    # Map performance to numeric score for averaging: mukemmel=5, iyi=4, orta=3, zayif=2, katilmadi=0
    perf_map = {'mukemmel': 5, 'iyi': 4, 'orta': 3, 'zayif': 2, 'katilmadi': 0}
    
    study_scores = []
    for s in studies:
        if s.performance in perf_map:
            study_scores.append(perf_map[s.performance])
            
    avg_study_score = sum(study_scores) / len(study_scores) if study_scores else 0
    study_stats = {
        "total_sessions": studies.count(),
        "average_score_5_scale": round(avg_study_score, 1),
        "details": list(studies.values('session_type', 'performance', 'date')[:5]) # Last 5 sessions
    }

    # 4. School Exams
    exams = Exam.objects.filter(student=student).order_by('-exam_date')
    exam_list = []
    for e in exams:
        exam_list.append({
            "subject": e.subject.name,
            "type": e.get_exam_type_display(),
            "score": float(e.score),
            "term": e.get_term_display()
        })

    return {
        "student_name": f"{student.first_name} {student.last_name}",
        "grade": student.grade,
        "period": "Last 30 Days",
        "bed_stats": bed_stats,
        "prayer_stats": prayer_stats,
        "study_stats": study_stats,
        "exams": exam_list
    }
