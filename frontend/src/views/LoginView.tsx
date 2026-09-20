import React from 'react';
import { Wallet } from 'lucide-react';
import { LoginForm } from '../components/auth/LoginForm';

export const LoginView: React.FC = () => {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <Wallet size={28} />
          </div>
          <h1 className="auth-title">Bienvenido a Sila</h1>
          <p className="auth-subtitle">Ingresa a tu cuenta para gestionar tus finanzas</p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
};
