import React from 'react';

export interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon?: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  iconBgColor = 'var(--color-primary-50)',
  iconColor = 'var(--color-primary-600)',
}) => {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span className="stat-label">{label}</span>
        {icon && (
          <div
            className="stat-icon-wrapper"
            style={{ backgroundColor: iconBgColor, color: iconColor }}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="stat-value">{value}</div>
      {subtext && <div className="stat-subtext">{subtext}</div>}
    </div>
  );
};
