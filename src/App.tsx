import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { TaskProvider } from '@/contexts/TaskContext';
import { ReportProvider } from '@/contexts/ReportContext'; // <-- Add this
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Pages
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import AdminSettings from '@/pages/AdminSettings';
import ManagerDashboard from '@/pages/ManagerDashboard';
import UserProfile from '@/pages/UserProfile';
import Teams from '@/pages/Teams';
import NotFound from '@/pages/NotFound';
import ReportIndex from './pages/ReportIndex';
import ReportDashboard from './pages/ReportDashboard';
import EmployeeManagement from './pages/EmployeeManagement';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <TaskProvider>
            <ReportProvider> {/* ✅ Wrap routes that need reports */}
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin" element={<AdminSettings />} />
                <Route path="/manager" element={<ManagerDashboard />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/profile/:userId" element={<UserProfile />} />
                <Route path="/teams" element={<Teams />} />
                <Route path="/reportIndex" element={<ReportIndex />} />
                <Route path="/reportDashboard" element={<ReportDashboard />} />
                <Route path="/employee-management" element={<EmployeeManagement />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ReportProvider>
            <Toaster />
          </TaskProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
