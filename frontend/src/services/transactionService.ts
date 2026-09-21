import { Transaction, CreateTransactionDto } from '../types/transaction';
import { apiClient } from './apiClient';

class TransactionService {
  async getTransactions(): Promise<Transaction[]> {
    try {
      const res = await apiClient.get<any>('/transactions');
      const list = Array.isArray(res) ? res : (res.transactions || []);
      return list.map((tx: any) => ({
        id: String(tx.id),
        amount: Number(tx.amount),
        type: tx.type || 'expense',
        category: tx.category,
        description: tx.description || '',
        date: tx.date,
      }));
    } catch {
      // Fallback en desarrollo sin backend
      return [];
    }
  }

  async createTransaction(dto: CreateTransactionDto): Promise<Transaction> {
    try {
      const res = await apiClient.post<any>('/transactions', dto);
      const tx = res.transaction || res;
      return {
        id: String(tx.id || 'tx_' + Date.now()),
        amount: Number(tx.amount || dto.amount),
        type: dto.type || 'expense',
        category: tx.category || dto.category,
        description: tx.description || dto.description || '',
        date: tx.date || dto.date,
      };
    } catch {
      // Fallback mock transaction creation for development
      return {
        id: 'tx_' + Date.now(),
        amount: dto.amount,
        type: dto.type,
        category: dto.category,
        description: dto.description,
        date: dto.date,
      };
    }
  }
}

export const transactionService = new TransactionService();
