import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Tables from "./pages/Tables";
import Orders from "./pages/Orders";
import Kitchen from "./pages/Kitchen";
import Menu from "./pages/Menu";
import Reservations from "./pages/Reservations";
import Customers from "./pages/Customers";
import Delivery from "./pages/Delivery";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout><Dashboard /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/pos" element={
              <ProtectedRoute allowedRoles={['owner', 'manager', 'waiter', 'cashier']}>
                <AppLayout><POS /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/tables" element={
              <ProtectedRoute allowedRoles={['owner', 'manager', 'waiter']}>
                <AppLayout><Tables /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute>
                <AppLayout><Orders /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/kitchen" element={
              <ProtectedRoute allowedRoles={['owner', 'manager', 'kitchen']}>
                <AppLayout><Kitchen /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/menu" element={
              <ProtectedRoute allowedRoles={['owner', 'manager']}>
                <AppLayout><Menu /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/reservations" element={
              <ProtectedRoute allowedRoles={['owner', 'manager', 'waiter']}>
                <AppLayout><Reservations /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/customers" element={
              <ProtectedRoute allowedRoles={['owner', 'manager']}>
                <AppLayout><Customers /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/delivery" element={
              <ProtectedRoute allowedRoles={['owner', 'manager', 'delivery']}>
                <AppLayout><Delivery /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={['owner', 'manager']}>
                <AppLayout><Reports /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={['owner', 'manager']}>
                <AppLayout><Settings /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
