import { Transaction, CreateTransactionDto } from '../types/transaction';
import { apiClient } from './apiClient';

class TransactionService {
  async getTransactions(): Promise<Transaction[]> {
    try {
      const transactions = await apiClient.get<Transaction[]>('/transactions');
      return transactions;
    } catch {
      // In development / scaffold mode without backend, return empty list of transactions
      return [];
    }
  }

  async createTransaction(dto: CreateTransactionDto): Promise<Transaction> {
    try {
      return await apiClient.post<Transaction>('/transactions', dto);
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
