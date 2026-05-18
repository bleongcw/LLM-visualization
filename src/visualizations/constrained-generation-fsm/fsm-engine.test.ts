import assert from "node:assert/strict"
import test from "node:test"

import {
  applyFsmMask,
  buildFsmTrace,
  getRequiredFieldStatus,
  isTokenAllowed,
  isValidJson,
} from "./fsm-engine"
import { fsmExamples } from "./fsm-fixtures"

test("FSM mask blocks invalid opening tokens", () => {
  const masked = applyFsmMask(
    [
      { token: "{", probability: 0.2 },
      { token: "```python", probability: 0.7 },
      { token: "\"", probability: 0.1 },
    ],
    "expect-start",
  )

  assert.equal(masked.find((candidate) => candidate.token === "{")?.allowed, true)
  assert.equal(
    masked.find((candidate) => candidate.token === "```python")?.maskedProbability,
    0,
  )
  assert.equal(masked.find((candidate) => candidate.token === "\"")?.allowed, false)
})

test("FSM mask renormalizes allowed probabilities to one", () => {
  const masked = applyFsmMask(
    [
      { token: "\"", probability: 0.25 },
      { token: "}", probability: 0.25 },
      { token: "calculate", probability: 0.5 },
    ],
    "expect-key-or-end",
  )
  const total = masked.reduce(
    (sum, candidate) => sum + candidate.maskedProbability,
    0,
  )

  assert.equal(total, 1)
})

test("string state allows characters and closing quotes but blocks structural punctuation", () => {
  assert.equal(isTokenAllowed("in-string", "e"), true)
  assert.equal(isTokenAllowed("in-string", "\""), true)
  assert.equal(isTokenAllowed("in-string", ":"), false)
  assert.equal(isTokenAllowed("in-string", ","), false)
})

test("number state accepts numeric continuation and JSON delimiters", () => {
  assert.equal(isTokenAllowed("in-number", "7"), true)
  assert.equal(isTokenAllowed("in-number", "."), true)
  assert.equal(isTokenAllowed("in-number", "}"), true)
  assert.equal(isTokenAllowed("in-number", "height"), false)
})

test("required field tracking marks fields once their keys appear", () => {
  const status = getRequiredFieldStatus('{"name":"x","arguments":{', [
    "name",
    "arguments",
    "height",
  ])

  assert.deepEqual(status, [
    { field: "name", complete: true },
    { field: "arguments", complete: true },
    { field: "height", complete: false },
  ])
})

test("fixture constrained outputs parse as valid JSON", () => {
  for (const example of fsmExamples) {
    assert.equal(isValidJson(example.constrainedOutput), true)
  }
})

test("fixture unconstrained outputs are not valid JSON", () => {
  for (const example of fsmExamples) {
    assert.equal(isValidJson(example.unconstrainedOutput), false)
  }
})

test("full trace ends with valid JSON and complete state", () => {
  const trace = buildFsmTrace(fsmExamples[0])
  const final = trace.at(-1)

  assert.ok(final)
  assert.equal(final.constrainedValid, true)
  assert.equal(final.constrainedOutput, fsmExamples[0].constrainedOutput)
})

test("first trace step starts at the opening-brace state", () => {
  const trace = buildFsmTrace(fsmExamples[0])

  assert.equal(trace[0]?.state, "expect-start")
  assert.equal(trace[0]?.character, "{")
})
