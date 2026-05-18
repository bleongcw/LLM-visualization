import type {
  FsmCandidate,
  FsmExample,
  FsmStateId,
  FsmTraceStep,
  MaskedCandidate,
  RequiredFieldStatus,
} from "./types"

const stateCopy: Record<FsmStateId, string> = {
  "expect-start":
    "Every JSON object must start with {. The FSM blocks all other tokens until the model produces an opening brace.",
  "expect-key-or-end":
    "The object can either provide another quoted key or close with }. Other structural choices are masked out.",
  "in-key":
    "The model is writing a key. It may add key characters or close the key with a quote.",
  "expect-colon":
    "JSON requires a colon between every key and its value. Only : is allowed here.",
  "expect-value":
    "The next token must begin a valid JSON value: a string, number, boolean, or nested object.",
  "in-string":
    "The model is writing a string value token by token. Structural tokens are blocked until the string closes.",
  "in-number":
    "The model is writing a number. Digits can continue the value, then a comma or } can end it.",
  "in-boolean":
    "The model is writing a boolean. Only characters that can continue true or false are allowed.",
  "expect-nested":
    "This value must open a nested object. The FSM lets { through and masks everything else.",
  "expect-comma-or-end":
    "The field is complete. The FSM allows either a comma for another field or } to close the object.",
  complete: "The constrained output is complete and parses as valid JSON.",
}

export function buildFsmTrace(example: FsmExample): FsmTraceStep[] {
  const steps: FsmTraceStep[] = []

  for (let index = 0; index < example.constrainedOutput.length; index += 1) {
    const prefix = example.constrainedOutput.slice(0, index)
    const character = example.constrainedOutput[index] ?? ""
    const state = stateBeforeCharacter(prefix, character)
    const rawCandidates = buildCandidateSet(character, state, index)
    const constrainedOutput = example.constrainedOutput.slice(0, index + 1)
    const unconstrainedOutput = example.unconstrainedOutput.slice(
      0,
      Math.min(example.unconstrainedOutput.length, index + 1),
    )

    steps.push({
      index,
      state,
      character,
      explanation: stateCopy[state],
      constrainedOutput,
      unconstrainedOutput,
      rawCandidates,
      maskedCandidates: applyFsmMask(rawCandidates, state),
      requiredFields: getRequiredFieldStatus(constrainedOutput, example.requiredFields),
      constrainedValid: isValidJson(constrainedOutput),
      unconstrainedValid: isValidJson(unconstrainedOutput),
    })
  }

  return steps
}

export function applyFsmMask(
  candidates: FsmCandidate[],
  state: FsmStateId,
): MaskedCandidate[] {
  const withAllowed = candidates.map((candidate) => ({
    ...candidate,
    allowed: isTokenAllowed(state, candidate.token),
    maskedProbability: 0,
  }))
  const allowedTotal = withAllowed.reduce(
    (sum, candidate) => sum + (candidate.allowed ? candidate.probability : 0),
    0,
  )

  return withAllowed.map((candidate) => ({
    ...candidate,
    maskedProbability:
      candidate.allowed && allowedTotal > 0
        ? candidate.probability / allowedTotal
        : 0,
  }))
}

export function isTokenAllowed(state: FsmStateId, token: string) {
  if (!token) return false
  const first = token[0] ?? ""

  switch (state) {
    case "expect-start":
    case "expect-nested":
      return first === "{"
    case "expect-key-or-end":
      return first === "\"" || first === "}"
    case "in-key":
      return first === "\"" || /[a-zA-Z0-9_-]/.test(first)
    case "expect-colon":
      return first === ":"
    case "expect-value":
      return (
        first === "\"" ||
        first === "{" ||
        first === "-" ||
        /[0-9tf]/.test(first)
      )
    case "in-string":
      return first === "\"" || /[a-zA-Z0-9_ .-]/.test(first)
    case "in-number":
      return /[0-9.]/.test(first) || first === "," || first === "}"
    case "in-boolean":
      return /[truefals]/.test(first)
    case "expect-comma-or-end":
      return first === "," || first === "}"
    case "complete":
      return false
  }
}

export function getRequiredFieldStatus(
  jsonPrefix: string,
  fields: string[],
): RequiredFieldStatus[] {
  return fields.map((field) => ({
    field,
    complete: new RegExp(`"${escapeRegExp(field)}"\\s*:`).test(jsonPrefix),
  }))
}

export function isValidJson(value: string) {
  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
}

export function stateLabel(state: FsmStateId) {
  const labels: Record<FsmStateId, string> = {
    "expect-start": "Expect {",
    "expect-key-or-end": "Expect \" or }",
    "in-key": "In Key",
    "expect-colon": "Expect :",
    "expect-value": "Expect Value",
    "in-string": "In String",
    "in-number": "In Number",
    "in-boolean": "In Boolean",
    "expect-nested": "Expect Nested {",
    "expect-comma-or-end": "Expect , or }",
    complete: "Complete",
  }

  return labels[state]
}

function stateBeforeCharacter(prefix: string, character: string): FsmStateId {
  if (!prefix) return "expect-start"
  if (character === "{" && previousMeaningful(prefix) === ":") return "expect-nested"
  if (character === "t" || character === "f") return "in-boolean"

  const mode = scanMode(prefix)
  if (mode === "expect-value" && /[0-9-]/.test(character)) return "in-number"
  return mode
}

function scanMode(value: string): FsmStateId {
  let mode: FsmStateId = "expect-start"
  const stack: Array<"object"> = []
  let stringRole: "key" | "value" | null = null

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index]

    if (mode === "in-key" || mode === "in-string") {
      if (char === "\"") {
        mode = stringRole === "key" ? "expect-colon" : "expect-comma-or-end"
        stringRole = null
      }
      continue
    }

    if (mode === "in-number") {
      if (/[0-9.]/.test(char)) continue
      if (char === "," || char === "}") {
        mode = "expect-comma-or-end"
        index -= 1
      }
      continue
    }

    if (/\s/.test(char)) continue

    switch (mode) {
      case "expect-start":
        if (char === "{") {
          stack.push("object")
          mode = "expect-key-or-end"
        }
        break
      case "expect-key-or-end":
        if (char === "\"") {
          stringRole = "key"
          mode = "in-key"
        } else if (char === "}") {
          stack.pop()
          mode = stack.length ? "expect-comma-or-end" : "complete"
        }
        break
      case "expect-colon":
        if (char === ":") mode = "expect-value"
        break
      case "expect-value":
        if (char === "\"") {
          stringRole = "value"
          mode = "in-string"
        } else if (char === "{") {
          stack.push("object")
          mode = "expect-key-or-end"
        } else if (/[0-9-]/.test(char)) {
          mode = "in-number"
        } else if (char === "t" || char === "f") {
          mode = "in-boolean"
        }
        break
      case "in-boolean":
        if (char === "," || char === "}") {
          mode = "expect-comma-or-end"
          index -= 1
        }
        break
      case "expect-comma-or-end":
        if (char === ",") {
          mode = "expect-key-or-end"
        } else if (char === "}") {
          stack.pop()
          mode = stack.length ? "expect-comma-or-end" : "complete"
        }
        break
      case "complete":
        break
    }
  }

  return mode
}

function buildCandidateSet(
  character: string,
  state: FsmStateId,
  index: number,
): FsmCandidate[] {
  const distractors = candidateDistractors(state, index)
  return normalizeCandidates([
    { token: character, probability: 0.62 },
    ...distractors,
  ])
}

function candidateDistractors(state: FsmStateId, index: number): FsmCandidate[] {
  const variants: Record<FsmStateId, string[]> = {
    "expect-start": ["```python", "\"", "calculate", "["],
    "expect-key-or-end": ["calculate", ":", "{", ","],
    "in-key": ["arguments", "_", ":", ","],
    "expect-colon": ["calculate", "\"", ",", "{"],
    "expect-value": ["calculate", ",", "}", ":"],
    "in-string": [":", ",", "}", "triangle"],
    "in-number": ["height", "\"", "{", ":"],
    "in-boolean": ["maybe", "1", "\"", "{"],
    "expect-nested": ["calculate", "\"", ":", "["],
    "expect-comma-or-end": ["calculate", "\"", ":", "base"],
    complete: ["calculate", "\"", ":", "{"],
  }
  const base = variants[state]
  const rotated = base.slice(index % base.length).concat(base.slice(0, index % base.length))

  return rotated.slice(0, 4).map((token, distractorIndex) => ({
    token,
    probability: [0.25, 0.08, 0.035, 0.015][distractorIndex] ?? 0.01,
  }))
}

function normalizeCandidates(candidates: FsmCandidate[]) {
  const deduped = new Map<string, FsmCandidate>()
  for (const candidate of candidates) {
    const existing = deduped.get(candidate.token)
    deduped.set(candidate.token, {
      token: candidate.token,
      probability: (existing?.probability ?? 0) + candidate.probability,
    })
  }

  const total = [...deduped.values()].reduce(
    (sum, candidate) => sum + candidate.probability,
    0,
  )

  return [...deduped.values()].map((candidate) => ({
    ...candidate,
    probability: total > 0 ? candidate.probability / total : 0,
  }))
}

function previousMeaningful(value: string) {
  for (let index = value.length - 1; index >= 0; index -= 1) {
    const char = value[index]
    if (!/\s/.test(char)) return char
  }
  return ""
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
