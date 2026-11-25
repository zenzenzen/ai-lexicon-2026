# Local inference lab — M2 Max, 32 GB unified memory

You can learn a surprising amount about a model by changing the length of a prompt and watching what happens to the machine. A large context limit tells you what the architecture permits; your memory pressure and response time tell you what your particular deployment can sustain.

Save the **Benchmark script** from the Deep Dive page in the directory where you run these examples. In the repository it lives at `labs/local-llm/benchmark.py`.

## 0. Setup

- Install or update [Ollama for macOS](https://docs.ollama.com/macos) (current documentation specifies macOS 14 or newer). Open the application to start the local server. Confirm with `ollama --version` and `curl http://127.0.0.1:11434/api/tags`.
- Check disk space (`df -h ~`) and Activity Monitor → Memory. Leave room for macOS and caches. The target model alone downloads about 20 GB; allow extra disk space and avoid keeping multiple large models loaded.
- Use synthetic data only. Do not expose the local API to your network. A local model is not a sandbox for arbitrary code or tools.

## 1. First model: separate model and runtime

```bash
ollama pull qwen2.5:1.5b
ollama run qwen2.5:1.5b
# Prompt: Explain idempotency for an invoice synchronization job.
# Exit using /bye.
ollama list
ollama ps
```

The [1.5B tag](https://ollama.com/library/qwen2.5/tags) is about 986 MB on disk. Observe resident memory, CPU/GPU utilization, and initial versus subsequent responses. Download once; disconnect from Wi-Fi and rerun the model to verify inference works offline. Reconnect for further downloads. Record the tag, model ID/digest displayed by the runtime, Ollama version and macOS version. Model tags can change.

## 2. Quantization: same model family and parameter count, different encoding

```bash
ollama pull qwen2.5:3b-instruct-q4_K_M
ollama pull qwen2.5:3b-instruct-q8_0
python3 benchmark.py --model qwen2.5:3b-instruct-q4_K_M --repeat 3 > q4.jsonl
ollama stop qwen2.5:3b-instruct-q4_K_M
python3 benchmark.py --model qwen2.5:3b-instruct-q8_0 --repeat 3 > q8.jsonl
ollama stop qwen2.5:3b-instruct-q8_0
```

Compare 1.9 GB versus 3.3 GB listed file sizes, warm-run decoding throughput, memory pressure and exact-match accuracy. These are GGUF quantizations, not NVFP4 and MXFP8. This experiment illustrates the consequences of changing an encoding; it does not reproduce Inkling's low-bit training.

**Deliverable:** a table with each tag, disk footprint, observed memory pressure, median warm decode throughput, and correct answers / total. Three synthetic tasks are a smoke test, not an overall quality benchmark. A tie tells you little about the quality ceiling.

## 3. Context versus training: fixed weights, changed input

```bash
python3 benchmark.py --model qwen2.5:1.5b --contexts 2048 4096 --repeat 3 > baseline.jsonl
python3 benchmark.py --model qwen2.5:1.5b --contexts 4096 --padding-lines 80 --repeat 3 > padded.jsonl
ollama stop qwen2.5:1.5b
```

Read the three test cases in `benchmark.py`. One omits a fictional tariff, another provides it, and the third asks the model to follow a chain of four lookups. The expected outputs are UNKNOWN, 17, and E. Keeping the weights and question fixed while supplying a new document is a small context-engineering experiment. It demonstrates conditional access to facts, not permanent learning. The padding run changes actual input length; `num_ctx` alone changes configured capacity and is not an input-length measurement.

For a production analogue, replace the fictional tariff with a synthetic invoice rule that changes from one version to another. Compare the following interventions on held-out cases: baseline prompt, policy retrieval, and a prompt with demonstrations. Only consider training if the remaining failure is a stable behavior deficit, not an inaccessible or stale fact. Training brings data collection, evaluation, versioning and rollback costs. Retrieval brings indexing, provenance, access control and latency costs. Both can fail.

## 4. Target model: Inkling 2 Mini

The [model card](https://huggingface.co/thinkingmachines/Inkling-2-Mini) lists 32 GB Apple Silicon as supported. The [Ollama listing](https://ollama.com/library/inkling-2-mini) lists a roughly 20 GB download and an MLX NVFP4-specific tag. Prefer the default supported tag for your first run; only compare alternate backends after confirming the current Ollama version supports them.

```bash
ollama pull inkling-2-mini
ollama show inkling-2-mini
# Set a conservative context via the API instead of accepting a huge default.
python3 benchmark.py --model inkling-2-mini --contexts 2048 --repeat 3 > inkling-2k.jsonl
ollama ps
ollama stop inkling-2-mini
```

Watch Activity Monitor while the model loads and runs. Keep pressure green where practical; abort (Ctrl+C and `ollama stop inkling-2-mini`) if pressure stays yellow/red or swap rises rapidly. Close heavy applications. Try 4096 only if 2048 runs comfortably. Do not allocate the advertised maximum context on a 32 GB machine. No throughput is promised for the M2 Max. The report's laptop demo used a different machine.

The two models differ in architecture, parameter count, training, precision, and potentially inference kernels. Comparing their speed and task performance is useful for deployment decisions, not a controlled test of the causal contribution of looping. For a controlled loop experiment use the released variable-loop research checkpoint and a runtime that explicitly supports its pass setting; do not change a generic Ollama parameter and assume you changed network depth. That experiment is out of scope for this first local lab.

## 5. Interpret measurements

The script makes nonstreaming calls to [Ollama's generate endpoint](https://docs.ollama.com/api/generate). It logs JSONL with raw timing counters in nanoseconds, actual prompt and generated-token counts, answer, expected answer, exact-match result, and configured context capacity. Warmup records are separate; compare measured load durations rather than assuming every subsequent request is warm. Prefix caching can affect prefill; compare cached counts if present. When the output is empty or ends at a token limit, inspect `done_reason` and the reasoning field's character count. Do not confuse reasoning characters with tokens or assume the returned eval count excludes reasoning.

```text
Decode tokens/s = eval_count / eval_duration × 1e9
Prefill tokens/s = prompt_eval_count / prompt_eval_duration × 1e9
```

Measure time to first token with a separate streaming client if required; the nonstreaming script reports total client wall time only. `num_ctx` is runtime configuration, not an assurance that all requested context fits. Use prompt counts and check for truncation. For quality, report the denominator, exact-match rule, and all failures rather than just a mean score.

### Optional extension: MLX

Once Ollama works, run an independently verified small MLX checkpoint using [MLX-LM](https://github.com/ml-explore/mlx-lm). This lets you see model loading and generation from Python tooling rather than only through a server. Example:

```bash
python3 -m venv .venv-mlx
source .venv-mlx/bin/activate
python -m pip install mlx-lm
mlx_lm.generate --model mlx-community/Llama-3.2-3B-Instruct-4bit \
  --prompt 'Explain what the KV cache stores.' --max-tokens 128
```

Check the checkpoint's license and model card. This is a separate model/runtime combination, not a measurement of the same model under two identical runtimes.

## 6. Capstone: read the paper again

Write a short review answering the following without copying the report:

1. What determines stored model size, what determines active computation, and what does repeated weight use change?
2. Which claims about low-bit training, pruning, and healing require the training report rather than a local inference benchmark?
3. Why are reported benchmark scores and theoretical throughput not universal estimates for your machine?
4. What does a no-CoT time horizon measure? What is the difference between a legible trace and a faithful one?
5. Which of your failures would you address with context, tools, a smaller/larger model, or training? Specify an evaluation for each intervention.

**Evidence to keep:** local run metadata, JSONL files, screenshots of memory pressure if desired, a table of warm-run measurements, and a short claim-by-claim report audit. Labs are tracked separately from mastery.
