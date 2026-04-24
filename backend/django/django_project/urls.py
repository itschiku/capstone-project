from django.urls import path
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import connection
import json

def health(request):
    return JsonResponse({"status": "healthy", "backend": "Django"})

def get_users(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT id, name, email, created_at FROM users ORDER BY id DESC")
        users = cursor.fetchall()
    return JsonResponse([{"id": u[0], "name": u[1], "email": u[2], "created_at": u[3]} for u in users], safe=False)

@csrf_exempt
def post_users(request):
    data = json.loads(request.body)
    with connection.cursor() as cursor:
        cursor.execute("INSERT INTO users (name, email, created_at) VALUES (%s, %s, NOW())", [data['name'], data['email']])
        cursor.execute("SELECT LAST_INSERT_ID()")
        user_id = cursor.fetchone()[0]
    return JsonResponse({"id": user_id, "name": data['name'], "email": data['email']}, status=201)

urlpatterns = [
    path('health', health),
    path('users', get_users),
    path('users', post_users),
]
