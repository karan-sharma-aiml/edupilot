import unittest

from services.gemini_service import _parse_quiz_questions


class QuizGenerationTests(unittest.TestCase):
    def test_parser_accepts_fenced_wrapped_response_and_answer_alias(self):
        response = """Here is your quiz:
```json
{"questions": [{"question": "What is 2 + 2?", "options": ["1", "2", "3", "4"], "answer": 3}]}
```
"""

        result = _parse_quiz_questions(response)

        self.assertEqual(result[0]["correct_answer"], 3)
        self.assertEqual(result[0]["options"], ["1", "2", "3", "4"])
        self.assertEqual(result[0]["explanation"], "")

    def test_parser_rejects_invalid_question_shape(self):
        with self.assertRaises(ValueError):
            _parse_quiz_questions('[{"question": "Incomplete", "options": ["A", "B"]}]')


if __name__ == "__main__":
    unittest.main()
