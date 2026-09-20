import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  id,
  className = '',
  ...rest
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}
      <div className="input-wrapper">
        {icon && <div className="input-icon">{icon}</div>}
        <input
          id={inputId}
          className={`input-field ${icon ? 'has-icon' : ''} ${className}`}
          {...rest}
        />
      </div>
      {error && <span className="input-error-msg">{error}</span>}
    </div>
  );
};
