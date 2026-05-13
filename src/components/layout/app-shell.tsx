import { Network, PanelsTopLeft } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { type VisualizationDefinition } from "@/visualizations/types"

type AppShellProps = {
  visualizations: VisualizationDefinition[]
  activeId: string
  children: React.ReactNode
}

export function AppShell({ visualizations, activeId, children }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white/90 backdrop-blur">
        <div className="container flex min-h-16 flex-col justify-between gap-3 py-3 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                LLM Visualization
              </p>
              <h1 className="text-xl font-semibold tracking-normal">
                Interactive model mechanics
              </h1>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            {visualizations.map((visualization) => (
              <Badge
                key={visualization.id}
                variant={visualization.id === activeId ? "default" : "outline"}
                className="gap-1.5 rounded-md px-3 py-1.5"
              >
                <PanelsTopLeft className="h-3.5 w-3.5" />
                {visualization.title}
              </Badge>
            ))}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
