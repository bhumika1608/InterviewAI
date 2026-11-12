import io

import fitz
from docx import Document
from rest_framework.decorators import api_view
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.ai.services import AIServiceError, prepare_resume_interview
from .models import ResumeProfile


@api_view(['GET'])
def resume_health(request):
    return Response({'status': 'ok', 'service': 'resumes'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_resume(request):
    file_obj = request.FILES.get('resume')
    resume_text = (request.data.get('resume_text') or '').strip()
    if not file_obj and not resume_text:
        return Response({'detail': 'Resume file or text is required.'}, status=400)

    raw_text = resume_text
    file_name = file_obj.name if file_obj else 'resume.txt'
    file_type = 'text'

    if file_obj:
        content = file_obj.read()
        filename = file_obj.name.lower()
        if filename.endswith('.pdf'):
            file_type = 'pdf'
            with fitz.open(stream=content, filetype='pdf') as pdf:
                text_chunks = [page.get_text('text') for page in pdf]
            raw_text = '\n'.join(text_chunks)
        elif filename.endswith('.docx'):
            file_type = 'docx'
            doc = Document(io.BytesIO(content))
            raw_text = '\n'.join(paragraph.text for paragraph in doc.paragraphs if paragraph.text.strip())
        else:
            raw_text = content.decode('utf-8', errors='ignore')

    raw_text = raw_text.strip()
    if not raw_text:
        return Response({'detail': 'Could not extract any text from the resume.'}, status=400)

    try:
        analysis, questions = prepare_resume_interview(raw_text, count=5)
    except AIServiceError as error:
        return Response({'detail': str(error)}, status=503)

    resume = ResumeProfile.objects.create(
        user=request.user if request.user.is_authenticated else None,
        file_name=file_name,
        file_type=file_type,
        raw_text=raw_text,
        summary=analysis['summary'],
        skills=analysis['skills'],
        experience_years=analysis['experience_years'],
        education=analysis['education'],
    )

    return Response({
        'id': resume.id,
        'file_name': resume.file_name,
        'profile': analysis['profile'],
        'skills': analysis['skills'],
        'summary': analysis['summary'],
        'experience_years': analysis['experience_years'],
        'education': analysis['education'],
        'questions': questions,
        'resume_text': raw_text,
    }, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def resume_summary(request):
    resumes = ResumeProfile.objects.filter(user=request.user).order_by('-created_at')
    skills = []
    for resume in resumes:
        skills.extend(resume.skills)

    latest_resume = resumes.first()
    return Response({
        'total_resumes': resumes.count(),
        'total_skills': len(sorted(set(skills))),
        'latest_resume': {
            'id': latest_resume.id,
            'file_name': latest_resume.file_name,
            'summary': latest_resume.summary,
            'skills': latest_resume.skills,
            'education': latest_resume.education,
            'experience_years': latest_resume.experience_years,
            'scanned_at': latest_resume.scanned_at.isoformat() if latest_resume.scanned_at else None,
        } if latest_resume else None,
        'skills': sorted(set(skills)),
    })
