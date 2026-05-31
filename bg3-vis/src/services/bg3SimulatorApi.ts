export type Bg3SimulatorStatus = "idle" | "loading" | "success" | "error";

export type Bg3RotationStep = {
  skill: string;
  skillID: string;
  cast_time_ms: number;
};

export type Bg3PrioritySimulationRequest = {
  build?: string;
  buildJson?: unknown;
  max_rounds: number;
  rotation: Bg3RotationStep[];
  charname: string;
  include_history: boolean;
};

export type Bg3RotationSimulationRequest = {
  build?: string;
  buildJson?: unknown;
  rotation: Bg3RotationStep[];
  charname: string;
};

export type Bg3SimulatorResponse = unknown;

const DEFAULT_BG3_SIMULATOR_BASE_URL =
  "https://gw2wingman.nevermindcreations.de";

const BG3_SIMULATOR_BASE_URL =
  import.meta.env.VITE_BG3_SIMULATOR_BASE_URL ??
  DEFAULT_BG3_SIMULATOR_BASE_URL;

const REQUEST_TIMEOUT_MS = 45_000;

function getEndpointUrl(path: string): string {
  return `${BG3_SIMULATOR_BASE_URL}${path}`;
}

function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();

  window.setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  return controller.signal;
}

async function postJson<TRequest extends object, TResponse = unknown>(
  path: string,
  payload: TRequest
): Promise<TResponse> {
  const url = getEndpointUrl(path);

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: createTimeoutSignal(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        `The BG3 simulator request timed out after ${REQUEST_TIMEOUT_MS / 1000}s.`
      );
    }

    throw new Error(
      "Could not reach the BG3 simulator API. If this is a CORS error, the simulator server needs to allow requests from the deployed study page."
    );
  }

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `BG3 simulator API request failed with ${response.status} ${
        response.statusText
      }.${responseText ? ` Response: ${responseText.slice(0, 600)}` : ""}`
    );
  }

  if (!responseText.trim()) {
    throw new Error("The BG3 simulator API returned an empty response.");
  }

  try {
    return JSON.parse(responseText) as TResponse;
  } catch {
    throw new Error(
      `The BG3 simulator API did not return valid JSON. Response: ${responseText.slice(
        0,
        600
      )}`
    );
  }
}

export async function runBg3PrioritySimulation(
  payload: Bg3PrioritySimulationRequest
): Promise<Bg3SimulatorResponse> {
  if (!payload.build && !payload.buildJson) {
    throw new Error(
      "A simulator build name or raw buildJson is required before running evaluation."
    );
  }

  return postJson<Bg3PrioritySimulationRequest, Bg3SimulatorResponse>(
    "/api/bg3/runWithPriority",
    payload
  );
}

export async function simulateBg3Rotation(
  payload: Bg3RotationSimulationRequest
): Promise<Bg3SimulatorResponse> {
  if (!payload.build && !payload.buildJson) {
    throw new Error(
      "A simulator build name or raw buildJson is required before simulating a rotation."
    );
  }

  return postJson<Bg3RotationSimulationRequest, Bg3SimulatorResponse>(
    "/api/bg3/simulateRotation",
    payload
  );
}