# Reading Inkling 2 Mini: a claim map

The report is an exercise in separating things that are easily conflated: what a model stores, how much computation it performs, how it was trained, and how its behavior is evaluated. Follow the curriculum graph for definitions; use this map when returning to the report.

| Report section | Concepts to revisit | Reading task |
|---|---|---|
| Capabilities | Evals, harness, multimodal, active parameters | Read the benchmark header, task definition, scoring, and harness before comparing model rows. Identify one result that might depend on tool access. |
| Looping design | Transformer, MoE, looped transformer, attention residuals, gates, scaling law | Draw the forward pass and count unique layers separately from applications. Explain which weights are reused. |
| Low-bit training | Precision, quantization, mixed precision, memory bandwidth | Distinguish numeric format, weight storage, and hardware acceleration. Explain why a native format need not have an identical fast implementation on another chip. |
| Pruning and healing | Pruning, distillation, healing | Compare checkpoint size and evaluate what performance recovery means. |
| Training | Pretraining, SFT, RL, on-policy distillation | Sketch which training stages alter parameters and what signal drives each. |
| Monitorability | Reasoning budgets, no-CoT horizon, trace controllability, monitorability, mechanistic interpretability | Separate written reasoning, internal computation, and the monitor's detection task. Examine the experiment's population and comparison protocol. |
| Local deployment | Inference, KV cache, prefill/decode, latency, unified memory | Run the labs, then compare your own measured footprint and throughput with the report's setup. |

## Numbers to unpack

The [official model card](https://huggingface.co/thinkingmachines/Inkling-2-Mini) and [release report](https://thinkingmachines.ai/news/inkling-2-mini/) (November 20, 2026) give the following reference figures. These are reported results, not independent reproductions.

- 26.4B total parameters; 3.4B active before counting repeated passes; 5.4B effective weight activations per token. Calculate storage from total parameters and actual encoding, not the effective active count.
- 24 stored layers; 12 middle layers applied three times. 12 + 3 × 12 = 48 layer applications.
- 20 layers use NVFP4 and four use MXFP8 for the described weight precision. The checkpoint is approximately 20 GB. The four-bit raw size calculation does not capture mixed precision or metadata.
- Expert count decreases from 384 to 128 per layer; the report describes a subsequent 1T-token healing stage. The post-training report describes 2.2T RL tokens.
- The variable-loop research model's estimated no-CoT 50% horizon is 16 human seconds with one pass and 37 with three. That is a task-duration statistic, not the model's response time. More passes do not necessarily improve factual recall.

A useful first estimate: a batch-one, bandwidth-bound decode can be constrained by how many bytes need to be read per token. But cache locality, expert routing, shared weights, precision, kernel efficiency, attention and other operations determine whether this simplified estimate is informative. The release's theoretical speed chart is not a measured M2 Max benchmark.

## Consolidated learning resources

| Resource | Where it fits |
|---|---|
| [Google Machine Learning Crash Course](https://developers.google.com/machine-learning/crash-course) and [exercises](https://developers.google.com/machine-learning/crash-course/exercises) | Loss, gradients, generalization, neural networks, embeddings and LLM foundations. Start with gaps identified by recall. |
| [Hugging Face LLM Course](https://huggingface.co/learn/llm-course/chapter1/1) | Tokenizers, transformer usage, datasets and fine-tuning. Open course material; compute costs for optional exercises may vary. |
| [Attention Is All You Need](https://arxiv.org/abs/1706.03762) | Read architecture and attention once you can distinguish embeddings, weights and activations. |
| [Anthropic: Effective context engineering for AI agents](https://www.anthropic.com/research/effective-context-engineering-for-ai-agents) | Production context selection, memory and agent orchestration. Complements model-training education rather than replacing it. |
| [Apple MLX on Hugging Face](https://huggingface.co/docs/hub/mlx) and [MLX-LM](https://github.com/ml-explore/mlx-lm) | Local model execution, conversion and later parameter-efficient training. |
| [Ollama macOS](https://docs.ollama.com/macos) and [Generate API](https://docs.ollama.com/api/generate) | Local runtime and measurement. |
| [Inkling 2 Mini model card](https://huggingface.co/thinkingmachines/Inkling-2-Mini) and [Ollama model registry](https://ollama.com/library/inkling-2-mini) | Target model architecture, formats, license, supported hardware and installation. |

The course material and articles are accessible without purchasing a course; hosted inference or training may incur compute charges. Course enrollment and certificate offerings were not audited. Start with the short Google exercises, then spend the time saved on Hugging Face's practical sections and the local labs.
