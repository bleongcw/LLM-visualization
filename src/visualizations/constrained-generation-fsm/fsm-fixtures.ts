import type { FsmExample, FsmStateId } from "./types"

export const fsmExamples: FsmExample[] = [
  {
    id: "function-call",
    label: "Function Call",
    prompt:
      "Find the area of a triangle with base 10 and height 5. Available functions:\n- calculate_triangle_area(base: number, height: number)\n- calculate_circle_area(radius: number)\n- calculate_rectangle_area(width: number, height: number)\nRespond with a JSON function call.",
    schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
        },
        arguments: {
          type: "object",
          properties: {
            base: {
              type: "number",
            },
            height: {
              type: "number",
            },
          },
          required: ["base", "height"],
        },
      },
      required: ["name", "arguments"],
    },
    constrainedOutput:
      "{\"name\":\"calculate_triangle_area\",\"arguments\":{\"base\":10,\"height\":5}}",
    unconstrainedOutput:
      "```python\ndef calculate_triangle_area(base, height):\n    return base * height / 2\n```",
    requiredFields: ["name", "arguments", "base", "height"],
  },
  {
    id: "sentiment",
    label: "Sentiment",
    prompt:
      "Classify this review as JSON: The headphones are comfortable and the sound is clear, but the case scratches easily.",
    schema: {
      type: "object",
      properties: {
        sentiment: {
          type: "string",
          enum: ["positive", "neutral", "negative"],
        },
        confidence: {
          type: "number",
        },
      },
      required: ["sentiment", "confidence"],
    },
    constrainedOutput: "{\"sentiment\":\"positive\",\"confidence\":0.74}",
    unconstrainedOutput:
      "The review is mostly positive, with a small complaint about the case.",
    requiredFields: ["sentiment", "confidence"],
  },
  {
    id: "data-extraction",
    label: "Data Extraction",
    prompt:
      "Extract JSON from this sentence: Ada Lovelace wrote notes about the Analytical Engine in 1843.",
    schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
        },
        project: {
          type: "string",
        },
        year: {
          type: "number",
        },
      },
      required: ["name", "project", "year"],
    },
    constrainedOutput:
      "{\"name\":\"Ada Lovelace\",\"project\":\"Analytical Engine\",\"year\":1843}",
    unconstrainedOutput:
      "Ada Lovelace, Analytical Engine, 1843. This is the extracted data.",
    requiredFields: ["name", "project", "year"],
  },
]

export const fsmNodes: Array<{
  id: FsmStateId
  label: string
  x: number
  y: number
}> = [
  { id: "expect-start", label: "Expect {", x: 12, y: 46 },
  { id: "expect-key-or-end", label: "Expect \" or }", x: 30, y: 30 },
  { id: "in-key", label: "In Key", x: 48, y: 30 },
  { id: "expect-colon", label: "Expect :", x: 66, y: 30 },
  { id: "expect-value", label: "Expect Value", x: 64, y: 56 },
  { id: "in-string", label: "In String", x: 84, y: 38 },
  { id: "in-number", label: "In Number", x: 84, y: 58 },
  { id: "in-boolean", label: "In Boolean", x: 84, y: 78 },
  { id: "expect-nested", label: "Expect Nested {", x: 64, y: 84 },
  { id: "expect-comma-or-end", label: "Expect , or }", x: 48, y: 58 },
  { id: "complete", label: "Complete", x: 30, y: 82 },
]

export const fsmEdges: Array<{
  from: FsmStateId
  to: FsmStateId
  label: string
}> = [
  { from: "expect-start", to: "expect-key-or-end", label: "{" },
  { from: "expect-key-or-end", to: "in-key", label: "\"" },
  { from: "expect-key-or-end", to: "complete", label: "}" },
  { from: "in-key", to: "expect-colon", label: "\"" },
  { from: "expect-colon", to: "expect-value", label: ":" },
  { from: "expect-value", to: "in-string", label: "\"" },
  { from: "expect-value", to: "in-number", label: "0-9" },
  { from: "expect-value", to: "in-boolean", label: "t/f" },
  { from: "expect-value", to: "expect-nested", label: "{" },
  { from: "expect-nested", to: "expect-key-or-end", label: "{" },
  { from: "in-string", to: "expect-comma-or-end", label: "\"" },
  { from: "in-number", to: "expect-comma-or-end", label: ", or }" },
  { from: "in-boolean", to: "expect-comma-or-end", label: ", or }" },
  { from: "expect-comma-or-end", to: "expect-key-or-end", label: "," },
  { from: "expect-comma-or-end", to: "complete", label: "}" },
]
