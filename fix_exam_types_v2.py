import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from students.models import Exam

# Mapping of incorrect exam types to correct ones
corrections = {
    'yazili': 'yazili_1',
    'yazili2': 'yazili_2',
    'sözlü': 'sozlu',
    'söz': 'sozlu',
    'perf': 'performans',
}

print("Checking and fixing exam types...")
print("-" * 50)

# Get all exams with incorrect types
all_exams = Exam.objects.all()
fixed_count = 0

for exam in all_exams:
    if exam.exam_type in corrections:
        old_type = exam.exam_type
        new_type = corrections[old_type]
        exam.exam_type = new_type
        exam.save()
        fixed_count += 1
        print(f"Fixed: Student {exam.student_id}, Subject {exam.subject.name}: '{old_type}' -> '{new_type}'")

print("-" * 50)
print(f"Total exams fixed: {fixed_count}")

# Show current exam types distribution
print("\nCurrent exam types in database:")
from django.db.models import Count
type_counts = Exam.objects.values('exam_type').annotate(count=Count('id'))
for tc in type_counts:
    print(f"  {tc['exam_type']}: {tc['count']} exams")
