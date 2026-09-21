import React, { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTransactions } from '../hooks/useTransactions';
import { MainLayout } from '../components/layout/MainLayout';
import { StatCard } from '../components/common/StatCard';
import { TransactionList } from '../components/transactions/TransactionList';
import { NewTransactionModal } from '../components/transactions/NewTransactionModal';
import { CreateTransactionDto } from '../types/transaction';

export const DashboardView: React.FC = () => {
  const { user } = useAuth();
  const { transactions, isLoading, addTransaction } = useTransactions();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculated metrics
  const totalIncome = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((acc, tx) => acc + tx.amount, 0);

  const totalExpense = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((acc, tx) => acc + tx.amount, 0);

  const balance = totalIncome - totalExpense;

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmitTransaction = async (dto: CreateTransactionDto) => {
    await addTransaction(dto);
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
          value={`$${balance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext="Calculado de ingresos y egresos"
          icon={<Wallet size={20} />}
          iconBgColor="var(--color-primary-50)"
          iconColor="var(--color-primary-600)"
        />
        <StatCard
          label="Ingresos del Período"
          value={`$${totalIncome.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext={`${transactions.filter((t) => t.type === 'income').length} transacciones registradas`}
          icon={<TrendingUp size={20} />}
          iconBgColor="var(--color-success-50)"
          iconColor="var(--color-success-600)"
        />
        <StatCard
          label="Gastos del Período"
          value={`$${totalExpense.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext={`${transactions.filter((t) => t.type === 'expense').length} transacciones registradas`}
          icon={<TrendingDown size={20} />}
          iconBgColor="var(--color-danger-50)"
          iconColor="var(--color-danger-600)"
        />
      </div>

      <TransactionList
        transactions={transactions}
        isLoading={isLoading}
        onNewTransaction={handleOpenModal}
      />

      <NewTransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitTransaction}
      />
    </MainLayout>
  );
};
