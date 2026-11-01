import { request } from "./http.js";

function tenantPath(tenantId) {
  return `/account/tenant/${encodeURIComponent(tenantId)}`;
}

export function addTenant({ companyName, contactName, phone, email }) {
  return request("/account/tenant/add", {
    method: "POST",
    body: { companyName, contactName, phone, email },
    messages: {
      409: "api.tenantExists",
    },
  });
}

export function registerUser({ tenantId, token, idUser, password, email, firstName, lastName }) {
  return request(`${tenantPath(tenantId)}/user`, {
    method: "POST",
    token,
    body: { idUser, password, email, firstName, lastName },
    messages: {
      401: "api.registerClosed",
      403: "api.registerForbidden",
      409: "api.userExists",
    },
  });
}

export function login({ idUser, password, tenantId, companyName }) {
  return request("/account/login", {
    method: "POST",
    body: { idUser, password, tenantId, companyName },
    messages: {
      401: "api.loginFailed",
    },
  });
}


export function listUsers({ tenantId, token }) {
  return request(`${tenantPath(tenantId)}/users`, { token });
}

export function editUser({ tenantId, idUser, token, firstName, lastName, email, password }) {
  return request(`${tenantPath(tenantId)}/user/password/${encodeURIComponent(idUser)}`, {
    method: "PUT",
    token,
    body: { firstName, lastName, email, password },
    messages: {
      403: "api.editForbidden",
      404: "api.userNotFound",
    },
  });
}

export function deleteUser({ tenantId, idUser, token }) {
  return request(`${tenantPath(tenantId)}/user/${encodeURIComponent(idUser)}`, {
    method: "DELETE",
    token,
  });
}

export function addRole({ tenantId, idUser, role, token }) {
  return request(`${tenantPath(tenantId)}/user/${encodeURIComponent(idUser)}/role/${encodeURIComponent(role)}`, {
    method: "POST",
    token,
  });
}

export function removeRole({ tenantId, idUser, role, token }) {
  return request(`${tenantPath(tenantId)}/user/${encodeURIComponent(idUser)}/role/${encodeURIComponent(role)}`, {
    method: "DELETE",
    token,
  });
}
