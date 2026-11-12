import io
import threading

import fitz
from docx import Document
from django.db.models import Avg, Count, Max, Q
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.ai.services import AIServiceError, evaluate_answer, generate_interview_review, prepare_resume_interview
from apps.ai.speech import transcribe_audio
from apps.interviews.models import InterviewQuestion, InterviewSession
from apps.resumes.models import ResumeProfile

_face_mesh = None
_face_mesh_lock = threading.Lock()


def extract_uploaded_resume(file_obj):
    content = file_obj.read()
    filename = file_obj.name.lower()
    if filename.endswith('.pdf'):
        with fitz.open(stream=content, filetype='pdf') as pdf:
            return '\n'.join(page.get_text('text') for page in pdf), 'pdf'
    if filename.endswith('.docx'):
        document = Document(io.BytesIO(content))
        return '\n'.join(paragraph.text for paragraph in document.paragraphs if paragraph.text.strip()), 'docx'
    if not filename.endswith('.txt'):
        raise ValueError('Use a PDF, DOCX, or TXT resume file.')
    return content.decode('utf-8', errors='ignore'), 'text'


def analyze_camera_frame(frame_bytes):
    import cv2
    import mediapipe as mp
    import numpy as np

    global _face_mesh
    image = cv2.imdecode(np.frombuffer(frame_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError('The camera frame could not be read.')

    with _face_mesh_lock:
        if _face_mesh is None:
            _face_mesh = mp.solutions.face_mesh.FaceMesh(
                static_image_mode=True,
                max_num_faces=3,
                min_detection_confidence=0.5,
            )
        result = _face_mesh.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    faces = result.multi_face_landmarks or []
    facing_camera = False
    if faces:
        landmarks = faces[0].landmark
        eye_left = landmarks[33].x
        eye_right = landmarks[263].x
        eye_width = abs(eye_right - eye_left)
        nose_offset = abs(landmarks[1].x - (eye_left + eye_right) / 2)
        facing_camera = eye_width > 0 and nose_offset / eye_width <= 0.18
    return len(faces), facing_camera


@api_view(['POST'])
@csrf_exempt
@permission_classes([IsAuthenticated])
def create_interview_session(request):
    resume_text = (request.data.get('resume_text') or '').strip()
    resume_file = request.FILES.get('resume')
    difficulty = request.data.get('difficulty', 'medium')
    interview_type = 'resume_based'
    mode = 'voice_camera'
    try:
        count = int(request.data.get('question_count', 5) or 5)
    except (TypeError, ValueError):
        return Response({'detail': 'Question count must be a number from 1 to 20.'}, status=400)
    if not 1 <= count <= 20:
        return Response({'detail': 'Question count must be a number from 1 to 20.'}, status=400)

    resume = None
    resume_file_name = 'uploaded_resume.txt'
    resume_file_type = 'text'
    if resume_file:
        try:
            resume_text, resume_file_type = extract_uploaded_resume(resume_file)
        except (ValueError, fitz.FileDataError) as error:
            return Response({'detail': str(error) or 'The resume file could not be read.'}, status=400)
        resume_text = resume_text.strip()
        resume_file_name = resume_file.name
    if not resume_text:
        return Response({'detail': 'Please upload a readable resume or paste resume text. Scanned PDFs need selectable text.'}, status=400)

    try:
        analysis, questions = prepare_resume_interview(resume_text, count=count, difficulty=difficulty)
        role = analysis['profile']
    except AIServiceError as error:
        return Response({'detail': str(error)}, status=503)

    resume = ResumeProfile.objects.create(
        user=request.user,
        file_name=resume_file_name,
        file_type=resume_file_type,
        raw_text=resume_text,
        summary=analysis['summary'],
        skills=analysis['skills'],
        experience_years=analysis['experience_years'],
        education=analysis['education'],
    )

    session = InterviewSession.objects.create(
        user=request.user,
        resume=resume,
        title=f'{role} mock interview',
        role=role,
        interview_type=interview_type,
        difficulty=difficulty,
        status='in_progress',
        mode=mode,
        duration_minutes=30,
    )

    created_questions = []
    for idx, q in enumerate(questions, start=1):
        created_question = InterviewQuestion.objects.create(
            session=session,
            question_text=q,
            question_order=idx,
            expected_answer='',
        )
        created_questions.append({
            'id': created_question.id,
            'question_text': created_question.question_text,
            'question_order': created_question.question_order,
        })

    return Response({
        'session_id': session.id,
        'title': session.title,
        'role': session.role,
        'mode': session.mode,
        'questions': created_questions,
    }, status=201)


@api_view(['POST'])
@csrf_exempt
@permission_classes([IsAuthenticated])
def submit_answer(request, session_id):
    question_id = request.data.get('question_id')
    answer = (request.data.get('answer') or '').strip()
    audio_file = request.FILES.get('audio')
    if not question_id:
        return Response({'detail': 'question_id is required.'}, status=400)
    if audio_file and audio_file.size > 20 * 1024 * 1024:
        return Response({'detail': 'Audio clip is too large. Please keep each answer under 10 minutes.'}, status=400)
    if not answer and not audio_file:
        return Response({'detail': 'An answer is required.'}, status=400)

    try:
        session = InterviewSession.objects.get(id=session_id, user=request.user)
        question = InterviewQuestion.objects.get(id=question_id, session=session)
    except (InterviewSession.DoesNotExist, InterviewQuestion.DoesNotExist):
        return Response({'detail': 'Interview session or question not found.'}, status=404)
    transcribed = False
    if not answer and audio_file:
        try:
            answer = transcribe_audio(audio_file)
            transcribed = True
        except AIServiceError as error:
            return Response({'detail': str(error)}, status=422)
    try:
        evaluation = evaluate_answer(question.question_text, answer)
    except AIServiceError as error:
        return Response({'detail': str(error)}, status=503)

    question.user_answer = answer
    question.score = evaluation['score']
    question.is_answered = True
    question.save(update_fields=['user_answer', 'score', 'is_answered'])
    evaluations = session.evaluation_data.setdefault('answers', {})
    evaluations[str(question.id)] = evaluation
    session.save(update_fields=['evaluation_data'])

    return Response({
        'question_id': question.id,
        'question_order': question.question_order,
        'score': evaluation['score'],
        'strengths': evaluation['strengths'],
        'mistakes': evaluation['mistakes'],
        'improvements': evaluation['improvements'],
        'answer': answer,
        'transcribed': transcribed,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def interview_dashboard(request):
    sessions = InterviewSession.objects.filter(user=request.user)
    completed = sessions.filter(status='completed')
    session_stats = sessions.aggregate(
        total=Count('id'),
        active=Count('id', filter=Q(status='in_progress')),
    )
    score_stats = completed.aggregate(
        total=Count('id'),
        average=Avg('overall_score'),
        best=Max('overall_score'),
    )
    resumes = ResumeProfile.objects.filter(user=request.user)
    skills = {
        skill
        for resume_skills in resumes.values_list('skills', flat=True)
        for skill in resume_skills
    }
    recent_sessions = list(sessions[:8])
    score_history = [
        {
            'date': session.completed_at.isoformat() if session.completed_at else session.created_at.isoformat(),
            'score': session.overall_score,
            'profile': session.role,
        }
        for session in reversed(list(completed.order_by('-completed_at')[:8]))
    ]
    recommendations = []
    for session in completed.order_by('-completed_at').only('evaluation_data')[:8]:
        review = session.evaluation_data.get('review', {})
        for item in review.get('improvements', []) + review.get('next_steps', []):
            if item not in recommendations:
                recommendations.append(item)
            if len(recommendations) == 4:
                break
        if len(recommendations) == 4:
            break

    return Response({
        'total_interviews': session_stats['total'],
        'completed_interviews': score_stats['total'],
        'active_sessions': session_stats['active'],
        'average_score': round(score_stats['average'], 1) if score_stats['average'] is not None else 0,
        'best_score': score_stats['best'] or 0,
        'total_resumes': resumes.count(),
        'skill_count': len(skills),
        'score_history': score_history,
        'latest_interview': {
            'id': recent_sessions[0].id,
            'title': recent_sessions[0].title,
            'profile': recent_sessions[0].role,
            'status': recent_sessions[0].status,
            'score': recent_sessions[0].overall_score if recent_sessions[0].status == 'completed' else None,
            'created_at': recent_sessions[0].created_at.isoformat(),
        } if recent_sessions else None,
        'recent_interviews': [
            {
                'id': session.id,
                'title': session.title,
                'profile': session.role,
                'status': session.status,
                'score': session.overall_score if session.status == 'completed' else None,
                'created_at': session.created_at.isoformat(),
            }
            for session in recent_sessions
        ],
        'recommendations': recommendations,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def interview_history(request):
    sessions = InterviewSession.objects.filter(user=request.user).order_by('-created_at')
    return Response([
        {
            'id': session.id,
            'title': session.title,
            'profile': session.role,
            'status': session.status,
            'score': session.overall_score if session.status == 'completed' else None,
            'created_at': session.created_at.isoformat(),
            'completed_at': session.completed_at.isoformat() if session.completed_at else None,
            'summary': session.summary,
        }
        for session in sessions
    ])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def session_detail(request, session_id):
    try:
        session = InterviewSession.objects.get(id=session_id, user=request.user)
    except InterviewSession.DoesNotExist:
        return Response({'detail': 'Interview session not found.'}, status=404)
    return Response({
        'id': session.id,
        'title': session.title,
        'role': session.role,
        'status': session.status,
        'mode': session.mode,
        'duration_minutes': session.duration_minutes,
        'overall_score': session.overall_score,
        'expression_score': session.expression_score,
        'camera_verified': session.camera_verified,
        'voice_verified': session.voice_verified,
        'summary': session.summary,
        'evaluation_data': session.evaluation_data,
        'questions': [
            {
                'id': q.id,
                'question_order': q.question_order,
                'question_text': q.question_text,
                'user_answer': q.user_answer,
                'score': q.score,
                'is_answered': q.is_answered,
                'evaluation': session.evaluation_data.get('answers', {}).get(str(q.id)),
            }
            for q in session.questions.all()
        ],
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def record_camera_observation(request, session_id):
    try:
        session = InterviewSession.objects.get(id=session_id, user=request.user, status='in_progress')
    except InterviewSession.DoesNotExist:
        return Response({'detail': 'Active interview session not found.'}, status=404)

    frame = request.FILES.get('frame')
    if frame is None:
        return Response({'detail': 'A camera frame is required.'}, status=400)
    if frame.size > 2 * 1024 * 1024:
        return Response({'detail': 'Camera frame is too large.'}, status=400)
    try:
        face_count, facing_camera = analyze_camera_frame(frame.read())
    except (ValueError, ImportError) as error:
        return Response({'detail': str(error) or 'Camera analysis is unavailable.'}, status=400)

    observations = session.evaluation_data.setdefault('camera_observations', {
        'frames': 0,
        'face_visible_frames': 0,
        'camera_facing_frames': 0,
        'multiple_face_frames': 0,
    })
    observations['frames'] += 1
    observations['face_visible_frames'] += int(face_count > 0)
    observations['camera_facing_frames'] += int(face_count > 0 and facing_camera)
    observations['multiple_face_frames'] += int(face_count > 1)
    session.save(update_fields=['evaluation_data'])
    return Response({'face_count': face_count, 'facing_camera': facing_camera, 'observations': observations})


@api_view(['POST'])
@csrf_exempt
@permission_classes([IsAuthenticated])
def complete_interview(request, session_id):
    try:
        session = InterviewSession.objects.get(id=session_id, user=request.user, status='in_progress')
    except InterviewSession.DoesNotExist:
        return Response({'detail': 'Active interview session not found.'}, status=404)
    questions = list(session.questions.all())
    answered_questions = [question for question in questions if question.is_answered]
    scores = [question.score for question in answered_questions]
    camera = session.evaluation_data.get('camera_observations', {
        'frames': 0,
        'face_visible_frames': 0,
        'camera_facing_frames': 0,
        'multiple_face_frames': 0,
    })
    camera['focus_changes'] = max(0, int(request.data.get('focus_changes', 0) or 0))
    camera['face_visibility_percent'] = round(
        camera['face_visible_frames'] * 100 / camera['frames'], 1,
    ) if camera['frames'] else 0
    camera['camera_facing_percent'] = round(
        camera['camera_facing_frames'] * 100 / camera['frames'], 1,
    ) if camera['frames'] else 0
    answers = [
        {
            'question': question.question_text,
            'answer': question.user_answer,
            'evaluation': session.evaluation_data.get('answers', {}).get(str(question.id), {}),
        }
        for question in answered_questions
    ]
    try:
        review = generate_interview_review(
            role=session.role,
            answers=answers,
        )
    except AIServiceError as error:
        return Response({'detail': str(error)}, status=503)

    session.overall_score = round(sum(scores) / len(scores), 1) if scores else 0.0
    session.status = 'completed'
    session.completed_at = timezone.now()
    session.expression_score = 0.0
    session.camera_verified = bool(
        camera['frames'] and camera['face_visibility_percent'] >= 80 and not camera['multiple_face_frames']
    )
    session.voice_verified = bool(request.data.get('voice_verified', False))
    session.summary = review['summary']
    session.transcript = '\n'.join(q.user_answer for q in questions if q.user_answer)
    session.evaluation_data['camera_observations'] = camera
    session.evaluation_data['review'] = review
    session.save()

    return Response({
        'id': session.id,
        'overall_score': session.overall_score,
        'expression_score': session.expression_score,
        'camera_verified': session.camera_verified,
        'voice_verified': session.voice_verified,
        'summary': session.summary,
        'evaluation_data': session.evaluation_data,
    })
