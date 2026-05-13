import { TooltipProvider } from "@/components/ui/tooltip"
import { AppShell } from "@/components/layout/app-shell"
import { VisualizationShell } from "@/components/visualization-shell/visualization-shell"
import { visualizations } from "@/visualizations"

export default function App() {
  const activeVisualization = visualizations[0]
  const Visualization = activeVisualization.component

  return (
    <TooltipProvider delayDuration={200}>
      <AppShell visualizations={visualizations} activeId={activeVisualization.id}>
        <VisualizationShell definition={activeVisualization}>
          <Visualization />
        </VisualizationShell>
      </AppShell>
    </TooltipProvider>
  )
}
