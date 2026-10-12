export class ApiError extends Error {
  constructor(status, message, serverMessage, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.serverMessage = serverMessage;
    this.body = body;
  }
}

const GENERIC_MESSAGES = {
  0: "Cannot reach the server. Check that the Docker stack is running.",
  400: "The server rejected that request.",
  401: "You are not signed in, or your session has expired.",
  403: "Your role does not allow that action.",
  409: "That already exists.",
  500: "The server failed to handle that request.",
};

function serverMessageOf(payload) {
  const raw = payload && typeof payload.message === "string" ? payload.message.trim() : "";
  return raw || null;
}

function messageFor(status, serverMessage, overrides) {
  if (overrides && overrides[status]) {
    return overrides[status];
  }
  return serverMessage || GENERIC_MESSAGES[status] || `Request failed with status ${status}.`;
}

async function readBody(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
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
    throw new ApiError(0, messageFor(0, null, messages), null, null);
  }

  const payload = await readBody(response);
  if (!response.ok) {
    const serverMessage = serverMessageOf(payload);
    throw new ApiError(response.status, messageFor(response.status, serverMessage, messages), serverMessage, payload);
  }
  return payload;
}
