import React from 'react';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTransactions } from '../hooks/useTransactions';
import { MainLayout } from '../components/layout/MainLayout';
import { StatCard } from '../components/common/StatCard';
import { TransactionList } from '../components/transactions/TransactionList';

export const DashboardView: React.FC = () => {
  const { user } = useAuth();
  const { transactions, isLoading, addTransaction } = useTransactions();

  // Calculated metrics (currently 0 for clean scaffold)
  const totalIncome = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((acc, tx) => acc + tx.amount, 0);

  const totalExpense = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((acc, tx) => acc + tx.amount, 0);

  const balance = totalIncome - totalExpense;

  const handleNewTransaction = async () => {
    // Quick test entry creation for user demonstration
    const description = prompt('Descripción del gasto/ingreso (o presiona Cancelar):', 'Café de especialidad');
    if (!description) return;

    const amountStr = prompt('Monto:', '4.50');
    if (!amountStr || isNaN(parseFloat(amountStr))) return;

    await addTransaction({
      description,
      amount: parseFloat(amountStr),
      type: 'expense',
      category: 'Alimentación',
      date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <MainLayout>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            ¡Hola, {user?.name || 'Usuario'}! 👋
          </h1>
          <p className="dashboard-desc">
            Este es el resumen de tu actividad financiera y control de gastos en Sila.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Balance Total"
          value={`$${balance.toFixed(2)}`}
          subtext="Calculado de ingresos y egresos"
          icon={<Wallet size={20} />}
          iconBgColor="var(--color-primary-50)"
          iconColor="var(--color-primary-600)"
        />
        <StatCard
          label="Ingresos del Período"
          value={`$${totalIncome.toFixed(2)}`}
          subtext="0 transacciones registradas"
          icon={<TrendingUp size={20} />}
          iconBgColor="var(--color-success-50)"
          iconColor="var(--color-success-600)"
        />
        <StatCard
          label="Gastos del Período"
          value={`$${totalExpense.toFixed(2)}`}
          subtext="0 transacciones registradas"
          icon={<TrendingDown size={20} />}
          iconBgColor="var(--color-danger-50)"
          iconColor="var(--color-danger-600)"
        />
      </div>

      <TransactionList
        transactions={transactions}
        isLoading={isLoading}
        onNewTransaction={handleNewTransaction}
      />
    </MainLayout>
  );
};
