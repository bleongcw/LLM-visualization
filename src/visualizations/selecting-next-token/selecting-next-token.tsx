import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Bot,
  Code2,
  FastForward,
  FileText,
  Info,
  MessageSquare,
  Music,
  Pause,
  Play,
  RotateCcw,
  Square,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getTokenDistribution } from "@/lib/ollama/client"
import type { TopLogprob } from "@/lib/ollama/types"
import { tokenizeForDisplay } from "@/lib/tokenization/simple-tokenizer"
import { cn } from "@/lib/utils"
import type { VisualizationExample } from "@/visualizations/types"

import {
  buildCandidateDistribution,
  formatPercent,
  probabilityBand,
  sampleWeighted,
} from "./sampling"
import type { CandidateToken, SamplingMode, TrialResult } from "./types"

const examples: VisualizationExample[] = [
  {
    id: "coding",
    label: "Coding",
    prompt:
      "What are the allowed options for the cache_implementation parameter in transformers.GenerationConfig from hugging face?",
    system:
      "You answer technical questions with direct, concise wording and no hidden reasoning traces.",
  },
  {
    id: "songwriting",
    label: "Songwriting",
    prompt: "Write the opening line of a bright synth-pop song about debugging.",
    system: "You write short, vivid creative text.",
  },
  {
    id: "sentiment",
    label: "Sentiment",
    prompt:
      "Classify this sentence as positive, neutral, or negative: The setup was confusing, but the final result worked beautifully.",
    system: "Answer with one sentiment label first.",
  },
  {
    id: "debugging",
    label: "Debugging",
    prompt:
      "A React component keeps rendering twice in development. What is the most likely cause?",
    system: "You are a pragmatic debugging assistant.",
  },
  {
    id: "planning",
    label: "Planning",
    prompt: "List the first task in a plan for learning transformer internals.",
    system: "You make clear, compact plans.",
  },
]

const defaultExample = examples[0]
const maxCandidates = 20

export function SelectingNextToken() {
  const [prompt, setPrompt] = useState(defaultExample.prompt)
  const [system, setSystem] = useState(defaultExample.system ?? "")
  const [activePromptTab, setActivePromptTab] = useState("user")
  const [rawCandidates, setRawCandidates] = useState<TopLogprob[]>([])
  const [temperature, setTemperature] = useState(1)
  const [mode, setMode] = useState<SamplingMode>("top-k")
  const [topK, setTopK] = useState(10)
  const [topP, setTopP] = useState(0.95)
  const [view, setView] = useState<"histogram" | "wheel">("histogram")
  const [trialCount, setTrialCount] = useState(8)
  const [trials, setTrials] = useState<TrialResult[]>([])
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(350)
  const [showMore, setShowMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tutorialOpen, setTutorialOpen] = useState(true)
  const [tutorialStep, setTutorialStep] = useState(0)
  const [infoOpen, setInfoOpen] = useState<"sampling" | "distribution" | null>(
    null,
  )
  const nextTrialId = useRef(1)

  const frequencies = useMemo(() => {
    const counts = new Map<string, number>()
    for (const trial of trials) {
      counts.set(trial.token.id, (counts.get(trial.token.id) ?? 0) + 1)
    }
    return counts
  }, [trials])

  const candidates = useMemo(
    () =>
      buildCandidateDistribution({
        candidates: rawCandidates,
        temperature,
        mode,
        topK,
        topP,
        frequencies,
      }),
    [frequencies, mode, rawCandidates, temperature, topK, topP],
  )

  const visibleCandidates = showMore ? candidates.slice(0, 20) : candidates.slice(0, 10)
  const generatedTokens = useMemo(
    () => tokenizeForDisplay({ prompt, generated: "" }).filter((token) => token.kind === "prompt"),
    [prompt],
  )

  const addTrial = useCallback(() => {
    const token = sampleWeighted(candidates)
    if (!token) return false
    setTrials((current) => [...current, { id: nextTrialId.current++, token }])
    return true
  }, [candidates])

  useEffect(() => {
    if (!running) return
    if (trials.length >= trialCount) {
      setRunning(false)
      return
    }

    const timer = window.setTimeout(() => {
      if (!addTrial()) setRunning(false)
    }, speed)

    return () => window.clearTimeout(timer)
  }, [addTrial, running, speed, trialCount, trials.length])

  useEffect(() => {
    setTrials([])
    nextTrialId.current = 1
    setRunning(false)
  }, [mode, rawCandidates, temperature, topK, topP])

  async function generateDistribution() {
    setLoading(true)
    setError(null)
    setTrials([])
    nextTrialId.current = 1
    setRunning(false)

    try {
      const result = await getTokenDistribution({
        prompt,
        system,
        maxCandidates,
        contextLimit: 2048,
      })
      setRawCandidates(result.topCandidates)
    } catch (distributionError) {
      setError(
        distributionError instanceof Error
          ? distributionError.message
          : "Unable to compute token probabilities.",
      )
    } finally {
      setLoading(false)
    }
  }

  function loadExample(exampleId: string) {
    const example = examples.find((item) => item.id === exampleId)
    if (!example) return
    setPrompt(example.prompt)
    setSystem(example.system ?? "")
    setRawCandidates([])
    setTrials([])
    nextTrialId.current = 1
    setRunning(false)
  }

  function runTrials() {
    if (!candidates.some((candidate) => candidate.weight > 0)) return
    setTrials([])
    nextTrialId.current = 1
    setRunning(true)
  }

  function continueTrials() {
    setRunning(true)
  }

  function endTrials() {
    setRunning(false)
    setTrials((current) => {
      const next = [...current]
      while (next.length < trialCount) {
        const token = sampleWeighted(candidates)
        if (!token) break
        next.push({ id: nextTrialId.current++, token })
      }
      return next
    })
  }

  const hasCandidates = candidates.length > 0
  const weightedCount = candidates.filter((candidate) => candidate.weight > 0).length

  return (
    <div className="space-y-5">
      <TutorialDialog
        open={tutorialOpen}
        step={tutorialStep}
        onOpenChange={setTutorialOpen}
        onStepChange={setTutorialStep}
      />
      <InfoDialog open={infoOpen} onOpenChange={setInfoOpen} />

      <div className="grid gap-5 xl:grid-cols-[1.2fr_.65fr]">
        <section className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-primary">Prompt</h3>
            <Tabs value={activePromptTab} onValueChange={setActivePromptTab}>
              <TabsList>
                <TabsTrigger value="user">User</TabsTrigger>
                <TabsTrigger value="system">System</TabsTrigger>
              </TabsList>
            </Tabs>
            <PresetButton icon={<Code2 />} label="Coding" onClick={() => loadExample("coding")} />
            <PresetButton icon={<Music />} label="Songwriting" onClick={() => loadExample("songwriting")} />
            <PresetButton icon={<MessageSquare />} label="Sentiment" onClick={() => loadExample("sentiment")} />
            <PresetButton icon={<Bot />} label="Debugging" onClick={() => loadExample("debugging")} />
            <PresetButton icon={<FileText />} label="Planning" onClick={() => loadExample("planning")} />
          </div>
          <Textarea
            value={activePromptTab === "user" ? prompt : system}
            onChange={(event) =>
              activePromptTab === "user"
                ? setPrompt(event.target.value)
                : setSystem(event.target.value)
            }
            className="min-h-[190px] resize-y bg-white text-base"
            placeholder={
              activePromptTab === "user"
                ? "Type a user prompt."
                : "Optional system instruction"
            }
          />
        </section>

        <SamplingParameters
          mode={mode}
          temperature={temperature}
          topK={topK}
          topP={topP}
          onModeChange={setMode}
          onTemperatureChange={setTemperature}
          onTopKChange={setTopK}
          onTopPChange={setTopP}
          onInfo={() => setInfoOpen("sampling")}
        />
      </div>

      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl text-accent">
              Vocabulary probability distribution
            </CardTitle>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Vary temperature, then use top-k or top-p to explore which
              candidate tokens can be sampled.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <button
              type="button"
              onClick={() => setInfoOpen("distribution")}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
            >
              Probability view
              <Info className="h-4 w-4" />
            </button>
            <div className="flex rounded-md bg-muted p-1">
              <Button
                type="button"
                size="sm"
                variant={view === "histogram" ? "default" : "ghost"}
                onClick={() => setView("histogram")}
              >
                Histogram
              </Button>
              <Button
                type="button"
                size="sm"
                variant={view === "wheel" ? "default" : "ghost"}
                onClick={() => setView("wheel")}
              >
                Wheel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!hasCandidates ? (
            <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-lg border bg-white text-center">
              <p className="text-sm text-muted-foreground">
                Submit a prompt to compute probabilities, then run trials to see
                the animation.
              </p>
              <Button onClick={() => void generateDistribution()} disabled={loading}>
                {loading ? "Generating..." : "Generate"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Load token predictions from local Ollama.
              </p>
              {error ? <p className="max-w-xl text-sm text-destructive">{error}</p> : null}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  Showing {visibleCandidates.length} of {candidates.length} returned
                  candidates. {weightedCount} can be sampled with current settings.
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void generateDistribution()}
                    disabled={loading}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Regenerate
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMore((current) => !current)}
                  >
                    {showMore ? "Hide extra tokens" : "Show 10 more tokens"}
                  </Button>
                </div>
              </div>

              {view === "histogram" ? (
                <HistogramView
                  candidates={visibleCandidates}
                  trialCount={trials.length}
                />
              ) : (
                <WheelView candidates={visibleCandidates} />
              )}

              <TrialControls
                trialCount={trialCount}
                completed={trials.length}
                running={running}
                canRun={hasCandidates}
                onTrialCountChange={setTrialCount}
                onRun={runTrials}
                onPause={() => setRunning(false)}
                onContinue={continueTrials}
                onFaster={() => setSpeed((current) => Math.max(80, current - 90))}
                onEnd={endTrials}
                onReset={() => {
                  setTrials([])
                  nextTrialId.current = 1
                  setRunning(false)
                }}
              />

              <GeneratedTrials promptTokens={generatedTokens} trials={trials} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SamplingParameters({
  mode,
  temperature,
  topK,
  topP,
  onModeChange,
  onTemperatureChange,
  onTopKChange,
  onTopPChange,
  onInfo,
}: {
  mode: SamplingMode
  temperature: number
  topK: number
  topP: number
  onModeChange: (mode: SamplingMode) => void
  onTemperatureChange: (value: number) => void
  onTopKChange: (value: number) => void
  onTopPChange: (value: number) => void
  onInfo: () => void
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold text-primary">Sampling Parameters</h3>
        <Button type="button" variant="ghost" size="icon" onClick={onInfo}>
          <Info className="h-4 w-4" />
          <span className="sr-only">Sampling parameter details</span>
        </Button>
      </div>

      <RangeControl
        label="Temperature"
        value={temperature}
        min={0.1}
        max={2}
        step={0.1}
        display={temperature.toFixed(1)}
        onChange={onTemperatureChange}
      />

      <div>
        <p className="mb-2 text-sm font-bold text-primary">Mode</p>
        <div className="grid grid-cols-2 rounded-lg bg-muted p-1">
          <Button
            type="button"
            variant={mode === "top-k" ? "secondary" : "ghost"}
            onClick={() => onModeChange("top-k")}
            className="shadow-none"
          >
            Top-K
          </Button>
          <Button
            type="button"
            variant={mode === "top-p" ? "secondary" : "ghost"}
            onClick={() => onModeChange("top-p")}
            className="shadow-none"
          >
            Top-P
          </Button>
        </div>
      </div>

      {mode === "top-k" ? (
        <RangeControl
          label="Top-K"
          value={topK}
          min={1}
          max={20}
          step={1}
          display={String(topK)}
          onChange={(value) => onTopKChange(Math.round(value))}
        />
      ) : (
        <RangeControl
          label="Top-P"
          value={topP}
          min={0.8}
          max={0.99}
          step={0.01}
          display={`${Math.round(topP * 100)}%`}
          onChange={onTopPChange}
        />
      )}
    </section>
  )
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-bold text-primary">
        {label}
        <span className="font-mono text-foreground">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
      />
    </label>
  )
}

function HistogramView({
  candidates,
  trialCount,
}: {
  candidates: CandidateToken[]
  trialCount: number
}) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-muted/20 p-4">
      <div className="grid min-w-[820px] grid-cols-[10rem_1fr_6rem_7rem_8rem] gap-4 border-b pb-3 text-xs font-bold uppercase text-muted-foreground">
        <span>Token</span>
        <span>Distribution</span>
        <span className="text-right">Prob</span>
        <span className="text-right">Weight</span>
        <span className="text-right">Frequency ({trialCount} trials)</span>
      </div>
      <div className="min-w-[820px]">
        {candidates.map((candidate) => (
          <div
            key={candidate.id}
            className={cn(
              "grid grid-cols-[10rem_1fr_6rem_7rem_8rem] items-center gap-4 py-2 text-sm",
              candidate.weight === 0 && "opacity-50",
            )}
          >
            <span>
              <TokenChip token={candidate.token} />
            </span>
            <span className="h-6 rounded bg-rose-100">
              <span
                className={cn(
                  "block h-6 rounded bg-accent/85",
                  candidate.weight === 0 && "bg-slate-300",
                )}
                style={{
                  width: `${Math.max(candidate.adjustedProbability * 100, 0.5)}%`,
                }}
              />
            </span>
            <span className="text-right font-mono">
              {formatPercent(candidate.adjustedProbability)}
            </span>
            <span className="text-right font-mono">
              {candidate.weight > 0 ? formatPercent(candidate.weight) : "-"}
            </span>
            <span className="text-right font-mono">
              {trialCount > 0
                ? formatPercent(candidate.frequency / trialCount)
                : "-"}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function WheelView({ candidates }: { candidates: CandidateToken[] }) {
  const weighted = candidates.filter((candidate) => candidate.weight > 0)
  let start = -90

  return (
    <div className="grid gap-6 rounded-lg border bg-muted/20 p-4 lg:grid-cols-[1fr_18rem_1fr]">
      <div className="flex flex-wrap items-start gap-2 lg:block lg:space-y-2">
        {candidates.map((candidate) => (
          <TokenChip key={candidate.id} token={candidate.token} />
        ))}
      </div>
      <div className="relative mx-auto flex h-72 w-72 items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-sm">
          {weighted.map((candidate, index) => {
            const angle = candidate.weight * 360
            const path = describeArc(50, 50, 44, start, start + angle)
            const color = index % 2 === 0 ? "hsl(349 78% 67%)" : "hsl(349 78% 74%)"
            start += angle
            return (
              <path
                key={candidate.id}
                d={path}
                fill={color}
                stroke="white"
                strokeWidth="0.8"
              />
            )
          })}
          <circle cx="50" cy="50" r="6" fill="white" />
        </svg>
        <div className="absolute top-0 h-0 w-0 border-l-[8px] border-r-[8px] border-t-[14px] border-l-transparent border-r-transparent border-t-accent" />
        <div className="absolute h-24 w-1 rounded-full bg-white" />
      </div>
      <div className="space-y-2 text-sm">
        {weighted.map((candidate) => (
          <div key={candidate.id} className="flex items-center justify-between gap-3">
            <TokenChip token={candidate.token} />
            <span className="font-mono">{formatPercent(candidate.weight)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TrialControls({
  trialCount,
  completed,
  running,
  canRun,
  onTrialCountChange,
  onRun,
  onPause,
  onContinue,
  onFaster,
  onEnd,
  onReset,
}: {
  trialCount: number
  completed: number
  running: boolean
  canRun: boolean
  onTrialCountChange: (value: number) => void
  onRun: () => void
  onPause: () => void
  onContinue: () => void
  onFaster: () => void
  onEnd: () => void
  onReset: () => void
}) {
  const hasStarted = completed > 0
  const isComplete = completed >= trialCount

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
      <RangeControl
        label="Number of Trials"
        value={trialCount}
        min={1}
        max={100}
        step={1}
        display={String(trialCount)}
        onChange={(value) => onTrialCountChange(Math.round(value))}
      />
      <div className="flex flex-wrap items-center gap-2">
        {!hasStarted ? (
          <Button onClick={onRun} disabled={!canRun}>
            <Play className="mr-2 h-4 w-4" />
            Run Trials
          </Button>
        ) : (
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        )}
        {hasStarted && !isComplete ? (
          <Button variant="outline" onClick={running ? onPause : onContinue}>
            {running ? (
              <Pause className="mr-2 h-4 w-4" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {running ? "Pause" : "Continue"}
          </Button>
        ) : null}
        <Button variant="outline" onClick={onFaster} disabled={!hasStarted || isComplete}>
          <FastForward className="mr-2 h-4 w-4" />
          Faster
        </Button>
        <Button variant="outline" onClick={onEnd} disabled={!hasStarted || isComplete}>
          <Square className="mr-2 h-4 w-4" />
          End
        </Button>
        <Badge variant="outline">
          {completed} / {trialCount}
        </Badge>
      </div>
    </div>
  )
}

function GeneratedTrials({
  promptTokens,
  trials,
}: {
  promptTokens: Array<{ id: number; text: string }>
  trials: TrialResult[]
}) {
  if (!trials.length) {
    return (
      <div className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">
        Generated answers appear here as sampled tokens arrive.
      </div>
    )
  }

  return (
    <section className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Generated answers - {trials.length} trials
      </p>
      <div className="max-h-[420px] space-y-2 overflow-auto">
        {trials.map((trial) => (
          <div
            key={trial.id}
            className="flex flex-wrap items-center gap-1.5 rounded-lg bg-muted/40 p-2 text-sm"
          >
            <span className="mr-1 w-6 text-right font-semibold">{trial.id}.</span>
            <span className="text-muted-foreground">"</span>
            {promptTokens.slice(0, 18).map((token, index) => (
              <span key={`${trial.id}-${token.id}-${index}`} className="token-chip token-chip-prompt">
                {token.text}
              </span>
            ))}
            <SampledTokenChip token={trial.token} />
            <span className="text-muted-foreground">"</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>Generated token probability:</span>
        <LegendChip label="0-30% red" className="border-rose-300 bg-rose-50" />
        <LegendChip label="30-70% yellow" className="border-amber-300 bg-amber-50" />
        <LegendChip label="70-100% green" className="border-emerald-300 bg-emerald-50" />
      </div>
    </section>
  )
}

function PresetButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactElement
  label: string
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon" onClick={onClick}>
          {icon}
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function TokenChip({ token }: { token: string }) {
  return <span className="token-chip max-w-full truncate">{token || "empty"}</span>
}

function SampledTokenChip({ token }: { token: CandidateToken }) {
  const band = probabilityBand(token.weight)

  return (
    <span
      className={cn(
        "token-chip",
        band === "high" && "border-emerald-300 bg-emerald-50",
        band === "medium" && "border-amber-300 bg-amber-50",
        band === "low" && "border-rose-300 bg-rose-50",
      )}
    >
      {token.token}
    </span>
  )
}

function LegendChip({
  label,
  className,
}: {
  label: string
  className: string
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("h-4 w-4 rounded border", className)} />
      {label}
    </span>
  )
}

function TutorialDialog({
  open,
  step,
  onOpenChange,
  onStepChange,
}: {
  open: boolean
  step: number
  onOpenChange: (open: boolean) => void
  onStepChange: (step: number) => void
}) {
  const steps = [
    {
      title: "Welcome - selecting the next token",
      body: "At every generation step, the model produces a probability for every token in its vocabulary. Sampling is how you choose one token from that distribution.",
    },
    {
      title: "Prompt box",
      body: "Type a prompt under the User tab, set behavior instructions under System, or load one of the preset prompts.",
    },
    {
      title: "Control panel",
      body: "Temperature reshapes the probability distribution, Top-K keeps the K most likely tokens, and Top-P keeps tokens by cumulative probability.",
    },
    {
      title: "Vocabulary probability distribution panel",
      body: "Generate candidate tokens, switch between Histogram and Wheel views, then run trials to see random sampling accumulate into frequencies.",
    },
  ]
  const current = steps[step]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <p className="text-sm font-semibold text-primary">
            {step + 1} / {steps.length}
          </p>
          <DialogTitle className="text-primary">{current.title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm leading-6 text-foreground">{current.body}</p>
        <DialogFooter className="items-center sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {step === steps.length - 1 ? "Close" : "Skip tour"}
          </Button>
          <div className="flex gap-2">
            {step > 0 ? (
              <Button variant="outline" onClick={() => onStepChange(step - 1)}>
                Back
              </Button>
            ) : null}
            <Button
              onClick={() =>
                step === steps.length - 1
                  ? onOpenChange(false)
                  : onStepChange(step + 1)
              }
            >
              {step === steps.length - 1 ? "Got it" : "Next"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function InfoDialog({
  open,
  onOpenChange,
}: {
  open: "sampling" | "distribution" | null
  onOpenChange: (open: "sampling" | "distribution" | null) => void
}) {
  const isSampling = open === "sampling"

  return (
    <Dialog open={Boolean(open)} onOpenChange={(next) => onOpenChange(next ? open : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-primary">
            {isSampling ? "Sampling Parameters" : "Vocabulary Probability Distribution"}
          </DialogTitle>
        </DialogHeader>
        {isSampling ? (
          <div className="space-y-4 text-sm leading-6">
            <p>
              <strong>Temperature:</strong> higher values spread probability
              across more tokens. As temperature approaches 0, the most likely
              token dominates.
            </p>
            <p>
              <strong>Top-K:</strong> sampling is drawn from the K most probable
              visible tokens, weighted by their probability.
            </p>
            <p>
              <strong>Top-P:</strong> sampling is drawn from the smallest token
              set whose cumulative probability crosses p.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-sm leading-6">
            <p>
              The probability column shows the temperature-adjusted distribution
              for returned candidates. The weight column shows the normalized
              sampling distribution after top-k or top-p filtering.
            </p>
            <p>
              Run multiple trials to compare observed frequency against the
              weight. The values will get closer as the number of trials grows.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, radius, endAngle)
  const end = polarToCartesian(cx, cy, radius, startAngle)
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1"

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ")
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180

  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  }
}
