import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, ApiError } from "./api";
import { clearSession, loadSession, saveSession } from "./authStorage";
import { decodeJwt } from "./jwt";

const AuthContext = createContext(null);

const ACCOUNT_ROLES = new Set(["user", "admin"]);

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null);
  const [pendingIdentity, setPendingIdentity] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");
  const [loginNotice, setLoginNotice] = useState("");
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const stored = await loadSession();
        if (!active || !stored?.token) return;

        const claims = decodeJwt(stored.token);
        if (!claims?.userId || !ACCOUNT_ROLES.has(claims.role)) {
          await clearSession();
          return;
        }

        setSession({
          token: stored.token,
          userId: claims.userId,
          role: claims.role,
          mustResetPassword: Boolean(stored.mustResetPassword),
        });
      } catch {
        await clearSession().catch(() => {});
      } finally {
        if (active) setReady(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const signOut = useCallback(async () => {
    setSession(null);
    setProfile(null);
    setProfileError("");
    setPendingIdentity("");
    setPendingPassword("");
    await clearSession();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.token || !session.userId || session.mustResetPassword) {
      return null;
    }

    setProfileLoading(true);
    try {
      const data = await api.get(`/users/${session.userId}`, session.token);
      setProfile(data);
      setProfileError("");
      return data;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await signOut();
      }
      setProfileError(error.message || "Could not load your account.");
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, [session, signOut]);

  const signIn = useCallback(async (emailOrPhone, password) => {
    await api.post("/users/login", { emailOrPhone, password });
    setPendingIdentity(emailOrPhone.trim());
    setPendingPassword(password);
    setLoginNotice("");
  }, []);

  const resendOtp = useCallback(async () => {
    if (!pendingIdentity || !pendingPassword) {
      throw new Error("Sign in again to resend the code.");
    }
    await api.post("/users/login", {
      emailOrPhone: pendingIdentity,
      password: pendingPassword,
    });
  }, [pendingIdentity, pendingPassword]);

  const confirmOtp = useCallback(
    async (otp) => {
      const data = await api.post("/users/confirm-login", {
        emailOrPhone: pendingIdentity,
        otp,
      });
      const claims = decodeJwt(data.token);
      if (!claims?.userId || !ACCOUNT_ROLES.has(claims.role)) {
        throw new Error("Could not read the sign-in session. Try again.");
      }

      const next = {
        token: data.token,
        userId: claims.userId,
        role: claims.role,
        mustResetPassword: Boolean(data.firstTimeLogin),
      };
      await saveSession({
        token: next.token,
        mustResetPassword: next.mustResetPassword,
      });
      setPendingPassword("");
      setSession(next);
    },
    [pendingIdentity]
  );

  const completePasswordReset = useCallback(async () => {
    setLoginNotice("Password saved. Sign in again.");
    await signOut();
  }, [signOut]);

  const announce = useCallback((message) => {
    setLoginNotice(message);
  }, []);

  const clearLoginNotice = useCallback(() => setLoginNotice(""), []);

  const value = useMemo(
    () => ({
      ready,
      session,
      pendingIdentity,
      loginNotice,
      profile,
      profileLoading,
      profileError,
      refreshProfile,
      signIn,
      resendOtp,
      confirmOtp,
      signOut,
      completePasswordReset,
      announce,
      clearLoginNotice,
    }),
    [
      ready,
      session,
      pendingIdentity,
      loginNotice,
      profile,
      profileLoading,
      profileError,
      refreshProfile,
      signIn,
      resendOtp,
      confirmOtp,
      signOut,
      completePasswordReset,
      announce,
      clearLoginNotice,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
