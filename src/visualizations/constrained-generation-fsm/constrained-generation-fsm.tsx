import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Check, Circle, Info, RotateCcw } from "lucide-react"

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
import { cn } from "@/lib/utils"
import { formatPercent } from "@/visualizations/selecting-next-token/sampling"

import {
  buildFsmTrace,
  isValidJson,
} from "./fsm-engine"
import { fsmEdges, fsmExamples, fsmNodes } from "./fsm-fixtures"
import type { FsmExample, FsmStateId, FsmTraceStep, MaskedCandidate } from "./types"

const defaultExample = fsmExamples[0]

export function ConstrainedGenerationFsm() {
  const [exampleId, setExampleId] = useState(defaultExample.id)
  const [stepIndex, setStepIndex] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [fast, setFast] = useState(false)
  const [tutorialOpen, setTutorialOpen] = useState(true)
  const [tutorialStep, setTutorialStep] = useState(0)
  const [infoOpen, setInfoOpen] = useState<
    "state" | "masking" | "unconstrained" | null
  >(null)

  const example =
    fsmExamples.find((candidate) => candidate.id === exampleId) ?? defaultExample
  const trace = useMemo(() => buildFsmTrace(example), [example])
  const currentStep = stepIndex >= 0 ? trace[stepIndex] : null
  const stepNumber = currentStep ? currentStep.index + 1 : 0

  useEffect(() => {
    if (!playing) return
    if (stepIndex >= trace.length - 1) {
      setPlaying(false)
      return
    }

    const timeout = window.setTimeout(
      () => setStepIndex((current) => Math.min(current + 1, trace.length - 1)),
      fast ? 120 : 420,
    )
    return () => window.clearTimeout(timeout)
  }, [fast, playing, stepIndex, trace.length])

  function reset() {
    setPlaying(false)
    setFast(false)
    setStepIndex(-1)
  }

  function selectExample(nextExampleId: string) {
    setExampleId(nextExampleId)
    reset()
  }

  function step() {
    setPlaying(false)
    setStepIndex((current) => Math.min(current + 1, trace.length - 1))
  }

  function play() {
    if (stepIndex >= trace.length - 1) {
      setStepIndex(-1)
    }
    setPlaying((current) => !current)
  }

  function toggleFast() {
    setFast((current) => !current)
    setPlaying(true)
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

      <div className="grid gap-5 xl:grid-cols-[.75fr_1.5fr_.8fr]">
        <PromptPanel
          activeId={example.id}
          examples={fsmExamples}
          onSelect={selectExample}
        />
        <StateMachinePanel
          step={currentStep}
          requiredFields={example.requiredFields}
          onInfo={() => setInfoOpen("state")}
        />
        <SchemaPanel example={example} />
      </div>

      <PlaybackControls
        playing={playing}
        fast={fast}
        stepNumber={stepNumber}
        totalSteps={trace.length}
        complete={stepIndex >= trace.length - 1}
        onStep={step}
        onPlay={play}
        onFast={toggleFast}
        onReset={reset}
      />

      <div className="grid gap-5 xl:grid-cols-[.9fr_1.4fr]">
        <TokenMaskingPanel
          step={currentStep}
          onInfo={() => setInfoOpen("masking")}
        />
        <OutputComparisonPanel
          step={currentStep}
          onInfo={() => setInfoOpen("unconstrained")}
        />
      </div>
    </div>
  )
}

function PromptPanel({
  activeId,
  examples,
  onSelect,
}: {
  activeId: string
  examples: FsmExample[]
  onSelect: (id: string) => void
}) {
  const active = examples.find((example) => example.id === activeId) ?? examples[0]

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-bold text-primary">Prompt</h3>
      <div className="flex flex-wrap gap-2">
        {examples.map((example) => (
          <Button
            key={example.id}
            type="button"
            variant={example.id === activeId ? "default" : "outline"}
            size="sm"
            onClick={() => onSelect(example.id)}
          >
            {example.label}
          </Button>
        ))}
      </div>
      <div className="min-h-[210px] whitespace-pre-wrap rounded-lg border bg-white p-4 text-sm leading-6">
        {active?.prompt}
      </div>
    </section>
  )
}

function SchemaPanel({ example }: { example: FsmExample }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-bold text-primary">Target Schema</h3>
      <pre className="max-h-[345px] overflow-auto rounded-lg border bg-muted/30 p-4 font-mono text-xs leading-5">
        {JSON.stringify(example.schema, null, 2)}
      </pre>
    </section>
  )
}

function StateMachinePanel({
  step,
  requiredFields,
  onInfo,
}: {
  step: FsmTraceStep | null
  requiredFields: string[]
  onInfo: () => void
}) {
  const currentState = step?.state ?? "expect-start"
  const required =
    step?.requiredFields ??
    requiredFields.map((field) => ({ field, complete: false }))

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b p-4">
        <CardTitle className="text-base text-primary">State Machine</CardTitle>
        <Button type="button" variant="ghost" size="icon" onClick={onInfo}>
          <Info className="h-4 w-4" />
          <span className="sr-only">State machine details</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        <div className="flex min-h-20 items-center gap-3 border-b px-5 py-4">
          {step ? (
            <Badge className="font-mono text-base">{displayToken(step.character)}</Badge>
          ) : null}
          <p className="text-sm leading-6 text-muted-foreground">
            {step?.explanation ??
              "Every JSON object must start with {. The FSM blocks all other tokens until the model produces an opening brace."}
          </p>
        </div>
        <FsmDiagram currentState={currentState} />
        <div className="flex flex-wrap items-center gap-3 border-t px-5 py-3 text-xs">
          <span className="font-bold text-primary">Required Fields</span>
          {required.map((field) => (
            <span key={field.field} className="inline-flex items-center gap-1">
              {field.complete ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              {field.field}
            </span>
          ))}
          <span className="ml-auto inline-flex items-center gap-3 text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Circle className="h-3.5 w-3.5 fill-rose-100 text-rose-500" />
              in progress
            </span>
            <span className="inline-flex items-center gap-1">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              complete
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function FsmDiagram({ currentState }: { currentState: FsmStateId }) {
  return (
    <div className="relative h-[330px] bg-white">
      <svg className="absolute inset-0 h-full w-full" role="img" aria-label="FSM transitions">
        <defs>
          <marker
            id="fsm-arrow"
            markerHeight="8"
            markerWidth="8"
            orient="auto"
            refX="7"
            refY="4"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill="#8ab4c4" />
          </marker>
        </defs>
        {fsmEdges.map((edge) => {
          const from = fsmNodes.find((node) => node.id === edge.from)
          const to = fsmNodes.find((node) => node.id === edge.to)
          if (!from || !to) return null
          return (
            <g key={`${edge.from}-${edge.to}-${edge.label}`}>
              <line
                x1={`${from.x}%`}
                y1={`${from.y}%`}
                x2={`${to.x}%`}
                y2={`${to.y}%`}
                stroke="#d5e1e8"
                strokeWidth="2"
                markerEnd="url(#fsm-arrow)"
              />
              <text
                x={`${(from.x + to.x) / 2}%`}
                y={`${(from.y + to.y) / 2 - 2}%`}
                fill="#5e7f8f"
                fontSize="11"
                textAnchor="middle"
              >
                {edge.label}
              </text>
            </g>
          )
        })}
      </svg>
      {fsmNodes.map((node) => {
        const active = node.id === currentState
        return (
          <div
            key={node.id}
            className={cn(
              "absolute flex h-12 w-36 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg border bg-white text-center text-xs font-bold shadow-sm",
              active &&
                "border-accent bg-rose-50 text-accent shadow-[0_0_18px_rgba(238,97,105,0.35)]",
            )}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            {node.label}
          </div>
        )
      })}
    </div>
  )
}

function PlaybackControls({
  playing,
  fast,
  stepNumber,
  totalSteps,
  complete,
  onStep,
  onPlay,
  onFast,
  onReset,
}: {
  playing: boolean
  fast: boolean
  stepNumber: number
  totalSteps: number
  complete: boolean
  onStep: () => void
  onPlay: () => void
  onFast: () => void
  onReset: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={onStep} disabled={complete}>
          Step
        </Button>
        <Button type="button" onClick={onPlay}>
          {playing ? "Pause" : "Play"}
        </Button>
        <Button
          type="button"
          variant={fast ? "default" : "outline"}
          onClick={onFast}
          disabled={complete}
        >
          Fast
        </Button>
        <Button type="button" variant="outline" onClick={onReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>
      <p className="font-mono text-sm text-muted-foreground">
        Step {stepNumber} / {totalSteps}
      </p>
    </div>
  )
}

function TokenMaskingPanel({
  step,
  onInfo,
}: {
  step: FsmTraceStep | null
  onInfo: () => void
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center gap-2 space-y-0 border-b p-4">
        <CardTitle className="text-2xl text-accent">Token Masking</CardTitle>
        <Button type="button" variant="ghost" size="icon" onClick={onInfo}>
          <Info className="h-4 w-4" />
          <span className="sr-only">Token masking details</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-6 p-4">
        {!step ? (
          <p className="text-sm text-muted-foreground">
            Press Step to begin generation.
          </p>
        ) : (
          <>
            <CandidateList
              title="Model Output (all tokens, unconstrained)"
              candidates={step.maskedCandidates}
              mode="raw"
            />
            <CandidateList
              title="After FSM Masking (renormalized)"
              candidates={step.maskedCandidates}
              mode="masked"
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}

function CandidateList({
  title,
  candidates,
  mode,
}: {
  title: string
  candidates: MaskedCandidate[]
  mode: "raw" | "masked"
}) {
  const values =
    mode === "raw"
      ? candidates
      : candidates.filter((candidate) => candidate.maskedProbability > 0)

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-primary">{title}</h4>
      <div className="space-y-2">
        {values.map((candidate) => {
          const value =
            mode === "raw" ? candidate.probability : candidate.maskedProbability
          return (
            <div
              key={`${mode}-${candidate.token}`}
              className={cn(
                "grid grid-cols-[1.6rem_8rem_1fr_4.5rem] items-center gap-2 rounded-md border bg-white px-2 py-2 text-sm",
                mode === "raw" && !candidate.allowed && "opacity-50",
                mode === "raw" && candidate.allowed && "border-accent/50 bg-rose-50",
              )}
            >
              <span className="text-primary">{candidate.allowed ? "✓" : "×"}</span>
              <span className="truncate font-mono">{displayToken(candidate.token)}</span>
              <span className="h-3 overflow-hidden rounded-full bg-muted">
                <span
                  className={cn(
                    "block h-full rounded-full",
                    candidate.allowed ? "bg-accent" : "bg-muted-foreground/20",
                  )}
                  style={{ width: `${Math.max(2, value * 100)}%` }}
                />
              </span>
              <span className="text-right font-mono text-xs text-muted-foreground">
                {formatPercent(value)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function OutputComparisonPanel({
  step,
  onInfo,
}: {
  step: FsmTraceStep | null
  onInfo: () => void
}) {
  const constrained = step?.constrainedOutput ?? "Waiting..."
  const unconstrained = step?.unconstrainedOutput ?? "Waiting..."
  const unconstrainedValid = step ? isValidJson(unconstrained) : false

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b p-4">
        <CardTitle className="text-2xl text-accent">Output Comparison</CardTitle>
      </CardHeader>
      <CardContent className="grid p-0 md:grid-cols-2">
        <OutputBox
          title="With FSM (Constrained)"
          output={constrained}
          valid={step?.constrainedValid ?? false}
        />
        <OutputBox
          title="Without FSM (Unconstrained)"
          output={unconstrained}
          valid={unconstrainedValid}
          warning={!unconstrainedValid && Boolean(step)}
          onInfo={onInfo}
        />
      </CardContent>
    </Card>
  )
}

function OutputBox({
  title,
  output,
  valid,
  warning,
  onInfo,
}: {
  title: string
  output: string
  valid: boolean
  warning?: boolean
  onInfo?: () => void
}) {
  return (
    <section
      className={cn(
        "min-h-[260px] border-b p-4 md:border-b-0 md:border-r last:border-r-0",
        warning && "bg-rose-50/60",
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        <h4 className={cn("font-bold text-primary", warning && "text-destructive")}>
          {title}
        </h4>
        {onInfo ? (
          <Button type="button" variant="ghost" size="icon" onClick={onInfo}>
            <Info className="h-4 w-4" />
            <span className="sr-only">Unconstrained output details</span>
          </Button>
        ) : null}
        {warning ? <AlertTriangle className="h-4 w-4 text-destructive" /> : null}
        {valid ? <Check className="h-4 w-4 text-emerald-600" /> : null}
      </div>
      <pre className="min-h-28 whitespace-pre-wrap rounded-md bg-white p-3 font-mono text-sm leading-6">
        {output}
      </pre>
      {warning ? (
        <div className="mt-4 rounded-md border border-destructive/20 bg-rose-100 p-3 text-sm text-destructive">
          Invalid JSON structure
        </div>
      ) : null}
    </section>
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
      title: "Welcome - structured output with a finite state machine",
      body: "Sometimes you do not just want text - you want valid JSON that matches a schema. Constrained generation prevents off-format output by masking tokens that would break the schema.",
    },
    {
      title: "Prompt panel",
      body: "Select from three preset prompts that vary in difficulty: function calls, sentiment classification, and data extraction.",
    },
    {
      title: "Schema panel",
      body: "This is the required JSON schema with fields, types, and required keys.",
    },
    {
      title: "State machine panel",
      body: "The current FSM state is highlighted. The diagram shows which characters or token categories can move generation forward.",
    },
    {
      title: "Token masking panel",
      body: "Compare the original model distribution with the masked distribution. Invalid candidates get probability zero.",
    },
    {
      title: "Output panel",
      body: "Compare constrained JSON on the left with an unconstrained response on the right.",
    },
    {
      title: "Playback panel",
      body: "Step advances one character at a time. Play runs the whole trace, Fast speeds it up, and Reset rewinds.",
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
        <p className="text-sm leading-6">{current.body}</p>
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
  open: "state" | "masking" | "unconstrained" | null
  onOpenChange: (open: "state" | "masking" | "unconstrained" | null) => void
}) {
  const copy = {
    state: {
      title: "State Machine",
      body: "The FSM is a small parser for valid JSON. At each step it knows which character categories are legal next, then masks anything that would move outside the schema.",
    },
    masking: {
      title: "Token Masking",
      body: "The model still proposes candidates, but the constrained decoder sets invalid candidates to zero and renormalizes the remaining probability mass.",
    },
    unconstrained: {
      title: "Unconstrained Output",
      body: "Without the FSM, the model can answer in prose, markdown, or code. That may be useful for chat, but it is invalid when the caller requires schema-matching JSON.",
    },
  } as const
  const current = open ? copy[open] : copy.state

  return (
    <Dialog open={Boolean(open)} onOpenChange={(next) => onOpenChange(next ? open : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-primary">{current.title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm leading-6">{current.body}</p>
      </DialogContent>
    </Dialog>
  )
}

function displayToken(token: string) {
  if (token === " ") return "space"
  if (token === "\n") return "\\n"
  if (token === "\"") return "\""
  return token
}
