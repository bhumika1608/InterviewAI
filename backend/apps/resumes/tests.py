from django.test import SimpleTestCase
from unittest.mock import patch

from apps.ai.services import analyze_resume, generate_questions_from_resume, prepare_resume_interview


class ResumeAnalysisTests(SimpleTestCase):
    @patch('apps.ai.services._call_ollama')
    def test_resume_analysis_uses_ai_response(self, call_ollama):
        resume_text = """
        Senior Frontend Developer with experience in React, TypeScript, Node.js, REST APIs, and database design.
        Built scalable dashboards and managed PostgreSQL data pipelines.
        """
        call_ollama.return_value = {
            'profile': 'Frontend developer',
            'summary': 'Frontend developer focused on dashboards and data pipelines.',
            'skills': ['React', 'TypeScript', 'Node.js', 'REST APIs', 'PostgreSQL'],
            'experience_years': 5,
            'education': 'Not stated',
        }

        analysis = analyze_resume(resume_text)

        self.assertIn('React', analysis['skills'])
        self.assertIn('PostgreSQL', analysis['skills'])
        self.assertIn(resume_text, call_ollama.call_args.args[1])

    @patch('apps.ai.services._call_ollama')
    def test_interview_preparation_analyzes_and_generates_questions_in_one_call(self, call_ollama):
        resume_text = 'Fine arts student. Developed an exhibition identity and presented three design iterations.'
        call_ollama.return_value = {
            'profile': 'Fine arts student',
            'summary': 'Student with exhibition design experience.',
            'skills': ['Visual identity', 'Presentation'],
            'experience_years': 0,
            'education': 'Fine arts',
            'questions': [
                'How did you develop the exhibition identity?',
                'What feedback shaped your design iterations?',
            ],
        }

        analysis, questions = prepare_resume_interview(resume_text, count=2)

        self.assertEqual(analysis['profile'], 'Fine arts student')
        self.assertEqual(len(questions), 2)
        call_ollama.assert_called_once()
        self.assertIn(resume_text, call_ollama.call_args.args[1])

    @patch('apps.ai.services._call_ollama')
    def test_generate_questions_from_resume_text(self, call_ollama):
        resume_text = """
        Built a React dashboard using TypeScript and REST APIs. Optimized PostgreSQL queries and mentored junior engineers.
        """
        call_ollama.return_value = {
            'questions': [
                'How did the React dashboard use TypeScript and REST APIs?',
                'What changed after you optimized the PostgreSQL queries?',
                'How did you mentor junior engineers on this work?',
            ],
        }

        questions = generate_questions_from_resume(resume_text, role='Frontend Developer', count=3)

        self.assertEqual(len(questions), 3)
        self.assertTrue(any('react' in q.lower() or 'typescript' in q.lower() for q in questions))
        self.assertTrue(any('api' in q.lower() or 'rest' in q.lower() for q in questions))
        self.assertIn(resume_text, call_ollama.call_args.args[1])
