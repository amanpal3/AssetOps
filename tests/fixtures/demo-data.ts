/**
 * Canonical test data for AssetOps.
 */
export const DEMO_DATA = {
  TOKEN_NAME: 'Demo Bond Token',
  TOKEN_SYMBOL: 'DBT',
  INITIAL_SUPPLY: 1000n * 10n ** 18n,
  ALICE_INITIAL: 500n * 10n ** 18n,
  BOB_INITIAL: 500n * 10n ** 18n,
  BOB_TRANSFER_TO_CHARLIE: 200n * 10n ** 18n,
  ACTION_ID: 'CA-001',
  V1_RATE_BPS: 500n, // 5%
  V2_RATE_BPS: 400n, // 4%
  REDEMPTION_AMOUNT_PER_TOKEN: 1n * 10n ** 18n // 1 USDC per 1 DBT
};
