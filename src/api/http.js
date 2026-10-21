import { msg, translate } from "../i18n/translate.js";

export class ApiError extends Error {
  constructor(status, message, serverMessage, body, unreachable = false) {
    super(typeof message === "string" ? message : translate(message.i18nKey, message.params));
    if (typeof message !== "string") {
      this.i18nKey = message.i18nKey;
      this.params = message.params;
    }
    this.name = "ApiError";
    this.status = status;
    this.serverMessage = serverMessage;
    this.body = body;
    this.unreachable = unreachable;
  }
}

const GENERIC_MESSAGES = {
  400: "api.generic.400",
  401: "api.generic.401",
  403: "api.generic.403",
  404: "api.generic.404",
  409: "api.generic.409",
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
    throw new ApiError(0, msg("api.offline"), null, null, true);
  }

  if (response.ok) {
    return readBody(response);
  }

  const payload = await readBody(response);
  const serverMessage = serverMessageOf(payload);

  if (looksUnreachable(response.status, payload)) {
    throw new ApiError(response.status, msg("api.unreachable"), serverMessage, payload, true);
  }

  const messageKey = (messages && messages[response.status]) || null;
  const genericKey = GENERIC_MESSAGES[response.status];
  const message =
    (messageKey && msg(messageKey)) ||
    serverMessage ||
    (genericKey && msg(genericKey)) ||
    msg("api.unexpected", { status: response.status });

  throw new ApiError(response.status, message, serverMessage, payload, false);
}
