import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

type SpendingAlert = {
  message: string;
};

export function useSpendingAlerts() {
  const [alerts, setAlerts] = useState<SpendingAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get('/budgets/check-spending');

      if (response.data?.alerts && Array.isArray(response.data.alerts)) {
        setAlerts(response.data.alerts.map((alert: string) => ({ message: alert })));
      } else {
        setAlerts([]);
      }
      

    } catch (err) {
      console.error('Error fetching spending alerts:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch spending alerts'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return {
    alerts,
    isLoading,
    error,
    refetch: fetchAlerts,
  };
}
