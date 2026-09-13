import { useState, useEffect } from 'react';
import { fetchFromApi } from '../lib/api.js';

export function useCorporateActions() {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = () => {
    setLoading(true);
    fetchFromApi<{ actions: any[] }>('/actions')
      .then(res => setActions(res.actions))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refetch();
  }, []);

  return { actions, loading, refetch };
}
