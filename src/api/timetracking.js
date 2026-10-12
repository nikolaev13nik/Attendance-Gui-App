import { request } from "./http.js";
import { localTimestamp, localWorkDate } from "./time.js";

const SESSION_MESSAGES = {
  400: "The server rejected that work date. It must be today, and only administrators can record earlier days.",
  403: "Your token does not allow recording a session for that user or organization.",
};

export function openSession({ tenantId, idUser, token, at = new Date() }) {
  return request(
    `/attendance/openSession/tenant/${encodeURIComponent(tenantId)}/userId/${encodeURIComponent(idUser)}`,
    {
      method: "PUT",
      token,
      body: { openSessionDate: localTimestamp(at), workDate: localWorkDate(at) },
      messages: SESSION_MESSAGES,
    },
  );
}

export function closeSession({ tenantId, idUser, token, at = new Date() }) {
  return request(
    `/attendance/closeSession/tenant/${encodeURIComponent(tenantId)}/userId/${encodeURIComponent(idUser)}`,
    {
      method: "PUT",
      token,
      body: { closeSessionDate: localTimestamp(at), workDate: localWorkDate(at) },
      messages: SESSION_MESSAGES,
    },
  );
}
