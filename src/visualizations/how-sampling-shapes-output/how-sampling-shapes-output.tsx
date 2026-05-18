import { useMemo, useRef, useState } from "react"
import type { ReactElement } from "react"
import {
  Bot,
  Clipboard,
  Code2,
  Info,
  MessageSquare,
  Music,
  RotateCcw,
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
import { cn } from "@/lib/utils"
import {
  buildCandidateDistribution,
  formatPercent,
  sampleWeighted,
} from "@/visualizations/selecting-next-token/sampling"
import type { CandidateToken } from "@/visualizations/selecting-next-token/types"
import type { VisualizationExample } from "@/visualizations/types"

import {
  appendCompletionToken,
  completionDivergence,
  cumulativePathProbability,
  displayPromptPreview,
  tokenConfidenceBand,
} from "./sampling-path"
import type {
  CompletionRun,
  ExplorationStep,
  SamplingSettings,
} from "./types"

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
    id: "pop-culture",
    label: "Pop culture",
    prompt: "Write the next sentence in a playful review of a space opera movie.",
    system: "You write concise, vivid entertainment commentary.",
  },
  {
    id: "sentiment",
    label: "Sentiment",
    prompt:
      "Complete this sentence: The product launch felt exciting because",
    system: "Continue the sentence naturally.",
  },
  {
    id: "debugging",
    label: "Debugging",
    prompt: "Complete this debugging note: The most likely cause is",
    system: "Continue with a concrete software debugging explanation.",
  },
  {
    id: "planning",
    label: "Planning",
    prompt: "Complete this plan: First, we should",
    system: "Continue with practical planning language.",
  },
]

const defaultExample = examples[0]
const maxCandidates = 20
const explorerColumns = 5
const completionTokenLimit = 14

export function HowSamplingShapesOutput() {
  const [prompt, setPrompt] = useState(defaultExample.prompt)
  const [system, setSystem] = useState(defaultExample.system ?? "")
  const [activePromptTab, setActivePromptTab] = useState("user")
  const [settings, setSettings] = useState<SamplingSettings>({
    temperature: 0.7,
    mode: "top-k",
    topK: 3,
    topP: 0.95,
  })
  const [steps, setSteps] = useState<ExplorationStep[]>([])
  const [completionCount, setCompletionCount] = useState(5)
  const [completionRuns, setCompletionRuns] = useState<CompletionRun[]>([])
  const [loadingExplorer, setLoadingExplorer] = useState(false)
  const [loadingCompletions, setLoadingCompletions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tutorialOpen, setTutorialOpen] = useState(true)
  const [tutorialStep, setTutorialStep] = useState(0)
  const [infoOpen, setInfoOpen] = useState<"sampling" | "explorer" | "completions" | null>(
    null,
  )
  const runCounter = useRef(1)

  const distributions = useMemo(
    () =>
      steps.map((step) =>
        buildCandidateDistribution({
          candidates: step.rawCandidates,
          temperature: settings.temperature,
          mode: settings.mode,
          topK: settings.topK,
          topP: settings.topP,
        }),
      ),
    [settings, steps],
  )
  const selections = steps.map((step) => step.selected)
  const selectedText = selections
    .filter(Boolean)
    .map((selection) => selection?.token ?? "")
    .join("")
  const pathProbability = cumulativePathProbability(selections)

  async function generateExplorer() {
    setLoadingExplorer(true)
    setError(null)
    setSteps([])

    try {
      const result = await getTokenDistribution({
        prompt,
        system,
        generated: "",
        maxCandidates,
        contextLimit: 2048,
      })
      setSteps([{ rawCandidates: result.topCandidates }])
    } catch (explorerError) {
      setError(
        explorerError instanceof Error
          ? explorerError.message
          : "Unable to load candidate tokens.",
      )
    } finally {
      setLoadingExplorer(false)
    }
  }

  async function chooseCandidate(stepIndex: number, candidate: CandidateToken) {
    const nextSteps = steps.slice(0, stepIndex + 1).map((step, index) =>
      index === stepIndex ? { ...step, selected: candidate } : step,
    )
    setSteps(nextSteps)

    if (stepIndex >= explorerColumns - 1) return

    setLoadingExplorer(true)
    setError(null)
    try {
      const generated = nextSteps
        .map((step) => step.selected?.token ?? "")
        .join("")
      const result = await getTokenDistribution({
        prompt,
        system,
        generated,
        maxCandidates,
        contextLimit: 2048,
      })
      setSteps([...nextSteps, { rawCandidates: result.topCandidates }])
    } catch (choiceError) {
      setError(
        choiceError instanceof Error
          ? choiceError.message
          : "Unable to load the next candidate column.",
      )
    } finally {
      setLoadingExplorer(false)
    }
  }

  async function generateCompletions() {
    setLoadingCompletions(true)
    setError(null)
    setCompletionRuns([])
    runCounter.current = 1

    try {
      const nextRuns: CompletionRun[] = []
      for (let runIndex = 0; runIndex < completionCount; runIndex += 1) {
        let generated = ""
        let run: CompletionRun = { id: runCounter.current++, tokens: [] }

        for (let tokenIndex = 0; tokenIndex < completionTokenLimit; tokenIndex += 1) {
          const result = await getTokenDistribution({
            prompt,
            system,
            generated,
            maxCandidates,
            contextLimit: 2048,
          })
          const candidates = buildCandidateDistribution({
            candidates: result.topCandidates,
            temperature: settings.temperature,
            mode: settings.mode,
            topK: settings.topK,
            topP: settings.topP,
          })
          const sampled = sampleWeighted(candidates)
          if (!sampled) break

          run = appendCompletionToken(run, {
            token: sampled.token,
            probability: sampled.adjustedProbability,
            weight: sampled.weight,
          })
          generated += sampled.token
        }

        nextRuns.push(run)
        setCompletionRuns([...nextRuns])
      }
    } catch (completionError) {
      setError(
        completionError instanceof Error
          ? completionError.message
          : "Unable to generate multiple completions.",
      )
    } finally {
      setLoadingCompletions(false)
    }
  }

  function loadExample(exampleId: string) {
    const example = examples.find((item) => item.id === exampleId)
    if (!example) return
    setPrompt(example.prompt)
    setSystem(example.system ?? "")
    resetOutputs()
  }

  function resetOutputs() {
    setSteps([])
    setCompletionRuns([])
    setError(null)
    setLoadingExplorer(false)
    setLoadingCompletions(false)
  }

  function updateSettings(partial: Partial<SamplingSettings>) {
    setSettings((current) => ({ ...current, ...partial }))
    setSteps((current) =>
      current.length ? [{ rawCandidates: current[0].rawCandidates }] : current,
    )
    setCompletionRuns([])
  }

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
        <PromptPanel
          activePromptTab={activePromptTab}
          prompt={prompt}
          system={system}
          onPromptChange={(value) => {
            setPrompt(value)
            resetOutputs()
          }}
          onSystemChange={(value) => {
            setSystem(value)
            resetOutputs()
          }}
          onTabChange={setActivePromptTab}
          onLoadExample={loadExample}
        />
        <SamplingParameters
          settings={settings}
          onChange={updateSettings}
          onInfo={() => setInfoOpen("sampling")}
        />
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-rose-50 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b">
          <div>
            <CardTitle className="text-2xl text-accent">
              Choose Your Own Completion
            </CardTitle>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Click a token in the active column to open the next set of
              candidates. Continue until Token 5, then compare the cumulative
              probability.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setInfoOpen("explorer")}
          >
            <Info className="h-4 w-4" />
            <span className="sr-only">Token explorer details</span>
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          <TokenExplorer
            prompt={prompt}
            distributions={distributions}
            steps={steps}
            loading={loadingExplorer}
            selectedText={selectedText}
            pathProbability={pathProbability}
            onGenerate={() => void generateExplorer()}
            onChoose={(stepIndex, candidate) => void chooseCandidate(stepIndex, candidate)}
            onReset={resetOutputs}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b">
          <div>
            <CardTitle className="text-2xl text-accent">
              Multiple Completions
            </CardTitle>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Generate several sampled continuations from the same prompt and
              settings. Token colors show confidence at each generated step.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setInfoOpen("completions")}
          >
            <Info className="h-4 w-4" />
            <span className="sr-only">Multiple completions details</span>
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          <MultipleCompletions
            completionCount={completionCount}
            runs={completionRuns}
            loading={loadingCompletions}
            onCompletionCountChange={setCompletionCount}
            onGenerate={() => void generateCompletions()}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function PromptPanel({
  activePromptTab,
  prompt,
  system,
  onPromptChange,
  onSystemChange,
  onTabChange,
  onLoadExample,
}: {
  activePromptTab: string
  prompt: string
  system: string
  onPromptChange: (value: string) => void
  onSystemChange: (value: string) => void
  onTabChange: (value: string) => void
  onLoadExample: (id: string) => void
}) {
  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-bold text-primary">Prompt</h3>
        <Tabs value={activePromptTab} onValueChange={onTabChange}>
          <TabsList>
            <TabsTrigger value="user">User</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>
        </Tabs>
        <PresetButton icon={<Code2 />} label="Coding" onClick={() => onLoadExample("coding")} />
        <PresetButton icon={<Music />} label="Pop culture" onClick={() => onLoadExample("pop-culture")} />
        <PresetButton icon={<MessageSquare />} label="Sentiment" onClick={() => onLoadExample("sentiment")} />
        <PresetButton icon={<Bot />} label="Debugging" onClick={() => onLoadExample("debugging")} />
        <PresetButton icon={<Clipboard />} label="Planning" onClick={() => onLoadExample("planning")} />
      </div>
      <Textarea
        value={activePromptTab === "user" ? prompt : system}
        onChange={(event) =>
          activePromptTab === "user"
            ? onPromptChange(event.target.value)
            : onSystemChange(event.target.value)
        }
        className="min-h-[170px] resize-y bg-white text-base"
        placeholder={
          activePromptTab === "user"
            ? "Type a user prompt."
            : "Optional system instruction"
        }
      />
    </section>
  )
}

function SamplingParameters({
  settings,
  onChange,
  onInfo,
}: {
  settings: SamplingSettings
  onChange: (settings: Partial<SamplingSettings>) => void
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
        value={settings.temperature}
        min={0}
        max={2}
        step={0.1}
        display={settings.temperature.toFixed(1)}
        onChange={(temperature) => onChange({ temperature })}
      />
      <div>
        <p className="mb-2 text-sm font-bold text-primary">Mode</p>
        <div className="grid grid-cols-2 rounded-lg bg-muted p-1">
          <Button
            type="button"
            variant={settings.mode === "top-k" ? "secondary" : "ghost"}
            onClick={() => onChange({ mode: "top-k" })}
            className="shadow-none"
          >
            Top-K
          </Button>
          <Button
            type="button"
            variant={settings.mode === "top-p" ? "secondary" : "ghost"}
            onClick={() => onChange({ mode: "top-p" })}
            className="shadow-none"
          >
            Top-P
          </Button>
        </div>
      </div>
      {settings.mode === "top-k" ? (
        <RangeControl
          label="Top-K"
          value={settings.topK}
          min={1}
          max={10}
          step={1}
          display={String(settings.topK)}
          onChange={(topK) => onChange({ topK: Math.round(topK) })}
        />
      ) : (
        <RangeControl
          label="Top-P"
          value={settings.topP}
          min={0.8}
          max={0.99}
          step={0.01}
          display={`${Math.round(settings.topP * 100)}%`}
          onChange={(topP) => onChange({ topP })}
        />
      )}
    </section>
  )
}

function TokenExplorer({
  prompt,
  distributions,
  steps,
  loading,
  selectedText,
  pathProbability,
  onGenerate,
  onChoose,
  onReset,
}: {
  prompt: string
  distributions: CandidateToken[][]
  steps: ExplorationStep[]
  loading: boolean
  selectedText: string
  pathProbability: number
  onGenerate: () => void
  onChoose: (stepIndex: number, candidate: CandidateToken) => void
  onReset: () => void
}) {
  if (!steps.length) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border bg-white text-center">
        <p className="text-sm text-muted-foreground">
          Load live token predictions to start exploring candidate continuations.
        </p>
        <Button onClick={onGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate"}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          Selected continuation:
          <span className="ml-2 font-mono text-foreground">
            {selectedText || "Choose a token to begin."}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            Path probability: {pathProbability ? formatPercent(pathProbability, 3) : "-"}
          </Badge>
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[1120px] grid-cols-[13rem_repeat(5,10.5rem)] gap-4">
          <div>
            <p className="mb-3 text-center text-sm font-bold text-primary">
              Your Prompt
            </p>
            <div className="min-h-[155px] rounded-lg border bg-muted/30 p-4 font-mono text-sm leading-6 text-muted-foreground">
              {displayPromptPreview(prompt, 115)}
            </div>
          </div>
          {Array.from({ length: explorerColumns }).map((_, index) => (
            <div key={index} className="relative">
              <p className="mb-3 text-center text-sm font-bold text-primary">
                Token {index + 1}
              </p>
              <div className="space-y-2">
                {steps[index]?.selected ? (
                  <TokenChoice
                    candidate={steps[index].selected}
                    selected
                    disabled
                  />
                ) : distributions[index]?.length ? (
                  distributions[index]
                    .filter((candidate) => candidate.weight > 0)
                    .slice(0, 3)
                    .map((candidate) => (
                      <TokenChoice
                        key={candidate.id}
                        candidate={candidate}
                        onClick={() => onChoose(index, candidate)}
                      />
                    ))
                ) : (
                  <div className="h-14 rounded-lg border border-dashed bg-muted/20" />
                )}
              </div>
              {index < explorerColumns - 1 ? (
                <span className="absolute -right-3 top-[4.3rem] text-2xl font-bold text-primary">
                  -
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">
          Loading the next candidate column...
        </p>
      ) : null}
    </div>
  )
}

function MultipleCompletions({
  completionCount,
  runs,
  loading,
  onCompletionCountChange,
  onGenerate,
}: {
  completionCount: number
  runs: CompletionRun[]
  loading: boolean
  onCompletionCountChange: (value: number) => void
  onGenerate: () => void
}) {
  const reference = runs[0]

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <RangeControl
          label="Completions"
          value={completionCount}
          min={1}
          max={10}
          step={1}
          display={String(completionCount)}
          onChange={(value) => onCompletionCountChange(Math.round(value))}
        />
        <Button onClick={onGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate"}
        </Button>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <LegendChip label="Matches #1" className="border-rose-400 bg-rose-50" />
        <LegendChip label="Diverges from #1" className="border-sky-600 bg-sky-50" />
        <LegendChip label="0-30%" className="border-rose-300 bg-rose-50" />
        <LegendChip label="30-70%" className="border-amber-300 bg-amber-50" />
        <LegendChip label="70-100%" className="border-emerald-300 bg-emerald-50" />
      </div>
      {runs.length ? (
        <div className="overflow-x-auto rounded-lg border">
          {runs.map((run) => {
            const divergence = completionDivergence(reference, run)
            return (
              <div
                key={run.id}
                className="grid min-w-[920px] grid-cols-[4rem_1fr] items-start gap-3 border-b p-3 last:border-b-0"
              >
                <div className="pt-2 text-sm font-bold text-muted-foreground">
                  #{run.id}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {run.tokens.map((token, index) => (
                    <CompletionChip
                      key={`${run.id}-${index}-${token.token}`}
                      token={token}
                      divergence={divergence}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-lg border bg-white p-5 text-center text-sm text-muted-foreground">
          Set sampling parameters and generate several completions to compare
          output variety.
        </div>
      )}
    </div>
  )
}

function TokenChoice({
  candidate,
  selected,
  disabled,
  onClick,
}: {
  candidate: CandidateToken
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-14 w-full items-center justify-between rounded-lg border bg-white px-3 text-left font-mono text-sm transition hover:border-primary hover:bg-sky-50",
        selected && "border-primary bg-sky-50",
        disabled && "cursor-default hover:border-primary",
      )}
    >
      <span className="truncate">{candidate.token || "empty"}</span>
      <span className="ml-2 shrink-0 font-semibold">
        {formatPercent(candidate.weight)}
      </span>
    </button>
  )
}

function CompletionChip({
  token,
  divergence,
}: {
  token: { token: string; probability: number; weight: number }
  divergence: "matches" | "diverges"
}) {
  const band = tokenConfidenceBand(token.weight)

  return (
    <span
      className={cn(
        "inline-flex min-h-12 items-center rounded-md border px-2 py-1 font-mono text-sm",
        divergence === "matches" ? "border-rose-400" : "border-sky-700",
        band === "high" && "bg-emerald-50",
        band === "medium" && "bg-amber-50",
        band === "low" && "bg-rose-50",
      )}
    >
      <span>{token.token || "empty"}</span>
      <span className="ml-1 text-[10px] text-muted-foreground">
        {formatPercent(token.weight)}
      </span>
    </span>
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

function PresetButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactElement
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
      title: "Welcome - sampling shapes output",
      body: "Sampling picks one token from a probability distribution at every step. Because that pick is random, the same prompt and settings can yield different completions.",
    },
    {
      title: "Prompt box",
      body: "Type a prompt under User, set behavior instructions under System, or load one of the preset prompts.",
    },
    {
      title: "Control panel",
      body: "Temperature reshapes the probability distribution, Top-K keeps the K most likely tokens, and Top-P keeps tokens by cumulative probability.",
    },
    {
      title: "Token explorer panel",
      body: "Click Generate, choose a token, and watch the next candidate column appear. The path probability updates as your choices compound.",
    },
    {
      title: "Multiple completions panel",
      body: "Generate several completions from the same prompt. Token colors show how confident the model was at each step.",
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
  open: "sampling" | "explorer" | "completions" | null
  onOpenChange: (open: "sampling" | "explorer" | "completions" | null) => void
}) {
  const copy = {
    sampling: {
      title: "Sampling Parameters",
      body: [
        "Temperature changes how concentrated or spread out the candidate probabilities are.",
        "Top-K keeps a fixed number of likely tokens. Top-P keeps the smallest prefix whose cumulative probability crosses p.",
      ],
    },
    explorer: {
      title: "Token Explorer",
      body: [
        "Each column is a new forward pass conditioned on your prompt and the tokens selected so far.",
        "Choosing a low-probability token can quickly lower the overall path probability and open a different continuation.",
      ],
    },
    completions: {
      title: "Multiple Completions",
      body: [
        "Each row is sampled independently from the same prompt and settings.",
        "Green, yellow, and red backgrounds indicate high-, medium-, and low-weight choices at that token position.",
      ],
    },
  } as const
  const current = open ? copy[open] : copy.sampling

  return (
    <Dialog open={Boolean(open)} onOpenChange={(next) => onOpenChange(next ? open : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-primary">{current.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm leading-6">
          {current.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
