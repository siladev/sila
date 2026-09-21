export type TransactionType = 'expense' | 'income';

export type TransactionCategory =
  | 'Comida'
  | 'Alimentación'
  | 'Transporte'
  | 'Vivienda'
  | 'Servicios'
  | 'Ocio'
  | 'Salud'
  | 'Educación'
  | 'Otros'
  | string;

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
