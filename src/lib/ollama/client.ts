import type {
  HealthStatus,
  NextTokenRequest,
  NextTokenResponse,
} from "./types"

export async function getHealth(): Promise<HealthStatus> {
  const response = await fetch("/api/health")
  if (!response.ok) {
    throw new Error(`Health check failed with ${response.status}`)
  }
  return response.json()
}

export async function getNextToken(
  payload: NextTokenRequest,
): Promise<NextTokenResponse> {
  const response = await fetch("/api/next-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Next-token request failed with ${response.status}`)
  }

  return response.json()
}
