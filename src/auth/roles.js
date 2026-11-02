export const ADMINISTRATOR = "ADMINISTRATOR";
export const PLATFORM_ADMIN = "PLATFORM_ADMIN";
export const PLATFORM_TENANT_ID = 0;

export function hasRole(profile, role) {
  if (!profile || !Array.isArray(profile.roles)) {
    return false;
  }
  const wanted = role.toUpperCase();
  return profile.roles.some((entry) => typeof entry === "string" && entry.toUpperCase() === wanted);
}

export function isAdministrator(profile) {
  return hasRole(profile, ADMINISTRATOR) || hasRole(profile, PLATFORM_ADMIN);
}

export function isPlatformAdmin(profile) {
  return hasRole(profile, PLATFORM_ADMIN) && Number(profile.tenantId) === PLATFORM_TENANT_ID;
}

export function workingTenantId(profile, actingTenant) {
  if (isPlatformAdmin(profile)) {
    return actingTenant ? actingTenant.tenantId : null;
  }
  return profile ? profile.tenantId : null;
}

export function selectableUserId(users, selected) {
  if (users.length === 0 || users.some((user) => String(user.idUser) === selected)) {
    return selected;
  }
  return String(users[0].idUser);
}

export function displayName(profile) {
  if (!profile) {
    return "";
  }
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
  return name || String(profile.idUser ?? "");
}
