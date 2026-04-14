import { useState, useEffect } from 'react';
import { Transaction, Account, Category, AccountType, Contact, SavingsPlan } from './types';

const INITIAL_CATEGORIES: Category[] = [
  // Pemasukan
  { id: 'inc_gaji', name: 'Gaji', type: 'income', icon: '💰', color: '#10b981' },
  { id: 'inc_terima_pinjaman', name: 'Terima Pinjaman (Utang)', type: 'income', icon: '🤝', color: '#34d399' },
  { id: 'inc_bayar_utang', name: 'Penerimaan Piutang', type: 'income', icon: '💳', color: '#059669' },
  { id: 'inc_bonus', name: 'Bonus', type: 'income', icon: '🎁', color: '#6ee7b7' },
  { id: 'inc_tabung', name: 'Tabung Uang', type: 'income', icon: '🐷', color: '#10b981' },
  { id: 'inc_lainnya', name: 'Lainnya', type: 'income', icon: '✨', color: '#a7f3d0' },
  // Pengeluaran
  { id: 'exp_jajan', name: 'Jajan', type: 'expense', icon: '🍡', color: '#f43f5e' },
  { id: 'exp_makan', name: 'Makan & Minum', type: 'expense', icon: '🍽️', color: '#fb7185' },
  { id: 'exp_belanja', name: 'Belanja', type: 'expense', icon: '🛍️', color: '#e11d48' },
  { id: 'exp_bayar_utang', name: 'Membayar Utang', type: 'expense', icon: '💸', color: '#be123c' },
  { id: 'exp_kasih_pinjaman', name: 'Memberi Pinjaman', type: 'expense', icon: '🤝', color: '#fda4af' },
  { id: 'exp_ambil_tabungan', name: 'Ambil Tabungan', type: 'expense', icon: '🏧', color: '#f43f5e' },
  { id: 'exp_lainnya', name: 'Lainnya', type: 'expense', icon: '📝', color: '#ffe4e6' },
];

export const useFinanceData = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finance_transactions');
    try {
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('finance_accounts');
    try {
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('finance_contacts');
    try {
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  const [savingsPlans, setSavingsPlans] = useState<SavingsPlan[]>(() => {
    const saved = localStorage.getItem('finance_savings_plans');
    try {
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);

  useEffect(() => {
    localStorage.setItem('finance_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('finance_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('finance_contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('finance_savings_plans', JSON.stringify(savingsPlans));
  }, [savingsPlans]);

  const addContact = (name: string) => {
    const newContact: Contact = {
      id: `contact-${Date.now()}`,
      name,
    };
    setContacts((prev) => [...prev, newContact]);
    return newContact.id;
  };

  const addAccount = (account: Omit<Account, 'id' | 'balance'>) => {
    const newAccount: Account = {
      ...account,
      id: `acc-${Date.now()}`,
      balance: 0,
    };
    setAccounts((prev) => [...prev, newAccount]);
    return newAccount.id;
  };

  const updateAccount = (id: string, data: Omit<Account, 'id' | 'balance'>) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, ...data } : acc))
    );
  };

  const deleteAccount = (id: string) => {
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
    // Also delete associated transactions
    setTransactions((prev) => prev.filter((t) => t.accountId !== id));
  };

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `trx-${Date.now()}`,
    };

    setTransactions((prev) => [newTransaction, ...prev]);

    // Update savings plan balance if applicable
    if (transaction.savingsPlanId) {
      setSavingsPlans((prev) => prev.map(plan => {
        if (plan.id === transaction.savingsPlanId) {
          if (transaction.categoryId === 'inc_tabung') {
            return { ...plan, currentAmount: plan.currentAmount + transaction.amount };
          } else if (transaction.categoryId === 'exp_ambil_tabungan') {
            return { ...plan, currentAmount: plan.currentAmount - transaction.amount };
          }
        }
        return plan;
      }));
    }

    // Update account balance
    setAccounts((prev) =>
      prev.map((acc) => {
        if (transaction.type === 'transfer') {
          if (acc.id === transaction.accountId) {
            return { ...acc, balance: acc.balance - transaction.amount };
          }
          if (acc.id === transaction.toAccountId) {
            return { ...acc, balance: acc.balance + transaction.amount };
          }
          return acc;
        }

        if (acc.id === transaction.accountId) {
          const amountChange =
            transaction.type === 'income' ? transaction.amount : -transaction.amount;
          return { ...acc, balance: acc.balance + amountChange };
        }
        return acc;
      })
    );
  };

  const updateTransaction = (id: string, newTransactionData: Omit<Transaction, 'id'>) => {
    const oldTransaction = transactions.find((t) => t.id === id);
    if (!oldTransaction) return;

    // Revert old and apply new in one go to avoid multiple state updates
    setAccounts((prev) => {
      let tempAccounts = [...prev];
      
      // Revert old
      tempAccounts = tempAccounts.map((acc) => {
        if (oldTransaction.type === 'transfer') {
          if (acc.id === oldTransaction.accountId) return { ...acc, balance: acc.balance + oldTransaction.amount };
          if (acc.id === oldTransaction.toAccountId) return { ...acc, balance: acc.balance - oldTransaction.amount };
          return acc;
        }
        if (acc.id === oldTransaction.accountId) {
          const amountChange = oldTransaction.type === 'income' ? -oldTransaction.amount : oldTransaction.amount;
          return { ...acc, balance: acc.balance + amountChange };
        }
        return acc;
      });

      // Apply new
      tempAccounts = tempAccounts.map((acc) => {
        if (newTransactionData.type === 'transfer') {
          if (acc.id === newTransactionData.accountId) return { ...acc, balance: acc.balance - newTransactionData.amount };
          if (acc.id === newTransactionData.toAccountId) return { ...acc, balance: acc.balance + newTransactionData.amount };
          return acc;
        }
        if (acc.id === newTransactionData.accountId) {
          const amountChange = newTransactionData.type === 'income' ? newTransactionData.amount : -newTransactionData.amount;
          return { ...acc, balance: acc.balance + amountChange };
        }
        return acc;
      });

      return tempAccounts;
    });

    // Update savings plan balance if applicable
    setSavingsPlans((prev) => {
      let tempPlans = [...prev];
      
      // Revert old
      if (oldTransaction.savingsPlanId) {
        tempPlans = tempPlans.map(plan => {
          if (plan.id === oldTransaction.savingsPlanId) {
            if (oldTransaction.categoryId === 'inc_tabung') return { ...plan, currentAmount: plan.currentAmount - oldTransaction.amount };
            if (oldTransaction.categoryId === 'exp_ambil_tabungan') return { ...plan, currentAmount: plan.currentAmount + oldTransaction.amount };
          }
          return plan;
        });
      }

      // Apply new
      if (newTransactionData.savingsPlanId) {
        tempPlans = tempPlans.map(plan => {
          if (plan.id === newTransactionData.savingsPlanId) {
            if (newTransactionData.categoryId === 'inc_tabung') return { ...plan, currentAmount: plan.currentAmount + newTransactionData.amount };
            if (newTransactionData.categoryId === 'exp_ambil_tabungan') return { ...plan, currentAmount: plan.currentAmount - newTransactionData.amount };
          }
          return plan;
        });
      }
      return tempPlans;
    });

    setTransactions((prev) => prev.map(t => t.id === id ? { ...newTransactionData, id } : t));
  };

  const deleteTransaction = (id: string) => {
    const transaction = transactions.find((t) => t.id === id);
    if (!transaction) return;

    setTransactions((prev) => prev.filter((t) => t.id !== id));

    // Revert savings plan balance if applicable
    if (transaction.savingsPlanId) {
      setSavingsPlans((prev) => prev.map(plan => {
        if (plan.id === transaction.savingsPlanId) {
          if (transaction.categoryId === 'inc_tabung') {
            return { ...plan, currentAmount: plan.currentAmount - transaction.amount };
          } else if (transaction.categoryId === 'exp_ambil_tabungan') {
            return { ...plan, currentAmount: plan.currentAmount + transaction.amount };
          }
        }
        return plan;
      }));
    }

    // Revert account balance
    setAccounts((prev) =>
      prev.map((acc) => {
        if (transaction.type === 'transfer') {
          if (acc.id === transaction.accountId) {
            return { ...acc, balance: acc.balance + transaction.amount };
          }
          if (acc.id === transaction.toAccountId) {
            return { ...acc, balance: acc.balance - transaction.amount };
          }
          return acc;
        }

        if (acc.id === transaction.accountId) {
          const amountChange =
            transaction.type === 'income' ? -transaction.amount : transaction.amount;
          return { ...acc, balance: acc.balance + amountChange };
        }
        return acc;
      })
    );
  };

  const addSavingsPlan = (plan: Omit<SavingsPlan, 'id'>) => {
    const newPlan: SavingsPlan = {
      ...plan,
      id: `plan-${Date.now()}`,
    };
    setSavingsPlans((prev) => [...prev, newPlan]);
    return newPlan.id;
  };

  const updateSavingsPlan = (id: string, data: Partial<Omit<SavingsPlan, 'id'>>) => {
    setSavingsPlans((prev) =>
      prev.map((plan) => (plan.id === id ? { ...plan, ...data } : plan))
    );
  };

  const deleteSavingsPlan = (id: string) => {
    setSavingsPlans((prev) => prev.filter((plan) => plan.id !== id));
  };

  const resetAllData = () => {
    localStorage.clear();
    window.location.reload();
  };

  return {
    transactions,
    accounts,
    contacts,
    categories,
    savingsPlans,
    addContact,
    addAccount,
    updateAccount,
    deleteAccount,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addSavingsPlan,
    updateSavingsPlan,
    deleteSavingsPlan,
    resetAllData,
  };
};
