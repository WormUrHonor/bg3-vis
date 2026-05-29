export type Bg3SimulatorRotationStep = {
  skill: string;
  skillID: string;
  cast_time_ms: number;
};

export type Bg3PrioritySimulationRequest = {
  build?: string;
  buildJson?: unknown;
  max_rounds: number;
  rotation: Bg3SimulatorRotationStep[];
  charname: string;
  include_history: boolean;
};

export type Bg3SimulatorStatus = "idle" | "loading" | "success" | "error";

/*
  Johannes' documented endpoint:

  POST /api/bg3/runWithPriority

  In development, this is reached through the Vite proxy:

  Frontend: /bg3-api/runWithPriority
  Backend:  https://gw2wingman.nevermindcreations.de/api/bg3/runWithPriority
*/
const BG3_SIMULATOR_PRIORITY_ENDPOINT = "/bg3-api/runWithPriority";

/*
  Toggle this while testing.

  true:
  Uses Johannes' uploaded backend build. This is the cleanest test because it
  avoids buildJson format problems.

  false:
  Sends the request created by the app.
*/
const USE_BACKEND_TEST_BUILD_NAME = true;

/*
  Use this only after Johannes confirms that buildJson input is supported and
  that your exported JSON has the correct structure.
*/
const USE_LOCAL_TEST_BUILD_JSON = false;

/*
  IMPORTANT:
  Files in /public are served from the root path.

  Correct local path:
  public/bg3-simulator-test/warlock-build.json

  Correct fetch URL:
  /bg3-simulator-test/warlock-build.json

  Do NOT put the file in public/public.
*/
const LOCAL_TEST_BUILD_JSON_URL = "/bg3-simulator-test/warlock-build.json";

const TEST_BACKEND_BUILD_NAME_REQUEST: Bg3PrioritySimulationRequest = {
  build: "BG3_Monk_Level12_StdEquip (gorKjan.5019)",
  max_rounds: 10,
  rotation: [],
  charname: "Player",
  include_history: true,
};

async function loadLocalBuildJson(signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(LOCAL_TEST_BUILD_JSON_URL, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  const text = await response.text();
  const trimmed = text.trim();

  if (!response.ok) {
    throw new Error(
      `Could not load local BG3 build JSON (${response.status}). Tried: ${LOCAL_TEST_BUILD_JSON_URL}. Response preview: ${text.slice(
        0,
        500
      )}`
    );
  }

  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    throw new Error(
      `Local BG3 build file is not JSON. Tried: ${LOCAL_TEST_BUILD_JSON_URL}. Response preview: ${text.slice(
        0,
        500
      )}`
    );
  }

  return JSON.parse(trimmed);
}

async function getRequestForSimulator(
  request: Bg3PrioritySimulationRequest,
  signal?: AbortSignal
): Promise<Bg3PrioritySimulationRequest> {
  if (USE_LOCAL_TEST_BUILD_JSON) {
    const buildJson = await loadLocalBuildJson(signal);

    return {
      buildJson,
      max_rounds: 10,
      rotation: [],
      charname: "Player",
      include_history: true,
    };
  }

  if (USE_BACKEND_TEST_BUILD_NAME) {
    return TEST_BACKEND_BUILD_NAME_REQUEST;
  }

  return request;
}

function parseSimulatorResponse(text: string): unknown {
  const trimmed = text.trim();

  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    throw new Error(
      `BG3 simulator returned a non-JSON response. Response preview: ${text.slice(
        0,
        700
      )}`
    );
  }

  return JSON.parse(trimmed);
}

export async function runBg3PrioritySimulation(
  request: Bg3PrioritySimulationRequest,
  signal?: AbortSignal
): Promise<unknown> {
  const simulatorRequest = await getRequestForSimulator(request, signal);

  const response = await fetch(BG3_SIMULATOR_PRIORITY_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(simulatorRequest),
    signal,
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `BG3 simulator request failed (${response.status}). Frontend endpoint: ${BG3_SIMULATOR_PRIORITY_ENDPOINT}. Expected proxied backend endpoint: /api/bg3/runWithPriority. ${text.slice(
        0,
        900
      )}`
    );
  }

  return parseSimulatorResponse(text);
}