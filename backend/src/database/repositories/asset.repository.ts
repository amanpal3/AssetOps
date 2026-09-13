import { getDatabase } from '../connection.js';

export const AssetRepository = {
  getAsset(address: string) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM assets WHERE address = ?').get(address);
  },

  getHolders(assetAddress: string) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM holders WHERE asset_address = ? AND CAST(balance AS REAL) > 0').all(assetAddress);
  },

  upsertHolder(address: string, assetAddress: string, balance: string, isWhitelisted = true) {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO holders (address, asset_address, balance, is_whitelisted, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(address) DO UPDATE SET
        balance = excluded.balance,
        is_whitelisted = excluded.is_whitelisted,
        updated_at = CURRENT_TIMESTAMP
    `).run(address, assetAddress, balance, isWhitelisted ? 1 : 0);
  }
};
