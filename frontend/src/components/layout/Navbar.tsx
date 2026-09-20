import React from 'react';
import { Wallet, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../common/Button';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="navbar">
      <div className="brand-wrapper">
        <div className="brand-icon">
          <Wallet size={20} />
        </div>
        <div>
          <h1 className="brand-title">Sila</h1>
          <p className="brand-subtitle">Finanzas Personales</p>
        </div>
      </div>

      <div className="user-session-bar">
        {user && (
          <div className="user-badge" title={user.email}>
            <div className="user-avatar-circle">{userInitial}</div>
            <span>{user.name || user.email}</span>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={logout}
          icon={<LogOut size={16} />}
          title="Cerrar sesión"
        >
          Salir
        </Button>
      </div>
    </header>
  );
};
