
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { TaskProvider } from "./contexts/TaskContext";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import AdminSettings from "./pages/AdminSettings";
import ManagerDashboard from "./pages/ManagerDashboard";
import NotFound from "./pages/NotFound";
import { useAuth } from "./contexts/AuthContext";
import { UserRole } from "./types/user";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ 
  requiredRole 
}: { 
  requiredRole?: UserRole | UserRole[] 
}) => {
  const { isAuthenticated, profile, isLoading } = useAuth();

  // If still loading auth state, show nothing
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If role is required but user doesn't have it
  if (requiredRole && profile) {
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!requiredRoles.includes(profile.role)) {
      // Redirect based on role
      switch (profile.role) {
        case 'admin':
          return <Navigate to="/admin" />;
        case 'manager':
          return <Navigate to="/manager" />;
        default:
          return <Navigate to="/" />;
      }
    }
  }

  return <Outlet />;
};

// Routes that are only accessible when NOT authenticated
const PublicOnlyRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  return <Outlet />;
};

// App with AuthProvider wrapper
const AppWithAuth = () => (
  <BrowserRouter>
    <AuthProvider>
      <TaskProvider>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>
          
          {/* Protected routes for all authenticated users */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
          </Route>
          
          {/* Admin routes */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/admin" element={<AdminSettings />} />
          </Route>
          
          {/* Manager routes */}
          <Route element={<ProtectedRoute requiredRole={['manager', 'admin']} />}>
            <Route path="/manager" element={<ManagerDashboard />} />
          </Route>
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TaskProvider>
    </AuthProvider>
  </BrowserRouter>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppWithAuth />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
