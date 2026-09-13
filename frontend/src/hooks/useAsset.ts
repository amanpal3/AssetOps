import { useState, useEffect } from 'react';
import { fetchFromApi } from '../lib/api.js';

export function useAsset(address: string) {
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;
    fetchFromApi(`/assets/${address}`)
      .then(setAsset)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [address]);

  return { asset, loading };
}
