from django.contrib.auth import authenticate, get_user_model, login as django_login, logout as django_logout
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

User = get_user_model()


@api_view(['GET'])
@ensure_csrf_cookie
def csrf_token(request):
    return Response({'csrfToken': get_token(request)})


@api_view(['GET'])
def health_check(request):
    return Response({'status': 'ok', 'service': 'users'})


@api_view(['POST'])
@csrf_exempt
def register(request):
    username = (request.data.get('username') or request.data.get('email') or '').strip()
    email = (request.data.get('email') or '').strip()
    password = request.data.get('password') or ''
    full_name = (request.data.get('full_name') or '').strip()
    if not username or not password:
        return Response({'detail': 'Email and password are required.'}, status=400)
    if len(password) < 8:
        return Response({'detail': 'Password must be at least 8 characters.'}, status=400)
    if User.objects.filter(username=username).exists():
        return Response({'detail': 'An account with this email already exists.'}, status=400)

    user = User.objects.create_user(username=username, email=email, password=password)
    user.first_name = full_name
    user.save(update_fields=['first_name'])
    django_login(request, user)
    return Response({'user': {'id': user.id, 'username': user.username, 'email': user.email}}, status=201)


@api_view(['POST'])
@csrf_exempt
def login(request):
    username = (request.data.get('username') or request.data.get('email') or '').strip()
    password = request.data.get('password') or ''
    user = authenticate(username=username, password=password)
    if not user:
        return Response({'detail': 'Invalid email or password.'}, status=400)
    django_login(request, user)
    return Response({'user': {'id': user.id, 'username': user.username, 'email': user.email}})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    django_logout(request)
    return Response({'detail': 'Logged out.'})
