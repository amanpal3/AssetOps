import { ethers } from 'ethers';
import { config } from '../config/index.js';
import { EventHandlers } from './event-handlers.js';
import { SyncManager } from './sync-manager.js';
import fs from 'fs';
import path from 'path';

export class EventListener {
  private provider: ethers.JsonRpcProvider;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
  }

  async start() {
    console.log('📡 Starting AssetOps event listener on:', config.rpcUrl);
    // Reads manifest and listens for events
  }
}
