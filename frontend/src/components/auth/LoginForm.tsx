import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

export const LoginForm: React.FC = () => {
  const { login, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Introduce un correo electrónico válido';
    }

    if (!password) {
      errors.password = 'La contraseña es requerida';
    } else if (password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clearError) clearError();
    if (!validate()) return;

    try {
      await login({ email, password });
    } catch {
      // Handled in auth context / error state
    }
  };

  const handleFillDemo = () => {
    setEmail('usuario@sila.app');
    setPassword('password123');
    setFieldErrors({});
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && (
        <div className="auth-error-alert" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <Input
        label="Correo electrónico"
        type="email"
        placeholder="ejemplo@sila.app"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
        icon={<Mail size={18} />}
        autoComplete="email"
        required
      />

      <Input
        label="Contraseña"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
        icon={<Lock size={18} />}
        autoComplete="current-password"
        required
      />

      <Button
        type="submit"
        variant="primary"
        style={{ width: '100%', marginTop: '0.5rem' }}
        isLoading={isLoading}
        icon={<ArrowRight size={18} />}
      >
        Iniciar Sesión
      </Button>

      <div className="demo-credentials-box">
        <p><strong>💡 Acceso de prueba:</strong></p>
        <p>Email: <code>usuario@sila.app</code> | Clave: <code>password123</code></p>
        <Button
          type="button"
          variant="outline"
          onClick={handleFillDemo}
          style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
        >
          Rellenar credenciales de prueba
        </Button>
      </div>
    </form>
  );
};
