import React from 'react';
import { Plus, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Transaction } from '../../types/transaction';
import { Button } from '../common/Button';
import { EmptyTransactions } from './EmptyTransactions';

export interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
  onNewTransaction?: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  isLoading,
  onNewTransaction,
}) => {
  return (
    <section className="card" aria-labelledby="transactions-heading">
      <div className="card-header">
        <div>
          <h2 id="transactions-heading" style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-slate-900)' }}>
            Movimientos recientes
          </h2>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {transactions.length} transacción{transactions.length === 1 ? '' : 'es'} registrada{transactions.length === 1 ? '' : 's'}
          </span>
        </div>
        <Button
          variant="outline"
          onClick={onNewTransaction}
          icon={<Plus size={16} />}
          style={{ padding: '0.45rem 0.875rem', fontSize: '0.8125rem' }}
        >
          Nuevo movimiento
        </Button>
      </div>

      <div className="card-body" style={{ padding: transactions.length === 0 ? '0' : '1rem' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <span className="spinner" style={{ borderColor: 'var(--color-slate-300)', borderTopColor: 'var(--color-primary-600)', margin: '0 auto 0.75rem', display: 'block' }} />
            <p style={{ fontSize: '0.875rem' }}>Cargando tus movimientos...</p>
          </div>
        ) : transactions.length === 0 ? (
          <EmptyTransactions onNewTransaction={onNewTransaction} />
        ) : (
          <div className="transaction-items-wrapper">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.875rem 0.5rem',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-full)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: tx.type === 'income' ? 'var(--color-success-50)' : 'var(--color-danger-50)',
                      color: tx.type === 'income' ? 'var(--color-success-600)' : 'var(--color-danger-500)',
                    }}
                  >
                    {tx.type === 'income' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-slate-800)' }}>
                      {tx.description}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {tx.category} • {tx.date}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    color: tx.type === 'income' ? 'var(--color-success-600)' : 'var(--color-slate-900)',
                  }}
                >
                  {tx.type === 'income' ? '+' : '-'} ${tx.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
