import type { ComponentType } from "react"

export type VisualizationCapability = {
  provider: "ollama" | "browser" | "none"
  model?: string
  features?: string[]
}

export type VisualizationExample = {
  id: string
  label: string
  prompt: string
  system?: string
}

export type VisualizationDefinition = {
  id: string
  title: string
  path: string
  description: string
  modelBadge?: string
  instructions: string[]
  examples: VisualizationExample[]
  capabilities?: VisualizationCapability[]
  component: ComponentType
}
