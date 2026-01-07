import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

type AppRole = 'owner' | 'manager' | 'waiter' | 'kitchen' | 'cashier' | 'delivery';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, roles, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If no roles assigned yet, allow access (new users)
  // Owners and managers have access to everything
  if (allowedRoles && allowedRoles.length > 0 && roles.length > 0) {
    const hasOwnerOrManager = roles.includes('owner') || roles.includes('manager');
    const hasRequiredRole = allowedRoles.some(role => roles.includes(role));
    
    if (!hasOwnerOrManager && !hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}
