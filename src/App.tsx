import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
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
import DeletionRequests from './pages/DeletionRequests';
import NotFound from './pages/NotFound';
import CommandPalette from './components/CommandPalette';

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
          <ToastProvider>
            {/* Command Palette - OUTSIDE Routes */}
            <CommandPalette />
            
            <Routes>
              {/* Login Route */}
              <Route path="/login" element={<Login />} />

              {/* All Routes - No Auth */}
              <Route path="/" element={<CompactLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="members" element={<MemberList />} />
                <Route path="members/new" element={<AddMember />} />
                <Route path="members/:id" element={<MemberDetail />} />
                <Route path="payments" element={<Payments />} />
                <Route path="reports" element={<Reports />} />
                <Route path="deceased" element={<DeceasedMembers />} />
                <Route path="deceased/:id" element={<DeceasedDetail />} />
                <Route path="deceased/record/:memberId?" element={<RecordDeath />} />
                <Route path="deletion-requests" element={<DeletionRequests />} />
                <Route path="registration-success" element={<RegistrationSuccess />} />
              </Route>

              {/* 404 Not Found */}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ToastProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;