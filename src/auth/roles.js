export const ADMINISTRATOR = "ADMINISTRATOR";

export function hasRole(profile, role) {
  if (!profile || !Array.isArray(profile.roles)) {
    return false;
  }
  const wanted = role.toUpperCase();
  return profile.roles.some((entry) => typeof entry === "string" && entry.toUpperCase() === wanted);
}

export function isAdministrator(profile) {
  return hasRole(profile, ADMINISTRATOR);
}

export function displayName(profile) {
  if (!profile) {
    return "";
  }
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
  return name || String(profile.idUser ?? "");
}
