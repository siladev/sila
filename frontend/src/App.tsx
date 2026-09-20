import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-app)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            className="spinner"
            style={{
              borderColor: 'var(--color-slate-300)',
              borderTopColor: 'var(--color-primary-600)',
              width: 32,
              height: 32,
              margin: '0 auto 1rem',
            }}
          />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Cargando Sila...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <DashboardView /> : <LoginView />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
