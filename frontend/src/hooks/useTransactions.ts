import { useState, useEffect, useCallback } from 'react';
import { Transaction, CreateTransactionDto } from '../types/transaction';
import { transactionService } from '../services/transactionService';

export interface UseTransactionsResult {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
  addTransaction: (dto: CreateTransactionDto) => Promise<Transaction>;
}

export const useTransactions = (): UseTransactionsResult => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await transactionService.getTransactions();
      setTransactions(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar transacciones';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addTransaction = useCallback(async (dto: CreateTransactionDto): Promise<Transaction> => {
    setError(null);
    try {
      const newTx = await transactionService.createTransaction(dto);
      setTransactions((prev) => [newTx, ...prev]);
      return newTx;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al registrar transacción';
      setError(message);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    isLoading,
    error,
    fetchTransactions,
    addTransaction,
  };
};
