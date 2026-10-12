export class ApiError extends Error {
  constructor(status, message, serverMessage, body, unreachable = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.serverMessage = serverMessage;
    this.body = body;
    this.unreachable = unreachable;
  }
}

const UNREACHABLE_MESSAGE =
  "Cannot reach the backend services. The Docker stack is probably stopped or still starting — " +
  "check it with: docker compose ps";

const OFFLINE_MESSAGE = "Cannot reach the app. The dev server may have stopped — restart it with: npm run dev";

const GENERIC_MESSAGES = {
  400: "The server rejected that request.",
  401: "You are not signed in, or your session has expired.",
  403: "Your role does not allow that action.",
  404: "That item no longer exists.",
  409: "That already exists.",
};

function serverMessageOf(payload) {
  const raw = payload && typeof payload.message === "string" ? payload.message.trim() : "";
  return raw || null;
}

function looksUnreachable(status, payload) {
  if (status === 502 || status === 503 || status === 504) {
    return true;
  }
  return status === 500 && payload === null;
}

async function readBody(response) {
  const text = await response.text();
  if (!text.trim()) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return { message: text.trim() };
  }
}

export async function request(path, options = {}) {
  const { method = "GET", body, token, messages } = options;
  const headers = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, OFFLINE_MESSAGE, null, null, true);
  }

  if (response.ok) {
    return readBody(response);
  }

  const payload = await readBody(response);
  const serverMessage = serverMessageOf(payload);

  if (looksUnreachable(response.status, payload)) {
    throw new ApiError(response.status, UNREACHABLE_MESSAGE, serverMessage, payload, true);
  }

  const message =
    (messages && messages[response.status]) ||
    serverMessage ||
    GENERIC_MESSAGES[response.status] ||
    `The server returned an unexpected status ${response.status}.`;

  throw new ApiError(response.status, message, serverMessage, payload, false);
}
