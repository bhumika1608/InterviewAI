from rest_framework.decorators import api_view
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .services import AIServiceError, prepare_resume_interview, evaluate_answer


@api_view(['GET'])
def ai_health(request):
    return Response({'status': 'ok', 'service': 'ai'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_resume(request):
    text = (request.data.get('resume_text') or '').strip()
    if not text:
        return Response({'detail': 'resume_text is required.'}, status=400)

    try:
        analysis, questions = prepare_resume_interview(
            text,
            count=int(request.data.get('count', 5)),
        )
    except AIServiceError as error:
        return Response({'detail': str(error)}, status=503)
    return Response({**analysis, 'questions': questions})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def evaluate_answer_endpoint(request):
    question = request.data.get('question', '')
    answer = request.data.get('answer', '')
    if not question or not answer:
        return Response({'detail': 'question and answer are required.'}, status=400)

    try:
        result = evaluate_answer(question, answer)
    except AIServiceError as error:
        return Response({'detail': str(error)}, status=503)
    return Response(result)
