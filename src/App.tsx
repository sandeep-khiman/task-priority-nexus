
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { TaskProvider } from '@/contexts/TaskContext';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Pages
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import AdminSettings from '@/pages/AdminSettings';
import ManagerDashboard from '@/pages/ManagerDashboard';
import UserProfile from '@/pages/UserProfile';
import Teams from '@/pages/Teams';
import NotFound from '@/pages/NotFound';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <TaskProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={<AdminSettings />} />
              <Route path="/manager" element={<ManagerDashboard />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/profile/:userId" element={<UserProfile />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </TaskProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
