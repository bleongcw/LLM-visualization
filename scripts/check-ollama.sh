#!/usr/bin/env bash
set -euo pipefail

MODEL="${OLLAMA_MODEL:-qwen3:0.6b}"

if ! command -v ollama >/dev/null 2>&1; then
  echo "Ollama is not installed."
  exit 1
fi

if ! curl -fsS http://127.0.0.1:11434/api/version >/dev/null; then
  echo "Ollama is not reachable. Run: ollama serve"
  exit 1
fi

if ! ollama list | awk '{print $1}' | grep -qx "$MODEL"; then
  echo "$MODEL is not installed. Run: ollama pull $MODEL"
  exit 1
fi

echo "Ollama is ready with $MODEL."
