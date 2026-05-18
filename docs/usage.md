# Usage Guide

This app is a local-first teaching tool for LLM mechanics. It runs in your browser, talks to a local Express API for model-backed views, and uses Ollama with `qwen3:0.6b` when live token probabilities are needed.

## Start The App

For a fresh local session, start the model service first and then run the browser app.

1. Start Ollama in one terminal:

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

4. Install dependencies:

```bash
npm install
```

5. Start the web app and local API:

```bash
npm run dev
```

6. Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

`npm run dev` starts both Vite and the local API. Keep that terminal running while using the app. Stop it with `Ctrl-C`.

## Navigation

Use the visualization buttons in the app header:

- `Auto Regression Loop`
- `Selecting Next Token`
- `How Sampling Shapes Output`
- `Constrained Generation with Finite State Machines (FSM)`

Each visualization runs inside the shared shell. The shell shows model status when a view needs Ollama, plus an `Instructions` drawer for the current visualization. Individual visualizations own their tutorial dialogs and panel-specific explanations.

## Data Sources

| Visualization | Needs Ollama? | What it uses |
| --- | --- | --- |
| `Auto Regression Loop` | Yes | one-token live model calls |
| `Selecting Next Token` | Yes | live top-token probabilities |
| `How Sampling Shapes Output` | Yes | live continuation probabilities |
| `Constrained Generation with Finite State Machines (FSM)` | No | deterministic local FSM fixtures |

## Common Workflow

Most sections follow the same pattern:

1. Choose a preset prompt or type your own.
2. Optionally edit the `System` tab to change the model's behavior.
3. Click the main action button for the visualization, such as `Step`, `Generate`, or `Run Trials`.
4. Adjust controls and observe what changes in the displayed token probabilities or outputs.
5. Use `Restart`, `Reset`, or change the prompt when you want a clean run.

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

### What To Notice

- The model only predicts the next token, not the whole answer in one shot.
- The selected token is appended to the existing response.
- The next loop uses the prompt plus everything generated so far.
- Stopping is controlled by the app loop, token limits, context limits, or an end token.

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

### What To Notice

- `Prob` is the temperature-adjusted probability among the returned candidates.
- `Weight` is the probability after Top-K or Top-P filtering and renormalization.
- `Frequency` is empirical, so it may not match `Weight` perfectly for a small number of trials.
- The app samples from Ollama's returned top candidates, not from the entire model vocabulary.

## How Sampling Shapes Output

This view shows how sampling decisions shape full continuations, not just one token. It reuses the same prompt and sampling controls, then lets you explore two paths: one hand-picked token path and several sampled completion rows.

### Prompt Panel

- Use `User` for the main prompt.
- Use `System` for behavior instructions.
- Use the preset icon buttons for coding, pop culture, sentiment, debugging, and planning examples.

### Sampling Parameters

- `Temperature`: controls how concentrated or varied each next-token distribution is.
- `Top-K`: keeps the K most likely candidates for each next-token decision.
- `Top-P`: keeps candidates until their cumulative probability crosses the selected threshold.

Changing sampling settings clears generated completion rows and resets any selected token path so the comparison always matches the visible controls.

### Choose Your Own Completion

- `Generate`: calls Ollama for candidate tokens at Token 1.
- Click any visible candidate token to select it.
- After each selection, the app asks Ollama for the next candidate distribution using your selected text as the generated prefix.
- Continue through Token 5.
- `Path probability` multiplies the selected token weights, showing how quickly a completion path can become rare.
- `Reset` clears the token path and generated completion rows.

### Multiple Completions

- `Completions`: sets how many sampled rows to generate.
- `Generate`: creates several short continuations from the same prompt and sampling settings.
- Each row samples token by token from live Ollama candidate distributions.
- Token chips are color coded by confidence:
  - red: 0-30%
  - yellow: 30-70%
  - green: 70-100%
- Rows are outlined to show whether they match or diverge from row #1.

### Suggested Exercises

1. Click `Generate` in `Choose Your Own Completion`, select the most likely token in each column, and watch the path probability.
2. Reset, then choose a less likely token at Token 2. Notice how the next column and path probability change.
3. Generate 5 to 10 completions at a low temperature and compare how often rows match.
4. Raise temperature toward `1.8`, generate the same number of completions, and compare the variety and confidence colors.
5. Switch between Top-K and Top-P to see whether a fixed candidate count or cumulative-probability filter changes the output spread.

### What To Notice

- A likely first token can still lead to different later paths.
- A lower-probability token often changes the following candidate distribution.
- Path probability compounds quickly because it multiplies selected token weights.
- Multiple completions can match for several tokens and then diverge at a later sampled decision.

## Constrained Generation with Finite State Machines (FSM)

This view shows how constrained decoding can force a model-shaped output to remain valid JSON. Instead of letting every likely token through, a finite state machine masks any candidate that would break the target schema.

This visualization is deterministic. It uses local teaching fixtures rather than live Ollama calls so the FSM trace is stable for demos and tests.

### Prompt Panel

- `Function Call`: asks for a JSON function call with nested numeric arguments.
- `Sentiment`: asks for a JSON classification with an enum-like sentiment and confidence score.
- `Data Extraction`: asks for structured fields from a sentence.

Changing the prompt resets playback to step `0`.

### Target Schema

The schema panel shows the JSON shape the constrained output must follow. It includes required fields and value types. The state machine uses this schema as the contract for what the output may contain.

### State Machine Panel

- The highlighted state shows what the decoder is expecting next.
- The character badge shows the current character being accepted.
- The explanation tells you why the FSM is in the current state.
- The required-fields row shows which required keys have appeared so far.

Core states include:

- `Expect {`
- `Expect " or }`
- `In Key`
- `Expect :`
- `Expect Value`
- `In String`
- `In Number`
- `In Boolean`
- `Expect Nested {`
- `Complete`

### Playback Controls

- `Step`: advances one character and one FSM transition.
- `Play`: runs the trace automatically.
- `Fast`: runs automatic playback faster.
- `Reset`: returns to the beginning.
- The step counter shows the current position in the trace.

### Token Masking

The top table shows raw candidate probabilities, as if the model proposed several next-token options. The bottom table shows the distribution after the FSM masks invalid tokens:

- valid candidates keep probability mass
- invalid candidates become `0`
- remaining candidates are renormalized to sum to `1`

### Output Comparison

- `With FSM (Constrained)` builds valid JSON step by step.
- `Without FSM (Unconstrained)` shows how an unconstrained answer may drift into code, prose, or markdown.
- The unconstrained side displays an invalid-JSON warning when it cannot be parsed.

### Suggested Exercises

1. Start with `Function Call`, then click `Step` until the first key is complete. Notice how `Expect :` masks every token except `:`.
2. Continue until the nested `arguments` object opens. Watch the FSM move through `Expect Nested {`.
3. Use `Play` and observe how the required-field indicators change as keys appear.
4. Switch to `Sentiment` and compare the shorter schema with the function-call schema.
5. Switch to `Data Extraction` and watch how string and number values use different FSM states.

## Local API Endpoints

The browser uses these local routes through the Vite proxy:

- `GET /api/health`: checks Ollama reachability and whether `qwen3:0.6b` is installed.
- `POST /api/next-token`: asks Ollama for one greedy next token for Auto Regression Loop.
- `POST /api/token-distribution`: asks Ollama for visible top-token candidates for sampling visualizations.

`POST /api/token-distribution` accepts an optional `generated` string. The How Sampling Shapes Output view uses this to ask, "given the prompt and the tokens chosen so far, what comes next?"

## Before A Demo

Run this quick check:

```bash
./scripts/check-ollama.sh
npm run typecheck
npm run test
```

Then start the app with:

```bash
npm run dev
```

For a short audience walkthrough, use:

1. **Auto Regression Loop**: click `Step` four times.
2. **Selecting Next Token**: click `Generate`, move `Temperature`, then run trials.
3. **How Sampling Shapes Output**: choose a token path, then generate multiple completions.
4. **Constrained Generation with Finite State Machines (FSM)**: click `Play`, watch invalid candidates get masked, and compare the constrained JSON with the unconstrained output.

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

The Constrained Generation with Finite State Machines (FSM) view does not depend on Ollama. If only that view works, the browser app is healthy and the issue is likely the local model service or API proxy.

### Port already in use

The app expects:

- Vite on `127.0.0.1:5173`
- API server on `127.0.0.1:8787`
- Ollama on `127.0.0.1:11434`

Stop the process using the occupied port, or update the command/config before starting the app.
