import { msg } from "../i18n/translate.js";
import { ApiError, request } from "./http.js";

function tenantPath(tenantId) {
  return `/account/tenant/${encodeURIComponent(tenantId)}`;
}

const CAPTCHA_REJECTED = "Captcha check failed. Reload the page and try again";
const CAPTCHA_UNAVAILABLE = "The captcha could not be verified right now. Try again in a minute";

export async function signUp({ companyName, phone, idUser, password, firstName, lastName, email, captchaToken }) {
  try {
    return await request("/account/signup", {
      method: "POST",
      body: { companyName, phone, idUser, password, firstName, lastName, email, captchaToken },
    });
  } catch (error) {
    if (error.serverMessage === CAPTCHA_REJECTED) {
      throw new ApiError(error.status, msg("api.captchaRejected"), error.serverMessage, error.body);
    }
    if (error.serverMessage === CAPTCHA_UNAVAILABLE) {
      throw new ApiError(error.status, msg("api.captchaUnavailable"), error.serverMessage, error.body);
    }
    if (error.status === 409) {
      const key = error.serverMessage === "tenant exists" ? "api.tenantExists" : "api.userExists";
      throw new ApiError(409, msg(key), error.serverMessage, error.body);
    }
    throw error;
  }
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


export function listTenants({ token, page, size }) {
  const query = new URLSearchParams({ page: String(page), size: String(size) });
  return request(`/account/tenants?${query}`, { token });
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
