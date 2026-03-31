import React, { createContext, useContext, useState, useCallback } from "react";

export type UserRole = "ADMIN" | "DECTROCEL" | "RADIOLOGY" | "PULMONARY";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
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

// Mock users for demo
const MOCK_USERS: Array<User & { password: string }> = [
  { id: "1", name: "Dr. Admin", email: "admin@sgpgims.ac.in", password: "admin123", role: "ADMIN" },
  { id: "2", name: "Dr. Sharma", email: "dectrocel@sgpgims.ac.in", password: "dect123", role: "DECTROCEL" },
  { id: "3", name: "Dr. Gupta", email: "radiology@sgpgims.ac.in", password: "rad123", role: "RADIOLOGY" },
  { id: "4", name: "Dr. Verma", email: "pulmonary@sgpgims.ac.in", password: "pulm123", role: "PULMONARY" },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("ncg_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email: string, password: string) => {
    // Simulate API call
    await new Promise((r) => setTimeout(r, 500));
    const found = MOCK_USERS.find((u) => u.email === email && u.password === password);
    if (!found) throw new Error("Invalid email or password");
    const { password: _, ...userData } = found;
    setUser(userData);
    localStorage.setItem("ncg_user", JSON.stringify(userData));
  }, []);

  const register = useCallback(async (name: string, email: string, _password: string, role: UserRole) => {
    await new Promise((r) => setTimeout(r, 500));
    const newUser: User = { id: crypto.randomUUID(), name, email, role };
    setUser(newUser);
    localStorage.setItem("ncg_user", JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("ncg_user");
  }, []);

  const hasPermission = useCallback(
    (action: string) => {
      if (!user) return false;
      return ROLE_PERMISSIONS[user.role]?.includes(action) ?? false;
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
