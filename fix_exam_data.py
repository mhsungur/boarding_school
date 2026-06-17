import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from students.models import Exam

def fix_exam_types():
    print("🔍 Checking for inconsistent exam types...")
    
    # Map of old/wrong values to new/correct values
    corrections = {
        'yazili1': 'yazili_1',
        'yazili2': 'yazili_2',
        'yazili': 'yazili_1', # Fix for 'yazili'
        'sozlu1': 'sozlu', # Just in case
        'sozlu2': 'sozlu',
        # Add others if needed
    }
    
    count = 0
    for wrong, correct in corrections.items():
        exams = Exam.objects.filter(exam_type=wrong)
        if exams.exists():
            print(f"Found {exams.count()} exams with type '{wrong}'. Updating to '{correct}'...")
            updated = exams.update(exam_type=correct)
            count += updated
            
    if count > 0:
        print(f"✅ Successfully updated {count} exam records.")
    else:
        print("✅ No inconsistent exam types found.")

    # Verify current types
    print("\nCurrent Exam Types Distribution:")
    from django.db.models import Count
    dist = Exam.objects.values('exam_type').annotate(count=Count('id'))
    for item in dist:
        print(f"- {item['exam_type']}: {item['count']}")

if __name__ == "__main__":
    fix_exam_types()
