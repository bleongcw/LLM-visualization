import assert from "node:assert/strict"
import test from "node:test"

import {
  appendCompletionToken,
  completionDivergence,
  cumulativePathProbability,
  displayPromptPreview,
  tokenConfidenceBand,
} from "./sampling-path"

test("cumulativePathProbability multiplies selected token weights", () => {
  assert.equal(
    cumulativePathProbability([{ weight: 0.5 }, { weight: 0.25 }, undefined]),
    0.125,
  )
})

test("cumulativePathProbability is zero with no selections", () => {
  assert.equal(cumulativePathProbability([]), 0)
})

test("tokenConfidenceBand classifies low, medium, and high probabilities", () => {
  assert.equal(tokenConfidenceBand(0.1), "low")
  assert.equal(tokenConfidenceBand(0.45), "medium")
  assert.equal(tokenConfidenceBand(0.8), "high")
})

test("completionDivergence identifies rows that match or diverge from the reference", () => {
  const reference = {
    id: 1,
    tokens: [
      { token: "The", probability: 0.9, weight: 0.9 },
      { token: " answer", probability: 0.7, weight: 0.7 },
    ],
  }

  assert.equal(completionDivergence(reference, reference), "matches")
  assert.equal(
    completionDivergence(reference, {
      id: 2,
      tokens: [
        { token: "The", probability: 0.9, weight: 0.9 },
        { token: " output", probability: 0.3, weight: 0.3 },
      ],
    }),
    "diverges",
  )
})

test("appendCompletionToken preserves existing run data", () => {
  const run = { id: 1, tokens: [] }
  const next = appendCompletionToken(run, {
    token: "The",
    probability: 0.8,
    weight: 0.8,
  })

  assert.equal(run.tokens.length, 0)
  assert.equal(next.tokens.length, 1)
})

test("displayPromptPreview trims long prompt text", () => {
  assert.equal(displayPromptPreview("  one   two  "), "one two")
  assert.equal(displayPromptPreview("abcdefghijklmnopqrstuvwxyz", 8), "abcde...")
})

