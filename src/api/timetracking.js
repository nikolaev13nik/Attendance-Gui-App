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

export function getSessions({ tenantId, idUser, startDate, endDate, token }) {
  const query = new URLSearchParams({ startDate, endDate, idUser: String(idUser) });
  return request(`/attendance/sessions/tenant/${encodeURIComponent(tenantId)}?${query}`, {
    token,
    messages: { 400: "Check the dates and the selected employee." },
  });
}

export function checkIncomplete({ tenantId, idUser, startDate, endDate, token }) {
  const query = new URLSearchParams({ startDate, endDate });
  return request(
    `/attendance/check/tenant/${encodeURIComponent(tenantId)}/user/${encodeURIComponent(idUser)}?${query}`,
    { token, messages: { 400: "Check the dates and the selected employee." } },
  );
}

export function changeSession({ tenantId, id, openSessionDate, closeSessionDate, token }) {
  return request(`/attendance/sessionChange/tenant/${encodeURIComponent(tenantId)}`, {
    method: "POST",
    token,
    body: { id, openSessionDate, closeSessionDate },
    messages: { 404: "That session no longer exists. Reload the list." },
  });
}

export function removeSession({ tenantId, id, token }) {
  return request(
    `/attendance/sessionRemove/tenant/${encodeURIComponent(tenantId)}/session/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      token,
      messages: { 404: "That session no longer exists. Reload the list." },
    },
  );
}

export function addLeaveDays({ tenantId, idUser, days, token }) {
  return request(
    `/attendance/addLeaveDays/tenant/${encodeURIComponent(tenantId)}/userId/${encodeURIComponent(idUser)}`,
    {
      method: "POST",
      token,
      body: { days },
    },
  );
}

export function getLeaveDays({ tenantId, idUser, startDate, endDate, token }) {
  const query = new URLSearchParams({ startDate, endDate });
  return request(
    `/attendance/leaveDays/tenant/${encodeURIComponent(tenantId)}/userId/${encodeURIComponent(idUser)}?${query}`,
    { token, messages: { 400: "Check the dates and the selected employee." } },
  );
}

export function changeLeaveDay({ tenantId, id, date, vacationAmount, sickAmount, token }) {
  return request(`/attendance/leaveDayChange/tenant/${encodeURIComponent(tenantId)}`, {
    method: "POST",
    token,
    body: { id, date, vacationAmount, sickAmount },
    messages: { 404: "That leave day no longer exists. Reload the list." },
  });
}

export function removeLeaveDay({ tenantId, id, token }) {
  return request(
    `/attendance/leaveDayRemove/tenant/${encodeURIComponent(tenantId)}/leaveDay/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      token,
      messages: { 404: "That leave day no longer exists. Reload the list." },
    },
  );
}

export function getMonthStatistic({ tenantId, targetMonth, idUser, report = false, token }) {
  const query = new URLSearchParams({ targetMonth, report: String(report) });
  if (idUser !== undefined && idUser !== null && idUser !== "") {
    query.set("idUser", String(idUser));
  }
  return request(`/attendance/statistic/tenant/${encodeURIComponent(tenantId)}?${query}`, {
    method: "POST",
    token,
    messages: {
      403: "Only administrators can read employee statistics.",
    },
  });
}
