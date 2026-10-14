import { request } from "./http.js";

export function addTenant({ companyName, contactName, phone, email }) {
  return request("/account/tenant/add", {
    method: "POST",
    body: { companyName, contactName, phone, email },
    messages: {
      409: "An organization with that name is already registered. Sign in instead, or pick another name.",
    },
  });
}

export function registerUser({ idUser, password, email, tenantId, firstName, lastName }) {
  return request("/account/user", {
    method: "POST",
    body: { idUser, password, email, tenantId, firstName, lastName },
    messages: {
      409: "A user with that ID already exists.",
    },
  });
}

export function login({ idUser, password, tenantId, companyName }) {
  return request("/account/login", {
    method: "POST",
    body: { idUser, password, tenantId, companyName },
    messages: {
      401: "Those details did not match. Check the organization, user ID and password.",
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
      403: "You can only edit your own profile unless you are an administrator.",
      500: "That user could not be found.",
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
