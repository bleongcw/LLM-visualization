import { ArrowRight, RotateCcw } from "lucide-react"

import { cn } from "@/lib/utils"

import type { LoopPhase } from "./types"

const nodes: Array<{ id: LoopPhase; label: string }> = [
  { id: "input", label: "Input tokens" },
  { id: "compute", label: "Compute probabilities" },
  { id: "select", label: "Select token" },
  { id: "stop", label: "Stop or continue?" },
]

export function LoopDiagram({ activePhase }: { activePhase: LoopPhase }) {
  return (
    <div className="flex h-full min-h-[170px] items-center justify-center rounded-lg border bg-white p-4">
      <div className="grid w-full max-w-3xl grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:items-center">
        {nodes.map((node, index) => (
          <div className="contents" key={node.id}>
            <div
              className={cn(
                "flex min-h-16 items-center justify-center rounded-md border px-4 text-center text-sm font-semibold transition-all",
                activePhase === node.id
                  ? "border-accent bg-rose-50 text-accent shadow-[0_0_0_4px_rgba(244,63,94,0.12)]"
                  : "border-primary/40 bg-sky-50/70 text-primary",
              )}
            >
              {node.label}
            </div>
            {index < nodes.length - 1 ? (
              <ArrowRight className="hidden h-6 w-6 text-primary md:block" />
            ) : null}
          </div>
        ))}
        <div className="hidden md:col-span-7 md:flex md:items-center md:justify-center md:gap-2 md:text-xs md:font-medium md:text-muted-foreground">
          <RotateCcw className="h-4 w-4" />
          selected token is appended to the next input
        </div>
      </div>
    </div>
  )
}
