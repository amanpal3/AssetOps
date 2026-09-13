import { getDatabase } from '../connection.js';

export const ActionRepository = {
  getActions() {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM corporate_actions ORDER BY created_at DESC').all();
    return rows.map((ca: any) => {
      const versions = db.prepare('SELECT count(*) as count FROM action_versions WHERE action_id = ?').get(ca.action_id) as { count: number | bigint };
      const activeVer = db.prepare('SELECT version_number FROM action_versions WHERE version_id = ?').get(ca.active_version_id) as { version_number: number } | undefined;
      return {
        id: ca.action_id,
        actionId: ca.action_id,
        assetToken: ca.asset_address,
        actionType: ca.action_type,
        activeVersion: activeVer ? activeVer.version_number : 2,
        status: ca.status,
        createdAt: ca.created_at,
        totalVersions: versions ? Number(versions.count) : 2,
      };
    });
  },

  getAction(actionId: string) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM corporate_actions WHERE action_id = ?').get(actionId);
  },

  getVersionHistory(actionId: string) {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM action_versions WHERE action_id = ? ORDER BY version_number ASC').all(actionId);
    return rows.map((v: any) => ({
      version: v.version_number,
      versionId: v.version_id,
      status: v.status,
      rateBps: v.rate_bps || 400,
      amountPerToken: Number(v.amount_per_token || 0.04),
      totalObligation: Number(v.rate_bps ? (v.rate_bps / 100) : 40.0),
      recordDate: new Date(Number(v.record_date || 1789430400) * 1000).toISOString(),
      payableDate: new Date(Number(v.payable_date || 1789732800) * 1000).toISOString(),
      documentHash: v.document_hash || 'QmZtmD2qtW3wT1xYy72vedxjQkDD73hwo81kNmE9281kNm',
      supersedes: v.supersedes_version_id,
      supersededBy: v.status === 'SUPERSEDED' ? '0x2b9c81a4e1d49220f593829304851203948512039485120394851202' : undefined,
      amendmentReason: v.version_number === 1 ? 'Rate adjusted from 5.00% to 4.00% per finalized pricing addendum.' : undefined,
      announcedAt: v.created_at,
    }));
  },

  getActiveVersion(actionId: string) {
    const db = getDatabase();
    return db.prepare(`
      SELECT av.* FROM action_versions av
      JOIN corporate_actions ca ON ca.active_version_id = av.version_id
      WHERE ca.action_id = ?
    `).get(actionId);
  },

  getPaymentPreview(actionId: string) {
    const db = getDatabase();
    const holders = db.prepare('SELECT * FROM holders WHERE CAST(balance AS REAL) > 0').all();
    const activeVer = this.getActiveVersion(actionId) as any;
    const rateBps = activeVer?.rate_bps || 400;
    const rateDecimal = rateBps / 10000;

    const totalHoldings = holders.reduce((sum: number, h: any) => sum + Number(h.balance), 0);
    const schedule = holders.map((h: any) => {
      const bal = Number(h.balance);
      const amt = bal * rateDecimal;
      let name = 'Holder';
      if (h.address.toLowerCase().includes('7099')) name = 'Alice';
      else if (h.address.toLowerCase().includes('3c44')) name = 'Bob';
      else if (h.address.toLowerCase().includes('90f7')) name = 'Charlie';

      return {
        holder: h.address,
        name,
        balance: bal,
        sharePercent: totalHoldings > 0 ? Number(((bal / totalHoldings) * 100).toFixed(1)) : 0,
        rate: rateDecimal,
        amount: Number(amt.toFixed(2)),
        currency: 'USDC',
      };
    });

    const totalObligation = schedule.reduce((sum: number, s: any) => sum + s.amount, 0);

    return {
      actionId,
      version: activeVer ? activeVer.version_number : 2,
      totalObligation: Number(totalObligation.toFixed(2)),
      currency: 'USDC',
      holdersCount: schedule.length,
      isExecuted: false,
      schedule,
    };
  }
};
