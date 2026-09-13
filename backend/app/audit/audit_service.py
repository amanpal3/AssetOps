import hashlib
import json
import uuid
from datetime import datetime, timezone
import sqlite3

class AuditService:
    @staticmethod
    def get_last_hash(conn: sqlite3.Connection) -> str:
        cursor = conn.execute("SELECT event_hash FROM audit_logs ORDER BY rowid DESC LIMIT 1")
        row = cursor.fetchone()
        return row["event_hash"] if row else "GENESIS_HASH"

    @staticmethod
    def log_event(
        conn: sqlite3.Connection,
        event_type: str,
        details: dict,
        action_id: str = None,
        version_id: str = None,
        actor: str = "TRUSTED_RUNTIME"
    ) -> str:
        event_id = f"evt_{uuid.uuid4().hex[:12]}"
        prev_hash = AuditService.get_last_hash(conn)
        timestamp = datetime.now(timezone.utc).isoformat()
        details_str = json.dumps(details, sort_keys=True)

        payload = f"{event_id}|{event_type}|{action_id or ''}|{version_id or ''}|{actor}|{details_str}|{prev_hash}|{timestamp}"
        event_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()

        conn.execute("""
            INSERT INTO audit_logs (event_id, event_type, action_id, version_id, actor, details, prev_hash, event_hash, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (event_id, event_type, action_id, version_id, actor, details_str, prev_hash, event_hash, timestamp))

        return event_id
