import test from 'node:test';
import assert from 'node:assert';
import { EventHandlers } from '../src/indexer/event-handlers.js';
import { ActionRepository } from '../src/database/repositories/action.repository.js';
import { getDatabase } from '../src/database/connection.js';

test('Indexer Rebuild - replaying events reproduces exact database state', () => {
  const db = getDatabase();
  const replayActionId = 'CA-REPLAY-001';
  const v1 = '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  const v2 = '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';

  // 1. Replay Action Creation
  EventHandlers.handleActionCreated(replayActionId, v1, '0xAsset', 0, 1, {
    transactionHash: '0xTxGenesis',
    blockNumber: 1000
  });

  let action = ActionRepository.getAction(replayActionId) as any;
  assert.strictEqual(action.active_version_id, v1, 'Initial active version must be v1');

  // 2. Replay Amendment
  EventHandlers.handleActionAmended(replayActionId, v1, v2, 2, {
    transactionHash: '0xTxAmended',
    blockNumber: 1005
  });

  action = ActionRepository.getAction(replayActionId) as any;
  assert.strictEqual(action.active_version_id, v2, 'Active version must update to v2');

  const history = ActionRepository.getVersionHistory(replayActionId);
  assert.strictEqual(history.length, 2, 'History must contain 2 versions');

  const ver1 = history.find((h: any) => h.version === 1);
  const ver2 = history.find((h: any) => h.version === 2);
  assert.strictEqual(ver1.status, 'SUPERSEDED', 'Version 1 must be SUPERSEDED');
  assert.strictEqual(ver2.status, 'ACTIVE', 'Version 2 must be ACTIVE');
});
