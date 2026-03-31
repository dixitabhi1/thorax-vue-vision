import { useAuth } from "@/contexts/AuthContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, User } from "lucide-react";

export function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <div className="h-6 w-px bg-border" />
        <h1 className="font-heading text-sm md:text-base font-semibold tracking-tight text-foreground">
          NCG CT Thorax Study Dectrocel SGPGIMS
        </h1>
      </div>
      {user && (
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{user.name}</span>
            <Badge variant="secondary" className="text-xs font-medium">
              {user.role}
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
