import { getDatabase } from '../connection.js';

export const AssetRepository = {
  getAllAssets() {
    const db = getDatabase();
    const assets = db.prepare('SELECT * FROM assets').all();
    return assets.map((a: any) => ({
      address: a.address,
      name: a.name,
      symbol: a.symbol,
      decimals: 18,
      totalSupply: Number(a.total_supply),
      standard: 'ERC-1404',
      maturityDate: '2027-09-15',
      activeCouponBps: 400,
      parValue: 1.0,
    }));
  },

  getAsset(address: string) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM assets WHERE address = ?').get(address);
  },

  getAllHolders() {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM holders WHERE CAST(balance AS REAL) > 0').all();
    const total = rows.reduce((sum: number, r: any) => sum + Number(r.balance), 0);
    const holders = rows.map((h: any) => {
      const bal = Number(h.balance);
      const pct = total > 0 ? (bal / total) * 100 : 0;
      let name = 'Holder';
      let role = 'Verified Investor';
      if (h.address.toLowerCase() === '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'.toLowerCase()) {
        name = 'Alice';
        role = 'Anchor Institutional Investor';
      } else if (h.address.toLowerCase() === '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'.toLowerCase()) {
        name = 'Bob';
        role = 'Primary Account (Transferred 200 to Charlie)';
      } else if (h.address.toLowerCase() === '0x90F79bf6EB2c4f870365E785982E1f101E93b906'.toLowerCase()) {
        name = 'Charlie';
        role = 'Secondary Market Transferee';
      }
      return {
        address: h.address,
        name,
        balance: bal,
        sharePercent: Number(pct.toFixed(1)),
        isWhitelisted: Boolean(h.is_whitelisted),
        role,
      };
    });
    return { holders, totalSupply: total || 1000 };
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
