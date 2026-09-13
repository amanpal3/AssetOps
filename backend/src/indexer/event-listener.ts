import { createPublicClient, http, parseAbiItem } from 'viem';
import { hardhat, sepolia } from 'viem/chains';
import { config } from '../config/index.js';
import { prisma } from '../database/prisma.js';
import { EventProcessor } from './event-processor.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class EventListener {
  private client: any;
  private processor: EventProcessor;
  private isRunning = false;
  private contracts: {
    securityToken?: string;
    corporateActionRegistry?: string;
    paymentExecutor?: string;
    paymentCurrency?: string;
  } = {};
  private chainId = 31337;

  constructor() {
    const chain = config.rpcUrl.includes('sepolia') ? sepolia : hardhat;
    this.chainId = chain.id;
    this.client = createPublicClient({
      chain,
      transport: http(config.rpcUrl)
    });
    this.processor = new EventProcessor(this.client);
    this.loadManifest();
  }

  loadManifest() {
    try {
      const networkName = this.chainId === 11155111 ? 'sepolia' : 'hardhat';
      const manifestPath = path.resolve(__dirname, '../../../deployments', `${networkName}.json`);

      if (fs.existsSync(manifestPath)) {
        const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        this.contracts = data.contracts || {};
        console.log(`📋 Loaded ${networkName} deployment manifest:`, this.contracts);
      } else {
        console.warn(`⚠️ Deployment manifest not found at ${manifestPath}. Indexer will poll once contracts are deployed.`);
      }
    } catch (err) {
      console.warn('Could not load deployment manifest:', err);
    }
  }

  async getLastProcessedBlock(): Promise<bigint> {
    const checkpoint = await prisma.syncCheckpoint.findUnique({
      where: { id: 'checkpoint' }
    });
    return checkpoint ? checkpoint.lastBlock : 0n;
  }

  async setLastProcessedBlock(blockNumber: bigint) {
    await prisma.syncCheckpoint.upsert({
      where: { id: 'checkpoint' },
      create: {
        id: 'checkpoint',
        chainId: this.chainId,
        lastBlock: blockNumber
      },
      update: {
        chainId: this.chainId,
        lastBlock: blockNumber
      }
    });
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`📡 Starting AssetOps blockchain event indexer on chain ID ${this.chainId}...`);

    // Periodic polling loop
    const poll = async () => {
      try {
        if (!this.contracts.securityToken || !this.contracts.corporateActionRegistry) {
          this.loadManifest();
        }

        if (this.contracts.securityToken && this.contracts.corporateActionRegistry) {
          await this.syncLogs();
        }
      } catch (err) {
        console.error('Indexer poll error:', err);
      }

      if (this.isRunning) {
        setTimeout(poll, 3000);
      }
    };

    poll();
  }

  stop() {
    this.isRunning = false;
  }

  /**
   * Syncs logs from last processed block to current block head.
   */
  async syncLogs() {
    const currentBlock = await this.client.getBlockNumber();
    const lastBlock = await this.getLastProcessedBlock();

    if (currentBlock <= lastBlock) return;

    const fromBlock = lastBlock === 0n ? 0n : lastBlock + 1n;
    const toBlock = currentBlock;

    const secToken = this.contracts.securityToken as `0x${string}`;
    const registry = this.contracts.corporateActionRegistry as `0x${string}`;
    const executor = this.contracts.paymentExecutor as `0x${string}`;

    // 1. Ingest SecurityToken: Transfer
    if (secToken) {
      const transferLogs = await this.client.getLogs({
        address: secToken,
        event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
        fromBlock,
        toBlock
      });

      for (const log of transferLogs) {
        const { from, to, value } = log.args;
        if (from && to && value !== undefined) {
          await this.processor.handleTransfer(secToken, from, to, value, log.transactionHash, log.logIndex, log.blockNumber, this.chainId);
        }
      }

      // WhitelistUpdated
      const whitelistLogs = await this.client.getLogs({
        address: secToken,
        event: parseAbiItem('event WhitelistUpdated(address indexed account, bool status)'),
        fromBlock,
        toBlock
      });

      for (const log of whitelistLogs) {
        const { account, status } = log.args;
        if (account && status !== undefined) {
          await this.processor.handleWhitelistUpdated(secToken, account, status, log.transactionHash, log.logIndex, log.blockNumber, this.chainId);
        }
      }
    }

    // 2. Ingest CorporateActionRegistry
    if (registry) {
      // ActionCreated
      const createdLogs = await this.client.getLogs({
        address: registry,
        event: parseAbiItem('event ActionCreated(bytes32 indexed actionId, bytes32 indexed versionId, address indexed assetToken, uint8 actionType, uint32 version)'),
        fromBlock,
        toBlock
      });

      for (const log of createdLogs) {
        const { actionId, versionId, assetToken, actionType, version } = log.args;
        if (actionId && versionId && assetToken && actionType !== undefined && version !== undefined) {
          await this.processor.handleActionCreated(registry, actionId, versionId, assetToken, actionType, version, log.transactionHash, log.logIndex, log.blockNumber, this.chainId);
        }
      }

      // ActionAmended
      const amendedLogs = await this.client.getLogs({
        address: registry,
        event: parseAbiItem('event ActionAmended(bytes32 indexed actionId, bytes32 indexed previousVersionId, bytes32 indexed newVersionId, uint32 newVersion)'),
        fromBlock,
        toBlock
      });

      for (const log of amendedLogs) {
        const { actionId, previousVersionId, newVersionId, newVersion } = log.args;
        if (actionId && previousVersionId && newVersionId && newVersion !== undefined) {
          await this.processor.handleActionAmended(registry, actionId, previousVersionId, newVersionId, newVersion, log.transactionHash, log.logIndex, log.blockNumber, this.chainId);
        }
      }

      // ActionExecuted
      const executedLogs = await this.client.getLogs({
        address: registry,
        event: parseAbiItem('event ActionExecuted(bytes32 indexed actionId, bytes32 indexed versionId, address indexed executor)'),
        fromBlock,
        toBlock
      });

      for (const log of executedLogs) {
        const { actionId, versionId, executor: execAddr } = log.args;
        if (actionId && versionId && execAddr) {
          await this.processor.handleActionExecuted(actionId, versionId, execAddr, log.transactionHash, log.logIndex, log.blockNumber, this.chainId);
        }
      }

      // ActionCancelled
      const cancelledLogs = await this.client.getLogs({
        address: registry,
        event: parseAbiItem('event ActionCancelled(bytes32 indexed actionId, bytes32 indexed versionId)'),
        fromBlock,
        toBlock
      });

      for (const log of cancelledLogs) {
        const { actionId, versionId } = log.args;
        if (actionId && versionId) {
          await this.processor.handleActionCancelled(actionId, versionId, log.transactionHash, log.logIndex, log.blockNumber, this.chainId);
        }
      }
    }

    // 3. Ingest PaymentExecutor
    if (executor) {
      // HolderPaid
      const paidLogs = await this.client.getLogs({
        address: executor,
        event: parseAbiItem('event HolderPaid(bytes32 indexed actionId, bytes32 indexed versionId, address indexed holder, uint256 assetBalance, uint256 paymentAmount)'),
        fromBlock,
        toBlock
      });

      for (const log of paidLogs) {
        const { actionId, versionId, holder, assetBalance, paymentAmount } = log.args;
        if (actionId && versionId && holder && assetBalance !== undefined && paymentAmount !== undefined) {
          await this.processor.handleHolderPaid(actionId, versionId, holder, assetBalance, paymentAmount, log.transactionHash, log.logIndex, log.blockNumber, this.chainId);
        }
      }

      // HolderRedeemed
      const redeemedLogs = await this.client.getLogs({
        address: executor,
        event: parseAbiItem('event HolderRedeemed(bytes32 indexed actionId, bytes32 indexed versionId, address indexed holder, uint256 tokenAmount, uint256 principalAmount)'),
        fromBlock,
        toBlock
      });

      for (const log of redeemedLogs) {
        const { actionId, versionId, holder, tokenAmount, principalAmount } = log.args;
        if (actionId && versionId && holder && tokenAmount !== undefined && principalAmount !== undefined) {
          await this.processor.handleHolderRedeemed(actionId, versionId, holder, tokenAmount, principalAmount, log.transactionHash, log.logIndex, log.blockNumber, this.chainId);
        }
      }
    }

    // Checkpoint progress
    await this.setLastProcessedBlock(toBlock);
  }
}
