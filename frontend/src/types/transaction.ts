export type TransactionType = 'expense' | 'income';

export type TransactionCategory =
  | 'Alimentación'
  | 'Transporte'
  | 'Vivienda'
  | 'Servicios'
  | 'Ocio'
  | 'Salud'
  | 'Educación'
  | 'Otros';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  date: string;
}

export interface CreateTransactionDto {
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  date: string;
}
