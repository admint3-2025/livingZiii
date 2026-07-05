import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { OrganizationsPage } from '@/pages/OrganizationsPage';
import { PropertiesPage } from '@/pages/PropertiesPage';
import { UnitsPage } from '@/pages/UnitsPage';
import { QuotasPage } from '@/pages/QuotasPage';
import { PaymentsPage } from '@/pages/PaymentsPage';
import { AccessControlPage } from '@/pages/AccessControlPage';
import { AccessControlSharePage } from '@/pages/AccessControlSharePage';
import { AccessControlEmailPreviewPage } from '@/pages/AccessControlEmailPreviewPage';
import { AccessControlPrintPage } from '@/pages/AccessControlPrintPage';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';
import '@/styles/global.css';

export const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizations"
          element={
            <ProtectedRoute>
              <OrganizationsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/properties"
          element={
            <ProtectedRoute>
              <PropertiesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/units"
          element={
            <ProtectedRoute>
              <UnitsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/quotas"
          element={
            <ProtectedRoute>
              <QuotasPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <PaymentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/access-control"
          element={
            <ProtectedRoute>
              <AccessControlPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/access-control/share/:id"
          element={<AccessControlSharePage />}
        />
        <Route
          path="/access-control/share/:id/email"
          element={<AccessControlEmailPreviewPage />}
        />
        <Route
          path="/access-control/share/:id/print"
          element={<AccessControlPrintPage />}
        />

        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
