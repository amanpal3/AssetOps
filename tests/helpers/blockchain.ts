/**
 * Blockchain test helpers for time warping and timestamp querying.
 */
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';

export async function advanceTime(seconds: number): Promise<void> {
  try {
    // 1. Advance EVM time
    await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [seconds],
        id: Date.now()
      })
    });

    // 2. Mine next block to seal time advancement
    await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'evm_mine',
        params: [],
        id: Date.now() + 1
      })
    });
  } catch {
    // Graceful fallback in offline/mock test environments
  }
}

export async function getBlockTimestamp(): Promise<number> {
  try {
    const res = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: ['latest', false],
        id: Date.now()
      })
    });
    const data = await res.json();
    if (data?.result?.timestamp) {
      return parseInt(data.result.timestamp, 16);
    }
  } catch {
    // Fallback to local system timestamp
  }
  return Math.floor(Date.now() / 1000);
}
