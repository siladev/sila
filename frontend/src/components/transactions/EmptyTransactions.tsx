import React from 'react';
import { ReceiptText, Plus } from 'lucide-react';
import { Button } from '../common/Button';

export interface EmptyTransactionsProps {
  onNewTransaction?: () => void;
}

export const EmptyTransactions: React.FC<EmptyTransactionsProps> = ({ onNewTransaction }) => {
  return (
    <div className="empty-state-container">
      <div className="empty-state-icon-box">
        <ReceiptText size={36} strokeWidth={1.75} />
      </div>
      <h3 className="empty-state-title">Aún no tienes transacciones registradas</h3>
      <p className="empty-state-description">
        Comienza a registrar tus gastos e ingresos diarios para llevar un control claro y monitorear tus presupuestos en tiempo real.
      </p>
      <Button
        variant="primary"
        onClick={onNewTransaction}
        icon={<Plus size={18} />}
      >
        Registrar mi primer gasto
      </Button>
    </div>
  );
};
