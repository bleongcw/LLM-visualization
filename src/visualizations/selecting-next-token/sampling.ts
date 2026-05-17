import type { TopLogprob } from "@/lib/ollama/types"

import type { CandidateToken, SamplingMode } from "./types"

export function buildCandidateDistribution({
  candidates,
  temperature,
  mode,
  topK,
  topP,
  frequencies = new Map<string, number>(),
}: {
  candidates: TopLogprob[]
  temperature: number
  mode: SamplingMode
  topK: number
  topP: number
  frequencies?: Map<string, number>
}): CandidateToken[] {
  const adjusted = applyTemperature(candidates, temperature)
  const selectedIds =
    mode === "top-k"
      ? selectTopK(adjusted, topK)
      : selectTopP(adjusted, topP)
  const selectedTotal = adjusted.reduce(
    (total, candidate) =>
      selectedIds.has(candidate.id) ? total + candidate.adjustedProbability : total,
    0,
  )

  return adjusted.map((candidate) => ({
    ...candidate,
    selected: selectedIds.has(candidate.id),
    weight:
      selectedIds.has(candidate.id) && selectedTotal > 0
        ? candidate.adjustedProbability / selectedTotal
        : 0,
    frequency: frequencies.get(candidate.id) ?? 0,
  }))
}

export function sampleWeighted(
  candidates: CandidateToken[],
  random = Math.random,
): CandidateToken | null {
  const selected = candidates.filter((candidate) => candidate.weight > 0)
  if (!selected.length) return null

  const draw = random()
  let cumulative = 0

  for (const candidate of selected) {
    cumulative += candidate.weight
    if (draw <= cumulative) return candidate
  }

  return selected[selected.length - 1]
}

export function formatPercent(value: number, digits = 1) {
  if (value <= 0) return "0.0%"
  if (value < 0.001) return "<0.1%"
  return `${(value * 100).toFixed(digits)}%`
}

export function probabilityBand(probability: number) {
  if (probability >= 0.7) return "high"
  if (probability >= 0.3) return "medium"
  return "low"
}

function applyTemperature(candidates: TopLogprob[], temperature: number) {
  const safeTemperature = Math.max(0.05, temperature)
  const prepared = candidates
    .filter((candidate) => candidate.token)
    .map((candidate, index) => ({
      ...candidate,
      id: `${candidate.token}-${index}`,
      scaledLogprob: candidate.logprob / safeTemperature,
    }))

  const maxLogprob = Math.max(
    ...prepared.map((candidate) => candidate.scaledLogprob),
    0,
  )
  const exponentials = prepared.map((candidate) =>
    Math.exp(candidate.scaledLogprob - maxLogprob),
  )
  const total = exponentials.reduce((sum, value) => sum + value, 0)

  return prepared.map((candidate, index) => ({
    ...candidate,
    adjustedProbability: total > 0 ? exponentials[index] / total : 0,
  }))
}

function selectTopK(
  candidates: Array<{ id: string; adjustedProbability: number }>,
  topK: number,
) {
  return new Set(
    candidates
      .slice()
      .sort((a, b) => b.adjustedProbability - a.adjustedProbability)
      .slice(0, Math.max(1, topK))
      .map((candidate) => candidate.id),
  )
}

function selectTopP(
  candidates: Array<{ id: string; adjustedProbability: number }>,
  topP: number,
) {
  const selected = new Set<string>()
  let cumulative = 0

  for (const candidate of candidates
    .slice()
    .sort((a, b) => b.adjustedProbability - a.adjustedProbability)) {
    if (selected.size > 0 && cumulative >= topP) break
    selected.add(candidate.id)
    cumulative += candidate.adjustedProbability
  }

  return selected
}

