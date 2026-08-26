import unittest
import json
from pathlib import Path
import sys
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services.digital_twin_service import (
    build_learning_dna,
    generate_learning_dna_from_ai,
)
import services.digital_twin_service as digital_twin_service


class DigitalTwinServiceTests(unittest.TestCase):
    def test_build_learning_dna_returns_summary_fields(self):
        payload = {
            "student_id": "student-123",
            "user_id": "user-456",
            "student": {
                "name": "Ava",
                "skill_level": "intermediate",
                "daily_study_time": 75,
                "learning_style": "visual",
            },
            "roadmap": {
                "weeks": [
                    {
                        "topics": [
                            {"title": "Arrays", "is_completed": True},
                            {"title": "Graphs", "is_completed": False},
                        ]
                    }
                ],
                "total_weeks": 1,
            },
            "quiz_scores": [
                {"topic_title": "Arrays", "score": 4, "total": 5},
                {"topic_title": "Graphs", "score": 2, "total": 5},
            ],
            "sessions": [
                {
                    "topic_title": "Arrays",
                    "started_at": "2025-01-01T10:00:00Z",
                    "completed_at": "2025-01-01T11:00:00Z",
                }
            ],
            "notes_count": 2,
            "recommendation_count": 1,
            "weak_topics": ["Graphs"],
        }

        result = build_learning_dna(payload)

        self.assertIn("learning_personality", result)
        self.assertIn("learning_speed", result)
        self.assertIn("retention_score", result)
        self.assertIn("confidence_score", result)
        self.assertIn("learning_health", result)
        self.assertIn("predictions", result)
        self.assertIsInstance(result["predictions"], list)

    def test_generate_learning_dna_from_ai_without_api_key(self):
        payload = {
            "student_id": "student-456",
            "student": {
                "name": "Jules",
                "skill_level": "beginner",
                "learning_style": "reading",
            },
            "roadmap": {
                "weeks": [{"topics": [{"title": "Loops", "is_completed": True}]}]
            },
            "quiz_scores": [{"topic_title": "Loops", "score": 3, "total": 5}],
            "sessions": [],
            "notes_count": 1,
            "recommendation_count": 0,
            "weak_topics": [],
        }

        result = build_learning_dna(payload)
        self.assertIn("learning_health", result)
        self.assertIsInstance(result["learning_health"], dict)
        self.assertIn("score", result["learning_health"])

    def test_generate_learning_dna_prompt_escapes_json_braces(self):
        payload = {
            "student_id": "student-789",
            "student": {"name": "Mina", "skill_level": "beginner"},
            "roadmap": {"weeks": []},
            "quiz_scores": [],
            "sessions": [],
            "notes_count": 0,
            "recommendation_count": 0,
            "weak_topics": [],
        }
        fallback = build_learning_dna(payload)

        class FakeModel:
            prompt = None

            def generate_content(self, prompt):
                self.prompt = prompt
                return type(
                    "Response", (), {"text": json.dumps(fallback, default=str)}
                )()

        fake_model = FakeModel()
        fake_genai = type(
            "FakeGenAI",
            (),
            {"GenerativeModel": lambda *args, **kwargs: fake_model},
        )

        with patch.object(digital_twin_service, "genai", fake_genai), patch.object(
            digital_twin_service.settings, "GEMINI_API_KEY", "test-key"
        ):
            result = unittest.IsolatedAsyncioTestCase().run
            del result
            generated = self._run_async(generate_learning_dna_from_ai(payload))

        self.assertIn(
            '{"score": 0, "label": "string", "summary": "string"}', fake_model.prompt
        )
        self.assertIn("learning_health", generated)

    @staticmethod
    def _run_async(awaitable):
        import asyncio

        return asyncio.run(awaitable)


if __name__ == "__main__":
    unittest.main()
