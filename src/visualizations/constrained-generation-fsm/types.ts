export type FsmStateId =
  | "expect-start"
  | "expect-key-or-end"
  | "in-key"
  | "expect-colon"
  | "expect-value"
  | "in-string"
  | "in-number"
  | "in-boolean"
  | "expect-nested"
  | "expect-comma-or-end"
  | "complete"

export type FsmCandidate = {
  token: string
  probability: number
}

export type MaskedCandidate = FsmCandidate & {
  allowed: boolean
  maskedProbability: number
}

export type RequiredFieldStatus = {
  field: string
  complete: boolean
}

export type FsmTraceStep = {
  index: number
  state: FsmStateId
  character: string
  explanation: string
  constrainedOutput: string
  unconstrainedOutput: string
  rawCandidates: FsmCandidate[]
  maskedCandidates: MaskedCandidate[]
  requiredFields: RequiredFieldStatus[]
  constrainedValid: boolean
  unconstrainedValid: boolean
}

export type FsmExample = {
  id: string
  label: string
  prompt: string
  schema: unknown
  constrainedOutput: string
  unconstrainedOutput: string
  requiredFields: string[]
}
