import { getDatabase } from '../connection.js';

export const ActionRepository = {
  getActions() {
    const db = getDatabase();
    return db.prepare('SELECT * FROM corporate_actions ORDER BY created_at DESC').all();
  },

  getAction(actionId: string) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM corporate_actions WHERE action_id = ?').get(actionId);
  },

  getVersionHistory(actionId: string) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM action_versions WHERE action_id = ? ORDER BY version_number ASC').all(actionId);
  },

  getActiveVersion(actionId: string) {
    const db = getDatabase();
    return db.prepare(`
      SELECT av.* FROM action_versions av
      JOIN corporate_actions ca ON ca.active_version_id = av.version_id
      WHERE ca.action_id = ?
    `).get(actionId);
  }
};
