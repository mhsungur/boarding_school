import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Create admin user
username = 'hasbahce'
password = 'has.123'

if User.objects.filter(username=username).exists():
    print(f"User '{username}' already exists!")
    user = User.objects.get(username=username)
    # Update password in case it changed
    user.set_password(password)
    user.save()
    print(f"Password updated for user '{username}'")
else:
    user = User.objects.create_user(
        username=username,
        password=password
    )
    print(f"✅ User '{username}' created successfully!")
    print(f"Username: {username}")
    print(f"Password: {password}")
