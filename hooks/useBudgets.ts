import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

type Budget = {
  _id: string;
  category: string;
  amount: number;
  limit?: number;  
  spent: number;
  period: string;
  userId: string;
};

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBudgets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get('/budgets');
      
      // Add spent property if not provided by API
      const budgetsWithSpent = response.data.map((budget: any) => ({
        ...budget,
        spent: budget.spent || 0,
      }));
      
      setBudgets(budgetsWithSpent);
    } catch (err) {
      console.error('Error fetching budgets:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch budgets'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const createBudget = async (budgetData: any) => {
    try {
      const response = await api.post('/budgets', budgetData);
      return response.data;
    } catch (err) {
      console.error('Error creating budget:', err);
      throw err;
    }
  };

  const updateBudget = async (budgetId: string, budgetData: any) => {
    try {
      const response = await api.put(`/budgets/${budgetId}`, budgetData);
      return response.data;
    } catch (err) {
      console.error('Error updating budget:', err);
      throw err;
    }
  };

  const deleteBudget = async (budgetId: string) => {
    try {
      await api.delete(`/budgets/${budgetId}`);
    } catch (err) {
      console.error('Error deleting budget:', err);
      throw err;
    }
  };

  return {
    budgets,
    isLoading,
    error,
    refetch: fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
  };
}