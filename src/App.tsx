import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import CompactLayout from './components/CompactLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MemberList from './pages/MemberList';
import MemberDetail from './pages/MemberDetail';
import AddMember from './pages/AddMember';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import DeceasedMembers from './pages/DeceasedMembers';
import DeceasedDetail from './pages/DeceasedDetail';
import RecordDeath from './pages/RecordDeath';
import RegistrationSuccess from './pages/RegistrationSuccess';
import Settings from './pages/Settings';
import DeletionRequests from './pages/DeletionRequests';
import NotFound from './pages/NotFound';
import CommandPalette from './components/CommandPalette';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes - AGGRESSIVE!
      refetchOnMount: false, // Don't refetch if data exists
      refetchOnReconnect: false, // Don't refetch on reconnect
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {/* Scroll to top on route change */}
          <ScrollToTop />
          <AuthProvider>
            <ToastProvider>
              {/* Command Palette - OUTSIDE Routes */}
              <CommandPalette />
              
              <Routes>
                {/* Public Route - Login Only */}
                <Route path="/login" element={<Login />} />

                {/* Protected Routes - Require Authentication */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <CompactLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="members" element={<MemberList />} />
                  <Route path="members/new" element={<AddMember />} />
                  <Route path="members/:id" element={<MemberDetail />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="deceased" element={<DeceasedMembers />} />
                  <Route path="deceased/:id" element={<DeceasedDetail />} />
                  <Route path="deceased/record/:memberId?" element={<RecordDeath />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="deletion-requests" element={<DeletionRequests />} />
                  <Route path="registration-success" element={<RegistrationSuccess />} />
                </Route>

                {/* 404 Not Found */}
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;