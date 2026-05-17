import { useState } from "react"

import { TooltipProvider } from "@/components/ui/tooltip"
import { AppShell } from "@/components/layout/app-shell"
import { VisualizationShell } from "@/components/visualization-shell/visualization-shell"
import { visualizations } from "@/visualizations"

export default function App() {
  const [activeId, setActiveId] = useState(visualizations[0]?.id ?? "")
  const activeVisualization =
    visualizations.find((visualization) => visualization.id === activeId) ??
    visualizations[0]
  const Visualization = activeVisualization.component

  return (
    <TooltipProvider delayDuration={200}>
      <AppShell
        visualizations={visualizations}
        activeId={activeVisualization.id}
        onSelect={setActiveId}
      >
        <VisualizationShell definition={activeVisualization}>
          <Visualization />
        </VisualizationShell>
      </AppShell>
    </TooltipProvider>
  )
}
