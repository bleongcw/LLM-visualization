# LLM Visualization

Interactive browser visualizations for LLM concepts, powered by local Ollama where live model data is useful. The model-backed views use `qwen3:0.6b` to show how transformer-style language models generate and sample tokens; deterministic teaching views use local fixtures when a stable trace is better for explanation.

The project is local-first: prompts stay on this laptop, the browser talks to a local Express API, and the API talks to Ollama on `127.0.0.1:11434`.

## Visualizations

### Auto Regression Loop

Shows the four-step loop behind text generation:

1. Input tokens are sent into the model.
2. The model computes probabilities for the next token.
3. Greedy decoding selects the highest-probability token.
4. The loop decides whether to stop or append the token and continue.

### Selecting Next Token

Shows how sampling changes model output:

1. Generate candidate next-token probabilities from Ollama.
2. Reshape the distribution with temperature.
3. Filter candidates with Top-K or Top-P.
4. Run repeated trials and compare expected sampling weights with observed frequencies.

### How Sampling Shapes Output

Shows how token choices compound into different continuations:

1. Generate candidate tokens for the next position.
2. Pick a token and watch the next candidate column update.
3. Track the cumulative probability of the selected path.
4. Generate several sampled completions from the same prompt and compare where they match or diverge.

### Constrained Generation with Finite State Machines (FSM)

Shows how a finite state machine keeps generated output inside a required JSON schema:

1. Choose a structured-output preset.
2. Step through character-by-character JSON generation.
3. Watch the FSM state decide which token categories are valid next.
4. Compare raw model candidates with the masked and renormalized distribution.
5. Compare schema-valid constrained output with unconstrained free-form output.

The project is designed for expansion. New visualizations live under `src/visualizations/*` and register themselves through `src/visualizations/index.ts`.

## Model Requirements By Visualization

| Visualization | Needs Ollama? | Data Source |
| --- | --- | --- |
| Auto Regression Loop | Yes | live `qwen3:0.6b` next-token calls |
| Selecting Next Token | Yes | live `qwen3:0.6b` top-token distributions |
| How Sampling Shapes Output | Yes | live `qwen3:0.6b` continuation distributions |
| Constrained Generation with Finite State Machines (FSM) | No | deterministic local FSM fixtures |

## Prerequisites

- Node.js 20+
- npm
- Ollama
- The local model `qwen3:0.6b`

Install or update the model:

```bash
ollama pull qwen3:0.6b
```

You can verify the local model setup with:

```bash
./scripts/check-ollama.sh
```

## Run Locally

Use this sequence for a fresh clone or a new terminal session:

1. Start Ollama:

```bash
ollama serve
```

2. Install dependencies:

```bash
npm install
```

3. Confirm Ollama and the model are ready:

```bash
./scripts/check-ollama.sh
```

4. Run the app:

```bash
npm run dev
```

5. Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

The Vite app proxies `/api/*` requests to a local Express server on `127.0.0.1:8787`, which talks to Ollama on `127.0.0.1:11434`.

Leave `npm run dev` running while using the browser. Stop it with `Ctrl-C`.

## How To Use The App

Use the tabs in the top-right app header to switch visualizations. Each section has first-run tutorial guidance and an `Instructions` drawer in the app.

For **Auto Regression Loop**:

1. Choose a preset prompt or type your own.
2. Click `Step` to move through input tokens, probability computation, token selection, and stop/continue.
3. Click `Play` to run the loop automatically.
4. Change `Max New Tokens` or `Max Context Window` to see stopping conditions.

For **Selecting Next Token**:

1. Choose a preset prompt or type your own.
2. Click `Generate` to ask Ollama for next-token candidates.
3. Adjust `Temperature`, `Top-K`, or `Top-P`.
4. Switch between `Histogram` and `Wheel`.
5. Set `Number of Trials`, then click `Run Trials`.
6. Compare `Weight` with `Frequency` to see sampling randomness.

For **How Sampling Shapes Output**:

1. Choose a preset prompt or type your own.
2. Adjust `Temperature`, `Top-K`, or `Top-P`.
3. Click `Generate` in `Choose Your Own Completion`.
4. Select candidate tokens column by column and watch the cumulative path probability.
5. Set `Completions`, then click `Generate` in `Multiple Completions`.
6. Compare rows to see how the same prompt can produce matching or diverging sampled outputs.

For **Constrained Generation with Finite State Machines (FSM)**:

1. Choose `Function Call`, `Sentiment`, or `Data Extraction`.
2. Inspect the target JSON schema.
3. Click `Step` to advance one character at a time.
4. Watch the highlighted FSM state and required-field checklist.
5. Compare `Model Output` with `After FSM Masking`.
6. Compare valid constrained JSON with the unconstrained output.

Open `Instructions` inside the app for guided exercises. More detailed usage notes live in [docs/usage.md](docs/usage.md).

## Demo Checklist

For a quick live demo:

1. Open **Auto Regression Loop**, click `Step` four times, and point out that the selected token is appended back into the context.
2. Open **Selecting Next Token**, click `Generate`, lower and raise `Temperature`, then run 30 trials.
3. Open **How Sampling Shapes Output**, click `Generate`, choose a token path, then generate 5 completions and compare the rows.
4. Open **Constrained Generation with Finite State Machines (FSM)**, click `Play`, and point out how invalid tokens are masked while the constrained output stays valid JSON.

If a model-backed generation button fails, check the health message near the top of the app and run `./scripts/check-ollama.sh`. The FSM visualization is browser-side and should still run without Ollama.

## Useful Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
```

## Local API

- `GET /api/health`: checks Ollama and the configured model.
- `POST /api/next-token`: returns one greedy next token for the autoregressive loop.
- `POST /api/token-distribution`: returns top candidate tokens for sampling.
- `POST /api/token-distribution` also accepts a `generated` prefix so follow-up visualizations can request the next distribution after selected or sampled tokens.

Ollama currently caps `top_logprobs` at `20` in this project, so the sampling visualization works over the visible candidate set returned by Ollama.

The FSM visualization does not call the local API. Its constrained-decoding trace is generated from deterministic fixtures in `src/visualizations/constrained-generation-fsm`.

## Testing And Verification

Run these before committing:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

For model-backed changes, also run:

```bash
./scripts/check-ollama.sh
```

## Repository Guides

- [Usage Guide](docs/usage.md)
- [Architecture](docs/architecture.md)
- [Add a Visualization](docs/add-a-visualization.md)
- [shadcn MCP Setup](docs/shadcn-mcp.md)
- [Engineering Principles](docs/engineering-principles.md)

## Status

This is a local-first teaching app. It does not send prompts to a hosted backend.
