"""Measure local Ollama inference on synthetic, exact-answer tasks.

No external requests or third-party Python packages. Model downloads are separate.
"""
import argparse
import json
import re
import sys
import time
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen

API = "http://127.0.0.1:11434/api/generate"
TASKS = (
    ("missing-context", "No tariff document is supplied.", "UNKNOWN"),
    ("grounded-context", "Policy v3: the fictional Zorlan tariff is 17.", "17"),
    ("multi-hop", "Maps: A->B; B->C; C->D; D->E.", "E"),
)


def make_prompt(task: str, context: str, padding_lines: int) -> str:
    """Create a synthetic question with optional irrelevant context."""
    filler = "\n".join(
        f"Archive row {i}: item ZETA has status archived, no tariff information."
        for i in range(padding_lines)
    )
    question = "What is the Zorlan tariff? If absent, answer UNKNOWN."
    if task == "multi-hop":
        question = "Starting at A, follow four arrows. Where do you end?"
    return (
        f"{filler}\n{context}\n{question}\n"
        "Return the final answer alone, without punctuation or explanation."
    )


def generate(model: str, prompt: str, num_ctx: int) -> dict[str, Any]:
    """Call the local generate endpoint and return metrics and generated text."""
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "keep_alive": "2m",
        "options": {
            "num_ctx": num_ctx,
            "num_predict": 256,
            "temperature": 0,
            "seed": 42,
        },
    }
    request = Request(
        API,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    started = time.perf_counter()
    with urlopen(request, timeout=600) as response:
        result = json.load(response)
    result["client_wall_seconds"] = time.perf_counter() - started
    if not result.get("done"):
        raise RuntimeError("Incomplete inference response")
    return result


def tokens_per_second(count: int, duration_ns: int) -> float | None:
    """Compute throughput from the runtime's nanosecond counters."""
    if duration_ns <= 0:
        return None
    return count * 1_000_000_000 / duration_ns


def exact_answer(output: str, expected: str) -> bool:
    """Accept a standalone answer, with optional label and terminal punctuation."""
    normalized = re.sub(r"^answer\s*:\s*", "", output.strip(), flags=re.I)
    return normalized.rstrip(".").strip().upper() == expected.upper()


def summarize(result: dict[str, Any], expected: str) -> dict[str, Any]:
    """Preserve timing counters, output and simple exact-match correctness."""
    output = result.get("response", "")
    fields = (
        "model", "created_at", "done_reason", "total_duration", "load_duration",
        "prompt_eval_count", "prompt_eval_duration", "eval_count", "eval_duration",
        "client_wall_seconds", "prompt_eval_cached_count",
    )
    summary = {field: result.get(field) for field in fields}
    summary.update(
        response=output,
        thinking_chars=len(result.get("thinking") or ""),
        expected=expected,
        correct=exact_answer(output, expected),
        prompt_tokens_per_second=tokens_per_second(
            result.get("prompt_eval_count") or 0,
            result.get("prompt_eval_duration") or 0,
        ),
        decode_tokens_per_second=tokens_per_second(
            result.get("eval_count") or 0, result.get("eval_duration") or 0
        ),
    )
    return summary


def parse_args() -> argparse.Namespace:
    """Parse model, context settings, actual prompt padding and repetitions."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", default="qwen2.5:1.5b")
    parser.add_argument("--contexts", nargs="+", type=int, default=[2048])
    parser.add_argument("--padding-lines", type=int, default=0)
    parser.add_argument("--repeat", type=int, default=3)
    args = parser.parse_args()
    if min(args.contexts) < 512 or args.repeat < 1 or args.padding_lines < 0:
        parser.error("Use contexts >=512, repeat >=1, and nonnegative padding")
    # Conservative bound, not a tokenizer measurement.
    if args.padding_lines * 30 + 512 > min(args.contexts):
        parser.error("Padding may exceed context budget; use fewer padding lines")
    return args


def main() -> int:
    """Warm each configuration, then emit one JSONL record per measured trial."""
    args = parse_args()
    try:
        for num_ctx in args.contexts:
            warm = generate(args.model, "Reply OK.", num_ctx)
            print(json.dumps({"phase": "warmup", "num_ctx": num_ctx,
                              **summarize(warm, "OK")}), flush=True)
            for trial in range(1, args.repeat + 1):
                for task, context, expected in TASKS:
                    prompt = make_prompt(task, context, args.padding_lines)
                    result = generate(args.model, prompt, num_ctx)
                    record = {
                        "phase": "trial", "task": task, "trial": trial,
                        "num_ctx": num_ctx, "padding_lines": args.padding_lines,
                        "temperature": 0, "seed": 42, "num_predict": 256,
                        **summarize(result, expected),
                    }
                    print(json.dumps(record), flush=True)
    except (URLError, TimeoutError, RuntimeError, KeyboardInterrupt) as exc:
        print(f"Inference stopped: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
