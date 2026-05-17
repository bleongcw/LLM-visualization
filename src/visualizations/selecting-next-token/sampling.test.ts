import assert from "node:assert/strict"
import test from "node:test"

import {
  buildCandidateDistribution,
  probabilityBand,
  sampleWeighted,
} from "./sampling"

const rawCandidates = [
  { token: "The", logprob: Math.log(0.5), probability: 0.5 },
  { token: "A", logprob: Math.log(0.3), probability: 0.3 },
  { token: "One", logprob: Math.log(0.15), probability: 0.15 },
  { token: "Some", logprob: Math.log(0.05), probability: 0.05 },
]

test("temperature-adjusted probabilities sum to one", () => {
  const candidates = buildCandidateDistribution({
    candidates: rawCandidates,
    temperature: 1,
    mode: "top-k",
    topK: 4,
    topP: 0.95,
  })

  const total = candidates.reduce(
    (sum, candidate) => sum + candidate.adjustedProbability,
    0,
  )

  assert.equal(Math.round(total * 1000), 1000)
})

test("lower temperature sharpens the most likely token", () => {
  const normal = buildCandidateDistribution({
    candidates: rawCandidates,
    temperature: 1,
    mode: "top-k",
    topK: 4,
    topP: 0.95,
  })
  const cold = buildCandidateDistribution({
    candidates: rawCandidates,
    temperature: 0.25,
    mode: "top-k",
    topK: 4,
    topP: 0.95,
  })

  assert.ok(cold[0].adjustedProbability > normal[0].adjustedProbability)
})

test("top-k keeps only the requested number of weighted candidates", () => {
  const candidates = buildCandidateDistribution({
    candidates: rawCandidates,
    temperature: 1,
    mode: "top-k",
    topK: 2,
    topP: 0.95,
  })

  assert.equal(candidates.filter((candidate) => candidate.weight > 0).length, 2)
  assert.equal(Math.round(sumWeights(candidates) * 1000), 1000)
})

test("top-p keeps the smallest prefix that crosses the cumulative threshold", () => {
  const candidates = buildCandidateDistribution({
    candidates: rawCandidates,
    temperature: 1,
    mode: "top-p",
    topK: 4,
    topP: 0.75,
  })

  assert.equal(candidates.filter((candidate) => candidate.weight > 0).length, 2)
  assert.equal(Math.round(sumWeights(candidates) * 1000), 1000)
})

test("sampling follows cumulative weights with deterministic random draws", () => {
  const candidates = buildCandidateDistribution({
    candidates: rawCandidates,
    temperature: 1,
    mode: "top-k",
    topK: 2,
    topP: 0.95,
  })

  assert.equal(sampleWeighted(candidates, () => 0.1)?.token, "The")
  assert.equal(sampleWeighted(candidates, () => 0.95)?.token, "A")
})

test("probability bands classify generated token confidence", () => {
  assert.equal(probabilityBand(0.8), "high")
  assert.equal(probabilityBand(0.5), "medium")
  assert.equal(probabilityBand(0.1), "low")
})

function sumWeights(candidates: Array<{ weight: number }>) {
  return candidates.reduce((sum, candidate) => sum + candidate.weight, 0)
}

