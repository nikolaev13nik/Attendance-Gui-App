import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { login as loginRequest } from "../api/accounting.js";

const STORAGE_KEY = "attendance.auth";

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
    /* storage unavailable; the session stays in memory only */
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStored);

  const signOut = useCallback(() => {
    writeStored(null);
    setSession(null);
  }, []);

  const signIn = useCallback(async ({ idUser, password, tenantId }) => {
    const response = await loginRequest({ idUser, password, tenantId });
    const next = {
      token: response.token,
      profile: response.profile,
      expiresAt: Date.now() + Number(response.expiresIn ?? 0) * 1000,
    };
    writeStored(next);
    setSession(next);
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
      signIn,
      signOut,
    }),
    [session, signIn, signOut],
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
