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

export const BG3_SIMULATOR_UNAVAILABLE_MESSAGE =
  "The simulator is currently unavailable because the server is busy. Please try again later.";

const REQUEST_TIMEOUT_MS = 20_000;

const BG3_SIMULATOR_BASE_URL =
  import.meta.env.VITE_BG3_SIMULATOR_BASE_URL?.replace(/\/+$/, "") ?? "";

function getEndpointUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${BG3_SIMULATOR_BASE_URL}${normalizedPath}`;
}

async function readResponseText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

function makeSimulatorUnavailableError(): Error {
  return new Error(BG3_SIMULATOR_UNAVAILABLE_MESSAGE);
}

function makeFetchError(error: unknown): Error {
  if (error instanceof DOMException && error.name === "AbortError") {
    return makeSimulatorUnavailableError();
  }

  if (error instanceof TypeError) {
    return makeSimulatorUnavailableError();
  }

  return makeSimulatorUnavailableError();
}

async function postJson<TRequest extends object, TResponse = unknown>(
  path: string,
  payload: TRequest
): Promise<TResponse> {
  const url = getEndpointUrl(path);
  const controller = new AbortController();

  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    throw makeFetchError(error);
  } finally {
    window.clearTimeout(timeoutId);
  }

  const responseText = await readResponseText(response);

  if (!response.ok) {
    throw makeSimulatorUnavailableError();
  }

  if (!responseText.trim()) {
    throw makeSimulatorUnavailableError();
  }

  try {
    return JSON.parse(responseText) as TResponse;
  } catch {
    throw makeSimulatorUnavailableError();
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