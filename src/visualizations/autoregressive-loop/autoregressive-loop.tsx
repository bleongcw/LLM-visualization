import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Bug,
  Code2,
  FastForward,
  ListRestart,
  MessageSquare,
  Music,
  Play,
  Square,
  StepForward,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getNextToken } from "@/lib/ollama/client"
import { tokenizeForDisplay } from "@/lib/tokenization/simple-tokenizer"
import { cn } from "@/lib/utils"
import { visualizations } from "@/visualizations"

import { infoCopy } from "./info-copy"
import { InfoDialog } from "./info-dialog"
import { LoopDiagram } from "./loop-diagram"
import { TutorialDialog } from "./tutorial-dialog"
import type { GenerationStep, LoopPhase } from "./types"

const definition = visualizations[0]
const defaultExample = definition.examples[0]

export function AutoregressiveLoop() {
  const [prompt, setPrompt] = useState(defaultExample.prompt)
  const [system, setSystem] = useState(defaultExample.system ?? "")
  const [generated, setGenerated] = useState("")
  const [phase, setPhase] = useState<LoopPhase>("input")
  const [currentStep, setCurrentStep] = useState<GenerationStep | null>(null)
  const [history, setHistory] = useState<GenerationStep[]>([])
  const [maxNewTokens, setMaxNewTokens] = useState(64)
  const [contextLimit, setContextLimit] = useState(2048)
  const [speed, setSpeed] = useState(850)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const runCancelled = useRef(false)

  const displayTokens = useMemo(
    () => tokenizeForDisplay({ prompt, generated }),
    [prompt, generated],
  )

  const selectedCandidate = currentStep?.candidates[0]
  const generatedTokenCount = history.length
  const hasStopped = Boolean(history.at(-1)?.stopReason)

  const stepOnce = useCallback(async () => {
    setError(null)

    if (hasStopped && phase === "input") return

    if (phase === "input") {
      const next = await getNextToken({
        prompt,
        system,
        generated,
        maxNewTokens,
        generatedTokenCount,
        contextLimit,
      })
      setCurrentStep({
        token: next.token,
        tokenId: next.tokenId,
        candidates: next.topCandidates,
        contextCount: next.contextCount,
        stopReason: next.stopReason,
      })
      setPhase("compute")
      return
    }

    if (phase === "compute") {
      setPhase("select")
      return
    }

    if (phase === "select") {
      setPhase("stop")
      return
    }

    if (phase === "stop" && currentStep) {
      const nextGenerated = currentStep.token
        ? `${generated}${currentStep.token}`
        : generated
      setGenerated(nextGenerated)
      setHistory((items) => [...items, currentStep])
      setCurrentStep(null)
      setPhase("input")
    }
  }, [
    contextLimit,
    currentStep,
    generated,
    generatedTokenCount,
    hasStopped,
    maxNewTokens,
    phase,
    prompt,
    system,
  ])

  useEffect(() => {
    if (!running) return
    if (hasStopped) {
      setRunning(false)
      return
    }

    const timer = window.setTimeout(() => {
      if (runCancelled.current) return
      void stepOnce().catch((stepError) => {
        setError(
          stepError instanceof Error
            ? stepError.message
            : "Generation failed while playing.",
        )
        setRunning(false)
      })
    }, speed)

    return () => window.clearTimeout(timer)
  }, [hasStopped, running, speed, stepOnce])

  function playLoop() {
    if (running) {
      runCancelled.current = true
      setRunning(false)
      return
    }

    runCancelled.current = false
    setRunning(true)
  }

  function restart() {
    runCancelled.current = true
    setGenerated("")
    setHistory([])
    setCurrentStep(null)
    setPhase("input")
    setRunning(false)
    setError(null)
  }

  function loadExample(exampleId: string) {
    const example = definition.examples.find((item) => item.id === exampleId)
    if (!example) return
    setPrompt(example.prompt)
    setSystem(example.system ?? "")
    restart()
  }

  return (
    <div className="space-y-5">
      <TutorialDialog />
      <div className="grid gap-4 xl:grid-cols-[1.1fr_1.1fr_1fr]">
        <section className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-primary">Prompt</h3>
            <Tabs defaultValue="user" className="w-auto">
              <TabsList>
                <TabsTrigger value="user">User</TabsTrigger>
                <TabsTrigger value="system">System</TabsTrigger>
              </TabsList>
            </Tabs>
            <PresetButton icon={<Code2 />} label="Bayesian" onClick={() => loadExample("bayesian")} />
            <PresetButton icon={<MessageSquare />} label="Sentiment" onClick={() => loadExample("sentiment")} />
            <PresetButton icon={<Bug />} label="Debugging" onClick={() => loadExample("debugging")} />
            <PresetButton icon={<Music />} label="Creative" onClick={() => setPrompt("Write a short, vivid metaphor for how transformers read context.")} />
          </div>
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className="min-h-[150px] resize-y text-base"
          />
          <Textarea
            value={system}
            onChange={(event) => setSystem(event.target.value)}
            className="min-h-20 resize-y text-sm"
            placeholder="Optional system instruction"
          />
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-bold text-primary">Response</h3>
          <div className="min-h-[248px] rounded-lg border bg-white p-4 text-base leading-7 shadow-sm">
            {generated || currentStep?.token ? (
              <span>
                {generated}
                {phase === "select" || phase === "stop" ? (
                  <mark className="rounded bg-rose-100 px-1 text-rose-700">
                    {currentStep?.token}
                  </mark>
                ) : null}
              </span>
            ) : (
              <span className="text-muted-foreground">
                Generated text will appear here one token at a time.
              </span>
            )}
          </div>
        </section>

        <LoopDiagram activePhase={phase} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => void stepOnce()} disabled={running || hasStopped}>
          <StepForward className="mr-2 h-4 w-4" />
          Step
        </Button>
        <Button variant="outline" onClick={playLoop} disabled={hasStopped}>
          {running ? (
            <Square className="mr-2 h-4 w-4" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          {running ? "Stop" : "Play"}
        </Button>
        <Button
          variant="outline"
          onClick={() => setSpeed((current) => Math.max(150, current - 200))}
        >
          <FastForward className="mr-2 h-4 w-4" />
          Faster
        </Button>
        <Button variant="secondary" onClick={restart}>
          <ListRestart className="mr-2 h-4 w-4" />
          Restart
        </Button>
        <Badge variant="outline">{phaseLabel(phase)}</Badge>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.35fr_.8fr_1.25fr]">
        <StageCard
          title="Input Tokens"
          active={phase === "input"}
          info={infoCopy.input}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-primary">Context Window</p>
              <p className="text-xs text-muted-foreground">
                Current: {displayTokens.length} / {contextLimit}
              </p>
            </div>
            <Badge variant="outline">Tokens</Badge>
          </div>
          <div className="max-h-[290px] overflow-auto rounded-lg border bg-muted/30 p-3">
            <div className="flex flex-wrap gap-1.5">
              {displayTokens.map((token, index) => (
                <span
                  key={`${token.id}-${index}`}
                  className={cn(
                    "token-chip",
                    token.kind === "special" && "token-chip-special",
                    token.kind === "prompt" && "token-chip-prompt",
                  )}
                >
                  {token.text}
                </span>
              ))}
            </div>
          </div>
        </StageCard>

        <StageCard
          title="Compute Probabilities"
          active={phase === "compute"}
          info={infoCopy.compute}
        >
          <div className="grid grid-cols-[5rem_1fr_5rem] border-b pb-2 text-xs font-bold uppercase text-muted-foreground">
            <span>ID</span>
            <span>Token</span>
            <span className="text-right">Prob</span>
          </div>
          <div className="max-h-[330px] overflow-auto">
            {(currentStep?.candidates.length ? currentStep.candidates : []).map(
              (candidate, index) => (
                <div
                  key={`${candidate.token}-${index}`}
                  className={cn(
                    "grid grid-cols-[5rem_1fr_5rem] items-center gap-2 border-b py-2 text-sm",
                    index === 0 && "bg-sky-50",
                  )}
                >
                  <span className="font-mono text-rose-500">
                    {candidate.bytes?.[0] ?? currentStep?.tokenId ?? "-"}
                  </span>
                  <span className="token-chip max-w-full truncate">
                    {candidate.token || "empty"}
                  </span>
                  <span className="text-right font-mono font-semibold text-primary">
                    {(candidate.probability * 100).toFixed(
                      candidate.probability > 0.01 ? 1 : 3,
                    )}
                    %
                  </span>
                </div>
              ),
            )}
            {!currentStep ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Click Step to ask Ollama for the next-token distribution.
              </p>
            ) : null}
          </div>
        </StageCard>

        <StageCard
          title="Select Token"
          active={phase === "select"}
          info={infoCopy.select}
        >
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center">
            <p className="max-w-48 text-xs font-semibold text-muted-foreground">
              Greedy sampling selects the highest-probability token.
            </p>
            {selectedCandidate ? (
              <>
                <p className="font-mono text-lg font-semibold text-primary">
                  {currentStep?.tokenId ?? "-"}
                </p>
                <span className="token-chip text-lg">{selectedCandidate.token}</span>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No token selected yet.</p>
            )}
          </div>
        </StageCard>

        <StageCard
          title="Stop or continue?"
          active={phase === "stop"}
          info={infoCopy.stop}
        >
          <div className="mb-4 flex gap-2">
            <Badge variant={currentStep?.stopReason ? "outline" : "success"}>
              Continue
            </Badge>
            <Badge variant={currentStep?.stopReason ? "warning" : "outline"}>
              Stop
            </Badge>
          </div>
          <div className="space-y-3">
            <LimitRow
              label="Max New Tokens"
              current={generatedTokenCount + (currentStep ? 1 : 0)}
              value={maxNewTokens}
              onChange={setMaxNewTokens}
            />
            <LimitRow
              label="Max Context Window"
              current={currentStep?.contextCount ?? displayTokens.length}
              value={contextLimit}
              onChange={setContextLimit}
            />
            <div className="rounded-lg border bg-white p-3">
              <p className="text-xs font-bold text-muted-foreground">End Token</p>
              <p className="mt-2 text-sm">
                {currentStep?.stopReason === "stop_token"
                  ? "Stop token generated."
                  : "Last token is not a stop token."}
              </p>
            </div>
            {history.at(-1)?.stopReason ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Loop stopped: {history.at(-1)?.stopReason}
              </div>
            ) : null}
          </div>
        </StageCard>
      </div>
    </div>
  )
}

function StageCard({
  title,
  active,
  info,
  children,
}: {
  title: string
  active: boolean
  info: string
  children: React.ReactNode
}) {
  return (
    <Card
      className={cn(
        "min-h-[420px] transition-shadow",
        active && "border-accent shadow-[0_0_0_3px_rgba(244,63,94,0.12)]",
      )}
    >
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-xl text-accent">{title}</CardTitle>
        <InfoDialog title={title}>{info}</InfoDialog>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
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

function LimitRow({
  label,
  current,
  value,
  onChange,
}: {
  label: string
  current: number
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <label className="text-xs font-bold text-muted-foreground">{label}</label>
      <div className="mt-2 flex items-center gap-2">
        <span className="font-mono text-sm">{current} &lt;</span>
        <Input
          type="number"
          value={value}
          min={1}
          max={8192}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-9 max-w-28"
        />
      </div>
    </div>
  )
}

function phaseLabel(phase: LoopPhase) {
  if (phase === "input") return "Input tokens"
  if (phase === "compute") return "Compute probabilities"
  if (phase === "select") return "Select token"
  return "Stop or continue"
}
