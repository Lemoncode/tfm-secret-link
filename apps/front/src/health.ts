export type HealthState = "up" | "down";

/**
 * Asks the back whether it is up. Only a 2xx `{ status: "ok" }` counts as up;
 * any other answer, a body that is not JSON, or a network error is "down".
 */
export async function checkHealth(
  fetchHealth: () => Promise<Response>,
): Promise<HealthState> {
  try {
    const response = await fetchHealth();
    if (!response.ok) return "down";
    const body: unknown = await response.json();
    return isOkBody(body) ? "up" : "down";
  } catch {
    // Network failure or unparseable body: the page only needs to say "unavailable".
    return "down";
  }
}

function isOkBody(body: unknown): boolean {
  return (
    typeof body === "object" &&
    body !== null &&
    "status" in body &&
    body.status === "ok"
  );
}
