from django.test import TestCase
from rest_framework.test import APIClient


class AIEndpointPermissionTests(TestCase):
    def test_ai_generation_endpoints_require_authentication(self):
        client = APIClient()

        analyze_response = client.post(
            '/api/ai/resume/analyze/',
            {'resume_text': 'Resume text'},
            format='json',
        )
        evaluate_response = client.post(
            '/api/ai/answer/evaluate/',
            {'question': 'Question', 'answer': 'Answer'},
            format='json',
        )

        self.assertEqual(analyze_response.status_code, 403)
        self.assertEqual(evaluate_response.status_code, 403)
