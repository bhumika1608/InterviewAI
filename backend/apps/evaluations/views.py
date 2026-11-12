from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def evaluation_health(request):
    return Response({'status': 'ok', 'service': 'evaluations'})
