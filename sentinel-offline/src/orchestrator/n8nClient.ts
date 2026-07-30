import {N8N_ENDPOINT, type N8nStatus} from "./n8nStatus.js";

export async function n8nStatus(fetcher: typeof fetch = fetch): Promise<N8nStatus> {
  try {
    const response = await fetcher(`${N8N_ENDPOINT}/healthz`, {
      signal: AbortSignal.timeout(2_000), redirect: "error",
    });
    return {running: true, healthy: response.status === 200, endpoint: N8N_ENDPOINT};
  } catch {
    return {running: false, healthy: false, endpoint: N8N_ENDPOINT};
  }
}
