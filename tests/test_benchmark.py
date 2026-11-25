"""Exercise metric math and exact-answer scoring without an Ollama server."""
import importlib.util
from pathlib import Path
import unittest

FILE = Path(__file__).resolve().parents[1] / "labs/local-llm/benchmark.py"
SPEC = importlib.util.spec_from_file_location("benchmark", FILE)
assert SPEC and SPEC.loader
benchmark = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(benchmark)


class BenchmarkTests(unittest.TestCase):
    """Validate pure helpers independently of model behavior."""

    def test_rate(self) -> None:
        """Convert nanoseconds and handle unavailable timing."""
        self.assertEqual(benchmark.tokens_per_second(20, 2_000_000_000), 10)
        self.assertIsNone(benchmark.tokens_per_second(20, 0))

    def test_answer(self) -> None:
        """Reject guesses embedded in longer output."""
        self.assertTrue(benchmark.exact_answer("Answer: 17.", "17"))
        self.assertFalse(benchmark.exact_answer("It may be 17 or 19", "17"))

    def test_prompt(self) -> None:
        """Insert context and variable-length padding without exposing real data."""
        prompt = benchmark.make_prompt("multi-hop", "A->B", 2)
        self.assertIn("A->B", prompt)
        self.assertIn("four arrows", prompt)
        self.assertEqual(prompt.count("Archive row"), 2)

    def test_metrics(self) -> None:
        """Preserve raw metrics and mark exact matches."""
        summary = benchmark.summarize({"response": "E", "eval_count": 4,
                                      "eval_duration": 1_000_000_000}, "E")
        self.assertTrue(summary["correct"])
        self.assertEqual(summary["decode_tokens_per_second"], 4)
        self.assertIsNone(summary["prompt_tokens_per_second"])


if __name__ == "__main__":
    unittest.main()
