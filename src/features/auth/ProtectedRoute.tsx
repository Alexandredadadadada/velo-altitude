/**
 * Protected Route Component
 * 
 * A wrapper for routes that require authentication
 * Redirects to login if user is not authenticated
 * Optionally checks for specific permissions or roles
 */

import React, { ComponentType, ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth0, withAuthenticationRequired } from '@auth0/auth0-react';
import { useAuth } from './authContext';
import monitoringService from '../../monitoring';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface ProtectedRouteProps {
  component: ComponentType<any>;
  requiredPermission?: string;
  requiredRole?: string;
  [key: string]: any;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  component,
  requiredPermission,
  requiredRole,
  ...rest
}) => {
  const { hasPermission, hasRole } = useAuth();
  const { isAuthenticated, user } = useAuth0();
  const location = useLocation();
  
  // First wrap the component with Auth0's withAuthenticationRequired HOC
  const Component = withAuthenticationRequired(component, {
    onRedirecting: () => <LoadingSpinner fullPage message="Authenticating..." />
  });
  
  // Check additional permissions and roles
  if (isAuthenticated && user) {
    // Check permission if required
    if (requiredPermission && !hasPermission(requiredPermission)) {
      monitoringService.trackEvent('auth_route_access_denied', {
        path: location.pathname,
        reason: 'insufficient_permission',
        requiredPermission
      });
      
      return <Navigate to="/unauthorized" replace />;
    }
    
    // Check role if required
    if (requiredRole && !hasRole(requiredRole)) {
      monitoringService.trackEvent('auth_route_access_denied', {
        path: location.pathname,
        reason: 'insufficient_role',
        requiredRole
      });
      
      return <Navigate to="/unauthorized" replace />;
    }
  }
  
  // All checks passed, render the protected component
  return <Component {...rest} />;
};

export default ProtectedRoute;
