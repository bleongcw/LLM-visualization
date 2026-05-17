import { useCallback, useEffect, useState } from "react"
import { BookOpen, CircleAlert, CircleCheck, RefreshCcw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { getHealth } from "@/lib/ollama/client"
import type { HealthStatus } from "@/lib/ollama/types"
import type { VisualizationDefinition } from "@/visualizations/types"

type VisualizationShellProps = {
  definition: VisualizationDefinition
  children: React.ReactNode
}

export function VisualizationShell({
  definition,
  children,
}: VisualizationShellProps) {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshHealth = useCallback(async () => {
    setLoading(true)
    try {
      setHealth(await getHealth())
    } catch (error) {
      setHealth({
        ok: false,
        ollamaReachable: false,
        modelInstalled: false,
        model: definition.modelBadge ?? "qwen3:0.6b",
        message:
          error instanceof Error
            ? error.message
            : "Unable to reach the local API proxy.",
      })
    } finally {
      setLoading(false)
    }
  }, [definition.modelBadge])

  useEffect(() => {
    void refreshHealth()
  }, [refreshHealth])

  return (
    <section className="container py-6">
      <div className="mb-5 rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-5xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold tracking-normal text-primary">
                {definition.heading ?? definition.title}
              </h2>
              {definition.modelBadge ? (
                <Badge variant="success">{definition.modelBadge}</Badge>
              ) : null}
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {definition.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge health={health} loading={loading} />
            <Button variant="outline" size="sm" onClick={refreshHealth}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Check
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button size="sm">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Instructions
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Instructions</SheetTitle>
                  <SheetDescription>
                    A quick guide for using this visualization.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-5 text-sm leading-6">
                  {definition.instructions.map((instruction, index) => (
                    <p key={instruction}>
                      <span className="font-semibold">{index + 1}. </span>
                      {instruction}
                    </p>
                  ))}
                  <div className="rounded-lg border bg-muted/40 p-4">
                    <p className="font-semibold">Local model requirement</p>
                    <p className="mt-2 text-muted-foreground">
                      Run <code>ollama serve</code> and{" "}
                      <code>ollama pull qwen3:0.6b</code> before using live
                      generation.
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      {health && !health.ok ? (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <CircleAlert className="mt-0.5 h-4 w-4 flex-none" />
          <p>{health.message}</p>
        </div>
      ) : null}
      {children}
    </section>
  )
}

function StatusBadge({
  health,
  loading,
}: {
  health: HealthStatus | null
  loading: boolean
}) {
  if (loading) {
    return <Badge variant="outline">Checking Ollama</Badge>
  }

  if (health?.ok) {
    return (
      <Badge variant="success" className="gap-1.5">
        <CircleCheck className="h-3.5 w-3.5" />
        Ollama ready
      </Badge>
    )
  }

  return (
    <Badge variant="warning" className="gap-1.5">
      <CircleAlert className="h-3.5 w-3.5" />
      Setup needed
    </Badge>
  )
}
