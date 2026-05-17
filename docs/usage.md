# Usage Guide

This app is a local-first teaching tool for LLM mechanics. It runs in your browser, talks to a local Express API, and uses Ollama with `qwen3:0.6b`.

## Start The App

1. Start Ollama:

```bash
ollama serve
```

2. Pull the model if needed:

```bash
ollama pull qwen3:0.6b
```

3. Check the model setup:

```bash
./scripts/check-ollama.sh
```

4. Install dependencies and start the app:

```bash
npm install
npm run dev
```

5. Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

## Navigation

Use the visualization buttons in the app header:

- `Auto Regression Loop`
- `Selecting Next Token`

Each visualization runs inside the shared shell. The shell shows Ollama health, model badge, and an `Instructions` drawer for the current visualization.

## Auto Regression Loop

This view shows the repeated loop used for text generation.

### Controls

- `Step`: advances one phase at a time.
- `Play`: runs the loop automatically.
- `Faster`: speeds up automatic playback.
- `Restart`: clears the generated response and starts over.
- `Max New Tokens`: stops generation once the generated token count reaches the limit.
- `Max Context Window`: demonstrates context-window stopping.

### Suggested Exercise

1. Load the Bayesian reasoning preset.
2. Click `Step` four times.
3. Notice that one selected token is appended to the response and becomes part of the next input.
4. Click `Play`.
5. Lower `Max New Tokens` and restart to force an early stop.

## Selecting Next Token

This view shows how a next token can be sampled from model probabilities instead of always choosing the most likely token.

### Prompt Panel

- Use `User` for the main prompt.
- Use `System` for behavior instructions.
- Use the preset icon buttons for coding, songwriting, sentiment, debugging, and planning examples.

### Sampling Parameters

- `Temperature`: reshapes candidate probabilities. Lower values make the most likely token dominate. Higher values spread probability across more candidates.
- `Top-K`: keeps only the K highest-weight candidates, then renormalizes their weights.
- `Top-P`: keeps the smallest candidate prefix whose cumulative probability crosses the selected threshold, then renormalizes.

### Probability Panel

- `Generate`: calls Ollama once and loads visible next-token candidates.
- `Histogram`: shows tokens as rows with distribution bars.
- `Wheel`: shows the sampling distribution as a weighted wheel.
- `Show 10 more tokens`: reveals the second set of returned candidates.
- `Number of Trials`: controls how many random draws to run.
- `Run Trials`: samples from the current filtered distribution.
- `Continue`, `Pause`, `Faster`, `End`, and `Reset`: control trial playback.

### Columns

- `Prob`: the temperature-adjusted probability among the returned candidates.
- `Weight`: the normalized sampling weight after Top-K or Top-P filtering.
- `Frequency`: observed sample frequency from the trials you have run.

The app uses the top candidates returned by Ollama. It does not fetch the full vocabulary distribution.

### Suggested Exercises

1. Click `Generate`, then move `Temperature` down toward `0.1`. The highest-probability token should dominate.
2. Move `Temperature` up toward `2.0`. The visible distribution should flatten.
3. Switch from `Top-K` to `Top-P` and compare how many candidates keep a non-zero weight.
4. Run 30 to 100 trials and compare `Frequency` with `Weight`.
5. Run the same trial count again. The exact frequencies may differ because sampling is random.

## Troubleshooting

### Ollama is not reachable

Run:

```bash
ollama serve
```

Then reload the browser page or click `Check`.

### Model is missing

Run:

```bash
ollama pull qwen3:0.6b
```

### API starts but generation fails

Check whether Ollama is responding:

```bash
./scripts/check-ollama.sh
```

If the browser still shows an error, restart `npm run dev`.

### Port already in use

The app expects:

- Vite on `127.0.0.1:5173`
- API server on `127.0.0.1:8787`
- Ollama on `127.0.0.1:11434`

Stop the process using the occupied port, or update the command/config before starting the app.

