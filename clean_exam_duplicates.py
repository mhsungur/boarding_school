import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from students.models import Exam

print("Cleaning up exam records...")
print("-" * 50)

# Delete all exams with old incorrect format
old_formats = ['yazili', 'yazili2', 'sözlü', 'söz', 'perf']
deleted_count = 0

for old_format in old_formats:
    exams_to_delete = Exam.objects.filter(exam_type=old_format)
    count = exams_to_delete.count()
    if count > 0:
        print(f"Deleting {count} exams with type '{old_format}'...")
        exams_to_delete.delete()
        deleted_count += count

print(f"\nTotal deleted: {deleted_count}")
print("-" * 50)

# Show remaining exams
print("\nRemaining exam types in database:")
from django.db.models import Count
type_counts = Exam.objects.values('exam_type').annotate(count=Count('id'))
for tc in type_counts:
    print(f"  {tc['exam_type']}: {tc['count']} exams")

total_remaining = Exam.objects.count()
print(f"\nTotal exams remaining: {total_remaining}")
