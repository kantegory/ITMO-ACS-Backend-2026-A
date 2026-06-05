"""
Script to initialize the database with roles
"""
import django
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'restaurant_api.settings')

django.setup()

from api.models import Role

roles_data = [
    {'name': 'admin'},
    {'name': 'user'},
    {'name': 'owner'},
]

for role_data in roles_data:
    role, created = Role.objects.get_or_create(
        name=role_data['name'],
        defaults=role_data
    )
    if created:
        print(f"Created role: {role.name}")
    else:
        print(f"Role already exists: {role.name}")

print("Database seeding completed!")
