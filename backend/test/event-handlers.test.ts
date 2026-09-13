import test from 'node:test';
import assert from 'node:assert';
import { EventHandlers } from '../src/indexer/event-handlers.js';
import { ActionRepository } from '../src/database/repositories/action.repository.js';

test('EventHandlers - should record announcement and amendment correctly', () => {
  const actionId = '0x1111111111111111111111111111111111111111111111111111111111111111';
  const v1Id = '0x2222222222222222222222222222222222222222222222222222222222222222';
  const v2Id = '0x3333333333333333333333333333333333333333333333333333333333333333';

  // Handle v1 created
  EventHandlers.handleActionCreated(actionId, v1Id, '0xAsset', 0, 1, { transactionHash: '0xTx1', blockNumber: 100 });
  const action = ActionRepository.getAction(actionId);
  assert.ok(action, 'Action should exist');

  // Handle v2 amended
  EventHandlers.handleActionAmended(actionId, v1Id, v2Id, 2, { transactionHash: '0xTx2', blockNumber: 101 });
  const activeVer = ActionRepository.getActiveVersion(actionId) as any;
  assert.strictEqual(activeVer.version_id, v2Id, 'Active version should be v2');
});
