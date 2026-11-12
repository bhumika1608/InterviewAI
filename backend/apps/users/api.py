from rest_framework.decorators import api_view
from rest_framework.response import Response

from .serializers import UserSerializer


@api_view(['GET'])
def user_summary(request):
    if not request.user.is_authenticated:
        return Response({'detail': 'Authentication required.'}, status=401)

    serializer = UserSerializer(request.user)
    return Response(serializer.data)
