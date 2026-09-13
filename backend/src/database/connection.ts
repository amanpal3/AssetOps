import Database from 'better-sqlite3';
import { config } from '../config/index.js';
import fs from 'fs';
import path from 'path';

let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(config.databasePath);
    dbInstance.pragma('journal_mode = WAL');
    runMigrations(dbInstance);
  }
  return dbInstance;
}

function runMigrations(db: Database.Database) {
  const migrationsDir = path.resolve(__dirname, 'migrations');
  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      db.exec(sql);
    }
  }
}
