import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';

type Transaction = {
  _id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  notes?: string;
  userId: string;
};

type TransactionStats = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
};

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get('/transactions');
      
      // Sort transactions by date (newest first)
      const sortedTransactions = response.data.sort((a: Transaction, b: Transaction) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setTransactions(sortedTransactions);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch transactions'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const createTransaction = async (transactionData: any) => {
    try {
      const response = await api.post('/transactions', transactionData);
      return response.data;
    } catch (err) {
      console.error('Error creating transaction:', err);
      throw err;
    }
  };

  const updateTransaction = async (transactionId: string, transactionData: any) => {
    try {
      const response = await api.put(`/transactions/${transactionId}`, transactionData);
      return response.data;
    } catch (err) {
      console.error('Error updating transaction:', err);
      throw err;
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    try {
      await api.delete(`/transactions/${transactionId}`);
    } catch (err) {
      console.error('Error deleting transaction:', err);
      throw err;
    }
  };

  // Calculate transaction statistics
  const stats = useMemo<TransactionStats>(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }, [transactions]);

  return {
    transactions,
    isLoading,
    error,
    stats,
    refetch: fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}