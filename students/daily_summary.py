from django.db.models import Count, Q, Avg
from .models import Student, BedCheck, PrayerAttendance, StudyPerformance
from datetime import datetime, timedelta

def get_daily_summary(date=None):
    """
    Generate a comprehensive daily summary of all tracking data.
    
    Args:
        date: Date to generate summary for (default: today)
    
    Returns:
        Dictionary with summary statistics
    """
    if not date:
        date = datetime.now().date()
    
    # Get all students
    # Get all students
    all_students = Student.objects.all()
    total_students = all_students.count()
    
    # 1. GENERAL STATISTICS
    # Count how many students have at least one data entry today
    students_with_data = set()
    
    # Bulk fetch all data for today
    bed_today = BedCheck.objects.filter(date=date)
    prayer_today = PrayerAttendance.objects.filter(date=date)
    study_today = StudyPerformance.objects.filter(date=date)
    
    # Create maps for fast lookup (O(1) access inside loop)
    # bed_map: student_id -> BedCheck object
    bed_map = {b.student_id: b for b in bed_today}
    
    # prayer_map: student_id -> list of PrayerAttendance objects
    prayer_map = {}
    for p in prayer_today:
        if p.student_id not in prayer_map:
            prayer_map[p.student_id] = []
        prayer_map[p.student_id].append(p)
        
    # study_map: student_id -> list of StudyPerformance objects
    study_map = {}
    for s in study_today:
        if s.student_id not in study_map:
            study_map[s.student_id] = []
        study_map[s.student_id].append(s)
    
    students_with_data.update(bed_today.values_list('student_id', flat=True))
    students_with_data.update(prayer_today.values_list('student_id', flat=True))
    students_with_data.update(study_today.values_list('student_id', flat=True))
    
    data_completion = len(students_with_data)
    missing_data = total_students - data_completion
    
    # 2. PRAYER STATISTICS (All prayer times for today)
    prayer_counts = {
        'geldi': prayer_today.filter(status='geldi').count(),
        'gec_kaldi': prayer_today.filter(status='gec_kaldi').count(),
        'gelmedi': prayer_today.filter(status='gelmedi').count(),
        'mazeret': prayer_today.filter(status='mazeret').count(),
    }
    
    # Calculate prayer rate using weighted system
    total_prayers = prayer_today.count()
    prayers_for_calc = total_prayers - prayer_counts['mazeret']
    if prayers_for_calc > 0:
        prayer_rate = (prayer_counts['geldi'] * 100 + prayer_counts['gec_kaldi'] * 70) / prayers_for_calc
    else:
        prayer_rate = 0
    
    # 3. BED CHECK STATISTICS
    bed_counts = {
        'tidy': bed_today.filter(is_tidy=True).count(),
        'untidy': bed_today.filter(is_tidy=False).count(),
    }
    total_beds = bed_today.count()
    bed_rate = (bed_counts['tidy'] / total_beds * 100) if total_beds > 0 else 0
    
    # 4. STUDY PERFORMANCE STATISTICS
    study_counts = {
        'mukemmel': study_today.filter(performance='mukemmel').count(),
        'iyi': study_today.filter(performance='iyi').count(),
        'orta': study_today.filter(performance='orta').count(),
        'zayif': study_today.filter(performance='zayif').count(),
        'katilmadi': study_today.filter(performance='katilmadi').count(),
    }
    
    # Calculate average study score
    perf_map = {'mukemmel': 5, 'iyi': 4, 'orta': 3, 'zayif': 2, 'katilmadi': 0}
    study_scores = []
    for s in study_today:
        if s.performance in perf_map:
            study_scores.append(perf_map[s.performance])
    
    avg_study_score = sum(study_scores) / len(study_scores) if study_scores else 0
    study_rate = (avg_study_score / 5 * 100) if avg_study_score > 0 else 0
    
    # 5. IDENTIFY STUDENTS NEEDING ATTENTION (TODAY ONLY)
    warnings = []
    
    for student in all_students:
        issues = []
        
        # Check TODAY's prayer attendance (from map)
        student_prayers = prayer_map.get(student.id, [])
        # Filter out mazeret
        valid_prayers = [p for p in student_prayers if p.status != 'mazeret']
        
        if len(valid_prayers) > 0:
            missed_prayers = sum(1 for p in valid_prayers if p.status == 'gelmedi')
            if missed_prayers >= 2:  # 2 or more prayers missed TODAY
                issues.append(f'{missed_prayers} namaz eksik (bugün)')
        
        # Check TODAY's bed check (from map)
        student_bed = bed_map.get(student.id)
        
        if student_bed:
            if not student_bed.is_tidy:
                issues.append('Yatak düzensiz (bugün)')
        
        # Check TODAY's study performance (from map)
        student_studies = study_map.get(student.id, [])
        
        for study in student_studies:
            if study.performance == 'zayif':
                issues.append(f'Etüt zayıf - {study.get_session_type_display()} (bugün)')
            elif study.performance == 'katilmadi':
                issues.append(f'Etüte katılmadı - {study.get_session_type_display()} (bugün)')
        
        if issues:
            warnings.append({
                'student_id': student.id,
                'name': f'{student.first_name} {student.last_name}',
                'grade': student.grade,
                'issues': issues
            })
    
    # Sort by number of issues (most problematic first)
    warnings.sort(key=lambda x: len(x['issues']), reverse=True)
    
    # 6. IDENTIFY TOP PERFORMERS (TODAY ONLY)
    top_performers = []
    
    for student in all_students:
        # Calculate student's TODAY score using maps
        student_prayers = prayer_map.get(student.id, [])
        valid_prayers = [p for p in student_prayers if p.status != 'mazeret']
        
        student_bed = bed_map.get(student.id)
        student_studies = study_map.get(student.id, [])
        
        # Prayer score
        prayer_total = len(valid_prayers)
        if prayer_total > 0:
            geldi = sum(1 for p in valid_prayers if p.status == 'geldi')
            gec = sum(1 for p in valid_prayers if p.status == 'gec_kaldi')
            prayer_score = (geldi * 100 + gec * 70) / prayer_total
        else:
            prayer_score = 0
        
        # Bed score
        bed_score = 0
        if student_bed:
            bed_score = 100 if student_bed.is_tidy else 0
        
        # Study score
        study_scores_list = []
        for s in student_studies:
            if s.performance in perf_map:
                study_scores_list.append(perf_map[s.performance])
        study_score = (sum(study_scores_list) / len(study_scores_list) / 5 * 100) if study_scores_list else 0
        
        # Overall score (weighted average)
        # Only include students with at least some data today
        if prayer_total > 0 or student_bed or len(study_scores_list) > 0:
            total_weight = 0
            weighted_sum = 0
            
            if prayer_total > 0:
                weighted_sum += prayer_score * 0.4
                total_weight += 0.4
                
            if student_bed:
                weighted_sum += bed_score * 0.3
                total_weight += 0.3
                
            if study_scores_list:
                weighted_sum += study_score * 0.3
                total_weight += 0.3
            
            if total_weight > 0:
                overall_score = (weighted_sum / total_weight)
            else:
                overall_score = 0
            
            top_performers.append({
                'student_id': student.id,
                'name': f'{student.first_name} {student.last_name}',
                'grade': student.grade,
                'score': round(overall_score, 1)
            })
    
    # Sort by score and get top 5
    top_performers.sort(key=lambda x: x['score'], reverse=True)
    top_performers = top_performers[:5]
    
    # 7. CALCULATE OVERALL RATE
    total_weight = 0
    weighted_sum = 0
    
    # Check if we have valid rates (non-zero or meaningful data)
    # For prayer: if we have students
    if total_students > 0:
        weighted_sum += prayer_rate * 0.4
        total_weight += 0.4
        
    # For bed: if we have checks
    if bed_today.exists():
        weighted_sum += bed_rate * 0.3
        total_weight += 0.3
        
    # For study: if we have scores
    if study_today.exists():
        weighted_sum += study_rate * 0.3
        total_weight += 0.3
        
    if total_weight > 0:
        overall_rate = (weighted_sum / total_weight)
    else:
        overall_rate = 0
    
    return {
        'date': date.isoformat(),
        'general': {
            'total_students': total_students,
            'data_completion': data_completion,
            'missing_data': missing_data,
            'completion_percentage': round((data_completion / total_students * 100) if total_students > 0 else 0, 1)
        },
        'prayer': {
            **prayer_counts,
            'total': total_prayers,
            'rate': round(prayer_rate, 1)
        },
        'bed': {
            **bed_counts,
            'total': total_beds,
            'rate': round(bed_rate, 1)
        },
        'study': {
            **study_counts,
            'total': len(study_scores),
            'avg_score': round(avg_study_score, 2),
            'rate': round(study_rate, 1)
        },
        'overall_rate': round(overall_rate, 1),
        'warnings': warnings[:10],  # Top 10 students needing attention
        'top_performers': top_performers
    }
