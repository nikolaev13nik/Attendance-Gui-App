import { request } from "./http.js";

export function addTenant({ companyName, contactName, phone, email }) {
  return request("/account/tenant/add", {
    method: "POST",
    body: { companyName, contactName, phone, email },
    messages: {
      409: "api.tenantExists",
    },
  });
}

export function registerUser({ idUser, password, email, tenantId, firstName, lastName }) {
  return request("/account/user", {
    method: "POST",
    body: { idUser, password, email, tenantId, firstName, lastName },
    messages: {
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
  return request(`/account/users?tenantId=${encodeURIComponent(tenantId)}`, { token });
}

export function editUser({ idUser, token, firstName, lastName, email, password }) {
  return request(`/account/user/password/${encodeURIComponent(idUser)}`, {
    method: "PUT",
    token,
    body: { firstName, lastName, email, password },
    messages: {
      403: "api.editForbidden",
      500: "api.userNotFound",
    },
  });
}

export function deleteUser({ idUser, token }) {
  return request(`/account/user/${encodeURIComponent(idUser)}`, {
    method: "DELETE",
    token,
  });
}

export function addRole({ idUser, role, token }) {
  return request(`/account/user/${encodeURIComponent(idUser)}/role/${encodeURIComponent(role)}`, {
    method: "POST",
    token,
  });
}

export function removeRole({ idUser, role, token }) {
  return request(`/account/user/${encodeURIComponent(idUser)}/role/${encodeURIComponent(role)}`, {
    method: "DELETE",
    token,
  });
}
