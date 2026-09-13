/**
 * Blockchain test helpers for time warping and balance checking.
 */
export async function advanceTime(seconds: number): Promise<void> {
  // Hardhat time travel wrapper
}

export async function getBlockTimestamp(): Promise<number> {
  return Math.floor(Date.now() / 1000);
}
