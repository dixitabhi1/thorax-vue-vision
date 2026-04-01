import { useAuth } from "@/contexts/AuthContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, LogOut, User } from "lucide-react";

const ROLE_LABELS = {
  ADMIN: "Admin",
  DECTROCEL: "Dectrocel",
  RADIOLOGY: "Radiology",
  PULMONARY: "Pulmonary",
} as const;

export function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b bg-card flex items-center justify-between px-4 py-3 shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <div className="h-6 w-px bg-border" />
        <div>
          <h1 className="font-heading text-sm md:text-base font-semibold tracking-tight text-foreground">
            SGPGIMS Study Dashboard
          </h1>
          <p className="hidden md:block text-xs text-muted-foreground">
            Live workflow linked to the SGPGIMS Study Dashboard API
          </p>
        </div>
      </div>
      {user && (
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="hidden md:inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.24em]">
            <Activity className="h-3 w-3 text-emerald-500" />
            Live
          </Badge>
          <div className="hidden sm:flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{user.name}</span>
            <Badge variant="secondary" className="text-xs font-medium">
              {ROLE_LABELS[user.role]}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} title="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      )}
    </header>
  );
}
