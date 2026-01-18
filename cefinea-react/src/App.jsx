import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import vnVN from 'antd/locale/vi_VN'; // Import Vietnamese locale
import MainLayout from './layouts/MainLayout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';

// Lazy Load Pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const GenericCrudPage = React.lazy(() => import('./pages/GenericCrudPage'));
const PrintPage = React.lazy(() => import('./pages/PrintPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const CreateOrderPage = React.lazy(() => import('./pages/CreateOrderPage'));

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}><Spin size="large" /></div>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <ConfigProvider
      locale={vnVN}
      theme={{
        token: {
          fontFamily: "'Inter', sans-serif",
        },
      }}
    >
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}><Spin size="large" /></div>}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="manage/:table" element={<GenericCrudPage />} />
                <Route path="create-order" element={<CreateOrderPage />} />
              </Route>

              {/* Print route will be outside MainLayout but Protected */}
              <Route path="/print" element={<ProtectedRoute><PrintPage /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
