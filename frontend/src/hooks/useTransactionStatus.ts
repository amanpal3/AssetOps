import { useState } from 'react';

export type TxState = 'idle' | 'signature_requested' | 'pending' | 'confirmed' | 'failed';

export function useTransactionStatus() {
  const [state, setState] = useState<TxState>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reset = () => {
    setState('idle');
    setTxHash(null);
    setErrorMessage(null);
  };

  return { state, setState, txHash, setTxHash, errorMessage, setErrorMessage, reset };
}
