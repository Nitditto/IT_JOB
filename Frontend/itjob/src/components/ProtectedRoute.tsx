import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // 1. While the auth status is being checked, show a loading message.
  // This prevents the user from being immediately redirected before verification is complete.
  if (isLoading) {
    return <div>Loading...</div>; // Or a more stylish spinner component
  }

  // 2. If verification is done and the user is authenticated,
  // render the child component (e.g., the /company/profile page).
  // The <Outlet /> component does this for you.
  if (isAuthenticated) {
    return <Outlet />;
  }

  // 3. If verification is done and the user is NOT authenticated,
  // redirect them to the homepage. The <Navigate> component handles this cleanly
  // without a full page reload.
  return <Navigate to="/" replace />;
};

export default ProtectedRoute;