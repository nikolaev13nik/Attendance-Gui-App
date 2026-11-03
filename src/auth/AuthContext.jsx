import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { login as loginRequest } from "../api/accounting.js";
import { workingTenantId } from "./roles.js";

const STORAGE_KEY = "attendance.auth";
const ACTING_TENANT_KEY = "attendance.actingTenant";

const AuthContext = createContext(null);

function readStored() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.token || !parsed.expiresAt) {
      return null;
    }
    if (parsed.expiresAt <= Date.now()) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(session) {
  try {
    if (session) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
  }
}

function readActingTenant() {
  try {
    const raw = sessionStorage.getItem(ACTING_TENANT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeActingTenant(actingTenant) {
  try {
    if (actingTenant) {
      sessionStorage.setItem(ACTING_TENANT_KEY, JSON.stringify(actingTenant));
    } else {
      sessionStorage.removeItem(ACTING_TENANT_KEY);
    }
  } catch {
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStored);
  const [actingTenant, setActingTenant] = useState(() => (readStored() ? readActingTenant() : null));

  const chooseTenant = useCallback((tenant) => {
    const next = tenant ? { tenantId: tenant.tenantId, companyName: tenant.companyName } : null;
    writeActingTenant(next);
    setActingTenant(next);
  }, []);

  const signOut = useCallback(() => {
    writeStored(null);
    writeActingTenant(null);
    setSession(null);
    setActingTenant(null);
  }, []);

  const signIn = useCallback(async ({ idUser, password, tenantId, companyName }) => {
    const response = await loginRequest({ idUser, password, tenantId, companyName });
    const next = {
      token: response.token,
      profile: response.profile,
      expiresAt: Date.now() + Number(response.expiresIn ?? 0) * 1000,
    };
    writeStored(next);
    writeActingTenant(null);
    setSession(next);
    setActingTenant(null);
    return next;
  }, []);

  useEffect(() => {
    if (!session) {
      return undefined;
    }
    const remaining = session.expiresAt - Date.now();
    if (remaining <= 0) {
      signOut();
      return undefined;
    }
    const timer = setTimeout(signOut, remaining);
    return () => clearTimeout(timer);
  }, [session, signOut]);

  const value = useMemo(
    () => ({
      token: session?.token ?? null,
      profile: session?.profile ?? null,
      isAuthenticated: Boolean(session),
      actingTenant,
      tenantId: workingTenantId(session?.profile ?? null, actingTenant),
      chooseTenant,
      signIn,
      signOut,
    }),
    [session, actingTenant, chooseTenant, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
