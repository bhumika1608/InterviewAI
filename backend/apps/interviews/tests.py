from unittest.mock import patch

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.ai.services import AIServiceError, evaluate_answer
from .models import InterviewQuestion, InterviewSession
from apps.resumes.models import ResumeProfile


class InterviewSessionModelTests(TestCase):
    def test_interview_report_models_are_registered_in_django_admin(self):
        self.assertIn(InterviewSession, admin.site._registry)
        self.assertIn(InterviewQuestion, admin.site._registry)

    @patch('apps.interviews.views.evaluate_answer')
    def test_submit_answer_persists_evaluation_without_rewrite_field(self, evaluate):
        user = get_user_model().objects.create_user(username='answer-test', password='strong-pass-123')
        session = InterviewSession.objects.create(user=user, title='Practice', role='Design student', status='in_progress')
        question = InterviewQuestion.objects.create(session=session, question_text='Describe your portfolio project.')
        evaluate.return_value = {
            'score': 76,
            'strengths': ['Clear project description'],
            'mistakes': ['Missing audience context'],
            'improvements': ['Describe who the work served'],
        }
        client = APIClient()
        client.force_authenticate(user=user)

        response = client.post(
            f'/api/interviews/{session.id}/submit-answer/',
            {'question_id': question.id, 'answer': 'I designed an accessible student portfolio.'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['score'], 76)
        self.assertNotIn('example_improvement', response.data)
        question.refresh_from_db()
        session.refresh_from_db()
        self.assertTrue(question.is_answered)
        self.assertIn(str(question.id), session.evaluation_data['answers'])

    @patch('apps.interviews.views.transcribe_audio', return_value='I developed the frontend with reusable React components.')
    @patch('apps.interviews.views.evaluate_answer')
    def test_submit_answer_transcribes_audio_when_browser_transcript_is_empty(self, evaluate, transcribe):
        user = get_user_model().objects.create_user(username='audio-test', password='strong-pass-123')
        session = InterviewSession.objects.create(user=user, title='Voice practice', role='Design student', status='in_progress')
        question = InterviewQuestion.objects.create(session=session, question_text='Describe your project.')
        evaluate.return_value = {'score': 75, 'strengths': ['Specific contribution'], 'mistakes': [], 'improvements': []}
        client = APIClient()
        client.force_authenticate(user=user)

        response = client.post(
            f'/api/interviews/{session.id}/submit-answer/',
            {'question_id': question.id, 'audio': __import__('django').core.files.uploadedfile.SimpleUploadedFile('answer.webm', b'fake audio', content_type='audio/webm')},
            format='multipart',
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['transcribed'])
        self.assertEqual(response.data['answer'], 'I developed the frontend with reusable React components.')
        transcribe.assert_called_once()

    @patch('apps.interviews.views.generate_interview_review')
    def test_ending_partial_interview_saves_report_for_owner(self, generate_review):
        user = get_user_model().objects.create_user(username='report-owner', password='strong-pass-123')
        other_user = get_user_model().objects.create_user(username='report-other', password='strong-pass-123')
        session = InterviewSession.objects.create(user=user, title='Business practice', role='MBA student', status='in_progress')
        answered = InterviewQuestion.objects.create(
            session=session,
            question_text='Describe a team project.',
            user_answer='I coordinated a team presentation.',
            score=80,
            is_answered=True,
            question_order=1,
        )
        InterviewQuestion.objects.create(session=session, question_text='What would you improve?', question_order=2)
        generate_review.return_value = {
            'summary': 'The response described a team contribution.',
            'strengths': ['Clear contribution'],
            'mistakes': [],
            'improvements': ['Add the result'],
            'next_steps': ['Quantify the impact'],
        }
        client = APIClient()
        client.force_authenticate(user=user)

        response = client.post(f'/api/interviews/{session.id}/complete/', {}, format='json')

        self.assertEqual(response.status_code, 200)
        session.refresh_from_db()
        self.assertEqual(session.status, 'completed')
        self.assertEqual(session.overall_score, 80)
        self.assertEqual(session.evaluation_data['review']['summary'], 'The response described a team contribution.')
        generate_review.assert_called_once()

        client.force_authenticate(user=other_user)
        self.assertEqual(client.get(f'/api/interviews/{session.id}/').status_code, 404)

    def test_dashboard_and_history_are_scoped_to_authenticated_user(self):
        user = get_user_model().objects.create_user(username='dashboard-owner', password='strong-pass-123')
        other_user = get_user_model().objects.create_user(username='dashboard-other', password='strong-pass-123')
        InterviewSession.objects.create(user=user, title='Completed', role='MBA student', status='completed', overall_score=84)
        InterviewSession.objects.create(user=user, title='Active', role='MBA student', status='in_progress')
        InterviewSession.objects.create(user=other_user, title='Private', role='Designer', status='completed', overall_score=100)
        client = APIClient()
        client.force_authenticate(user=user)

        dashboard = client.get('/api/interviews/dashboard/')
        history = client.get('/api/interviews/history/')

        self.assertEqual(dashboard.status_code, 200)
        self.assertEqual(dashboard.data['total_interviews'], 2)
        self.assertEqual(dashboard.data['average_score'], 84)
        self.assertEqual(len(history.data), 2)
        self.assertNotIn('Private', str(dashboard.data))
        self.assertNotIn('Private', str(history.data))

    @patch('apps.interviews.views.prepare_resume_interview')
    def test_create_interview_analyzes_resume_before_creating_session(self, prepare_interview):
        user = get_user_model().objects.create_user(username='resume-test', password='strong-pass-123')
        client = APIClient()
        client.force_authenticate(user=user)
        resume_text = 'Complete resume contents used to create this interview.'
        analysis = {
            'profile': 'Business administration student',
            'summary': 'Experience supported by the resume.',
            'skills': ['Django'],
            'experience_years': 2,
            'education': 'Not stated',
        }
        questions = ['How did the resume project use Django?']
        prepare_interview.return_value = (analysis, questions)

        response = client.post('/api/interviews/create/', {
            'resume_text': resume_text,
            'question_count': '1',
        }, format='multipart')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['questions'][0]['question_text'], questions[0])
        self.assertEqual(response.data['session_id'], InterviewSession.objects.get().id)
        self.assertEqual(InterviewSession.objects.get().resume.raw_text, resume_text)
        self.assertEqual(InterviewSession.objects.get().role, 'Business administration student')
        prepare_interview.assert_called_once_with(resume_text, count=1, difficulty='medium')

    @patch('apps.interviews.views.prepare_resume_interview', side_effect=AIServiceError('Start Ollama first.'))
    def test_create_interview_does_not_fall_back_when_ai_is_unavailable(self, prepare_interview):
        user = get_user_model().objects.create_user(username='offline-test', password='strong-pass-123')
        client = APIClient()
        client.force_authenticate(user=user)

        response = client.post('/api/interviews/create/', {
            'resume_text': 'Resume text that must be analyzed by the local model.',
        }, format='multipart')

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data['detail'], 'Start Ollama first.')
        self.assertEqual(InterviewSession.objects.count(), 0)
        self.assertEqual(ResumeProfile.objects.count(), 0)

    def test_authenticated_session_post_accepts_csrf_token(self):
        user = get_user_model().objects.create_user(username='csrf-test', password='strong-pass-123')
        client = APIClient(enforce_csrf_checks=True)
        self.assertTrue(client.login(username=user.username, password='strong-pass-123'))

        rejected = client.post('/api/interviews/create/', {}, format='json')
        self.assertEqual(rejected.status_code, 403)
        self.assertIn('CSRF', rejected.data['detail'])

        token_response = client.get('/api/users/csrf/')
        self.assertEqual(token_response.status_code, 200)
        accepted = client.post(
            '/api/interviews/create/',
            {},
            format='json',
            HTTP_X_CSRFTOKEN=token_response.data['csrfToken'],
        )
        self.assertEqual(accepted.status_code, 400)
        self.assertIn('resume', accepted.data['detail'].lower())

    def test_logout_clears_the_django_session(self):
        user = get_user_model().objects.create_user(username='logout-test', password='strong-pass-123')
        client = APIClient(enforce_csrf_checks=True)
        self.assertTrue(client.login(username=user.username, password='strong-pass-123'))
        token = client.get('/api/users/csrf/').data['csrfToken']

        response = client.post('/api/users/logout/', {}, format='json', HTTP_X_CSRFTOKEN=token)

        self.assertEqual(response.status_code, 200)
        self.assertNotIn('_auth_user_id', client.session)

    def test_session_creation_with_defaults(self):
        session = InterviewSession.objects.create(
            title='Frontend Engineer Mock Interview',
            role='Frontend Engineer',
            interview_type='technical',
            difficulty='medium',
            status='draft',
        )

        self.assertEqual(session.title, 'Frontend Engineer Mock Interview')
        self.assertEqual(session.role, 'Frontend Engineer')
        self.assertEqual(session.status, 'draft')

    @patch('apps.ai.services._call_ollama')
    def test_answer_evaluation_uses_ai_response(self, call_ollama):
        call_ollama.return_value = {
            'score': 82,
            'strengths': ['Explains the implementation clearly'],
            'mistakes': ['Does not state a measurable result'],
            'improvements': ['Add an outcome metric'],
        }
        evaluation = evaluate_answer(
            question='Can you explain how you used React and TypeScript in your dashboard?',
            answer='I built a React dashboard with TypeScript components and REST API integrations to show live metrics and improve maintainability.',
        )

        self.assertEqual(evaluation['score'], 82)
        self.assertEqual(evaluation['strengths'], ['Explains the implementation clearly'])
        self.assertEqual(evaluation['mistakes'], ['Does not state a measurable result'])
        self.assertEqual(evaluation['improvements'], ['Add an outcome metric'])
        self.assertNotIn('example_improvement', evaluation)
        call_ollama.assert_called_once()

    @patch('apps.ai.services._call_ollama')
    def test_question_generation_sends_the_complete_resume_to_ai(self, call_ollama):
        from apps.ai.services import generate_questions_from_resume

        resume = 'First page experience. ' + ('Complete project history. ' * 500)
        call_ollama.return_value = {
            'questions': [
                {'question': 'How did the project on the first page use its stated metric?'},
            ],
        }

        questions = generate_questions_from_resume(resume, role='Data Analyst', count=1)

        self.assertEqual(len(questions), 1)
        self.assertIn(resume, call_ollama.call_args.args[1])
