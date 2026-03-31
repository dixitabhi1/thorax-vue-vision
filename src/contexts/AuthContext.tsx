import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { api, clearStoredSession, loadStoredSession, saveStoredSession, UserRole } from "@/lib/api";

export interface User {
  name: string;
  username: string;
  role: UserRole;
  accessToken: string;
  tokenType: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Role permissions map
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: [
    "view:dashboard", "view:studies", "view:patients",
    "create:study", "edit:study", "delete:study",
    "create:patient", "edit:patient",
    "upload:images", "view:images",
    "edit:clinical", "edit:radiology", "edit:ai-report",
    "view:clinical", "view:radiology", "view:ai-report",
    "manage:users",
  ],
  DECTROCEL: [
    "view:dashboard", "view:studies", "view:patients",
    "create:patient", "edit:patient",
    "upload:images", "view:images",
    "edit:ai-report", "view:ai-report",
    "view:clinical", "view:radiology",
  ],
  RADIOLOGY: [
    "view:dashboard", "view:studies", "view:patients",
    "view:images",
    "edit:radiology", "view:radiology",
    "view:clinical", "view:ai-report",
  ],
  PULMONARY: [
    "view:dashboard", "view:studies", "view:patients",
    "view:images",
    "edit:clinical", "view:clinical",
    "view:radiology", "view:ai-report",
  ],
};

function toUser(session: ReturnType<typeof loadStoredSession>): User | null {
  if (!session) {
    return null;
  }

  return {
    name: session.fullName,
    username: session.username,
    role: session.role,
    accessToken: session.accessToken,
    tokenType: session.tokenType,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => toUser(loadStoredSession()));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedSession = loadStoredSession();

    if (!storedSession) {
      setIsLoading(false);
      return;
    }

    api.me()
      .then((profile) => {
        const nextUser: User = {
          name: profile.fullName || storedSession.fullName,
          username: profile.username || storedSession.username,
          role: profile.role || storedSession.role,
          accessToken: storedSession.accessToken,
          tokenType: storedSession.tokenType,
        };
        setUser(nextUser);
        saveStoredSession({
          ...storedSession,
          fullName: nextUser.name,
          username: nextUser.username,
          role: nextUser.role,
        });
      })
      .catch(() => {
        clearStoredSession();
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const session = await api.login(username, password);
    saveStoredSession(session);
    setUser({
      name: session.fullName,
      username: session.username,
      role: session.role,
      accessToken: session.accessToken,
      tokenType: session.tokenType,
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    clearStoredSession();
  }, []);

  const hasPermission = useCallback(
    (action: string) => {
      if (!user) return false;
      return ROLE_PERMISSIONS[user.role]?.includes(action) ?? false;
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
