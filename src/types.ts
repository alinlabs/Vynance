export type TransactionType = 'income' | 'expense' | 'transfer';
export type AccountType = 'cash' | 'bank' | 'ewallet';

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: AccountType;
  provider?: string;
  accountName?: string;
  accountNumber?: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
}

export interface Contact {
  id: string;
  name: string;
}

export interface SavingsPlan {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  notes?: string;
  accountId: string;
  billingMethod?: 'daily' | '3days' | 'weekly' | 'monthly' | 'specific_date';
  billingDate?: number; // For specific_date (1-31)
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'debt' | 'savings' | 'info';
  isRead: boolean;
  relatedId?: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  accountId: string;
  toAccountId?: string;
  receiptUrl?: string;
  contactId?: string;
  savingsPlanId?: string;
  dueDate?: string;
  installmentType?: 'weekly' | 'monthly' | 'yearly';
  installmentCount?: number;
}
