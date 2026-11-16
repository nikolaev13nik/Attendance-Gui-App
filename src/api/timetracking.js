import { request } from "./http.js";
import { localTimestamp, localWorkDate } from "./time.js";

const SESSION_MESSAGES = {
  400: "api.sessionDate",
  403: "api.sessionForbidden",
  409: "api.userBusy",
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
    messages: { 400: "api.checkDates" },
  });
}

export function checkIncomplete({ tenantId, idUser, startDate, endDate, token }) {
  const query = new URLSearchParams({ startDate, endDate });
  return request(
    `/attendance/check/tenant/${encodeURIComponent(tenantId)}/user/${encodeURIComponent(idUser)}?${query}`,
    { token, messages: { 400: "api.checkDates" } },
  );
}

export function changeSession({ tenantId, idUser, id, openSessionDate, closeSessionDate, token }) {
  return request(`/attendance/sessionChange/tenant/${encodeURIComponent(tenantId)}`, {
    method: "POST",
    token,
    body: { id, idUser, openSessionDate, closeSessionDate },
    messages: { 404: "api.sessionGone", 409: "api.userBusy" },
  });
}

export function removeSession({ tenantId, idUser, id, token }) {
  return request(
    `/attendance/sessionRemove/tenant/${encodeURIComponent(tenantId)}/userId/${encodeURIComponent(idUser)}/session/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      token,
      messages: { 404: "api.sessionGone", 409: "api.userBusy" },
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
      messages: { 409: "api.userBusy" },
    },
  );
}

export function getLeaveDays({ tenantId, idUser, startDate, endDate, token }) {
  const query = new URLSearchParams({ startDate, endDate });
  return request(
    `/attendance/leaveDays/tenant/${encodeURIComponent(tenantId)}/userId/${encodeURIComponent(idUser)}?${query}`,
    { token, messages: { 400: "api.checkDates" } },
  );
}

export function changeLeaveDay({ tenantId, idUser, id, date, vacationAmount, sickAmount, token }) {
  return request(`/attendance/leaveDayChange/tenant/${encodeURIComponent(tenantId)}`, {
    method: "POST",
    token,
    body: { id, idUser, date, vacationAmount, sickAmount },
    messages: { 404: "api.leaveGone", 409: "api.userBusy" },
  });
}

export function removeLeaveDay({ tenantId, idUser, id, token }) {
  return request(
    `/attendance/leaveDayRemove/tenant/${encodeURIComponent(tenantId)}/userId/${encodeURIComponent(idUser)}/leaveDay/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      token,
      messages: { 404: "api.leaveGone", 409: "api.userBusy" },
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
      403: "api.statisticsForbidden",
    },
  });
}
