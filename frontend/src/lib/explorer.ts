export function getExplorerUrl(hash: string, type: 'tx' | 'address' = 'tx', chainId = 11155111): string {
  if (chainId === 11155111) {
    return `https://sepolia.etherscan.io/${type}/${hash}`;
  }
  return `http://localhost:8545/${type}/${hash}`;
}
