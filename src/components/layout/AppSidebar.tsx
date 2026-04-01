import {
  LayoutDashboard,
  FileSearch,
  UserRound,
  Shield,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, permission: "view:dashboard" },
  { title: "CT Thorax Study", url: "/studies/ct-thorax", icon: FileSearch, permission: "view:studies" },
  { title: "NCG Study", url: "/studies/ncg", icon: FileSearch, permission: "view:studies" },
  { title: "Patient Records", url: "/patients", icon: UserRound, permission: "view:patients" },
];

const DEPARTMENT_LABELS = {
  ADMIN: "Administration",
  DECTROCEL: "Dectrocel",
  RADIOLOGY: "Radiodiagnosis",
  PULMONARY: "Pulmonary",
} as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { hasPermission, user } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Logo area */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-sidebar-primary shrink-0" />
            {!collapsed && (
              <div className="min-w-0">
                <p className="font-heading text-sm font-semibold text-sidebar-foreground truncate">
                  SGPGIMS Study Dashboard
                </p>
                <p className="text-[11px] text-sidebar-foreground/60 truncate">
                  Clinical operations workspace
                </p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.filter((item) => hasPermission(item.permission)).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Role info at bottom */}
        {!collapsed && user && (
          <div className="mt-auto p-4 border-t border-sidebar-border">
            <p className="text-xs text-sidebar-foreground/60">Active department</p>
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
            <p className="text-xs text-sidebar-primary">{DEPARTMENT_LABELS[user.role]}</p>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
