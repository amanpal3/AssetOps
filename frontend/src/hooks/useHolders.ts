import { useState, useEffect } from 'react';
import { fetchFromApi } from '../lib/api.js';

export function useHolders(assetAddress: string) {
  const [holders, setHolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assetAddress) return;
    fetchFromApi<{ holders: any[] }>(`/assets/${assetAddress}/holders`)
      .then(res => setHolders(res.holders))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [assetAddress]);

  return { holders, loading };
}
