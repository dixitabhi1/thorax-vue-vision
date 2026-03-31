import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
}

export function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (permission && !hasPermission(permission)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-heading font-semibold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
