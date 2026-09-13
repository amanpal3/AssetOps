import { prisma } from '../database/prisma.js';
import { formatUnits, formatEther, PublicClient } from 'viem';
import { CorporateActionRegistryAbi, SecurityTokenAbi } from './abis.js';

export class EventProcessor {
  private client: PublicClient;

  constructor(client: PublicClient) {
    this.client = client;
  }

  /**
   * Enforces event deduplication using (txHash + logIndex + chainId).
   * Returns true if event is NEW and should be processed; false if ALREADY processed.
   */
  async deduplicate(txHash: string, logIndex: number, chainId: number, eventName: string, blockNumber: bigint): Promise<boolean> {
    try {
      await prisma.processedEvent.create({
        data: {
          transactionHash: txHash.toLowerCase(),
          logIndex,
          chainId,
          eventName,
          blockNumber
        }
      });
      return true;
    } catch (err: any) {
      // Unique constraint violation -> Already processed
      return false;
    }
  }

  // 1. Handle SecurityToken Transfer (Mint, Transfer, Burn)
  async handleTransfer(assetAddress: string, from: string, to: string, value: bigint, txHash: string, logIndex: number, blockNumber: bigint, chainId: number) {
    const isNew = await this.deduplicate(txHash, logIndex, chainId, 'Transfer', blockNumber);
    if (!isNew) return;

    const lowerAsset = assetAddress.toLowerCase();
    const lowerFrom = from.toLowerCase();
    const lowerTo = to.toLowerCase();
    const amountStr = value.toString();
    const amountDisplay = formatEther(value);

    // Record transfer log
    await prisma.transfer.create({
      data: {
        assetAddress: lowerAsset,
        from: lowerFrom,
        to: lowerTo,
        amount: amountStr,
        amountDisplay,
        transactionHash: txHash.toLowerCase(),
        blockNumber
      }
    });

    // Ensure Asset record exists
    let asset = await prisma.asset.findUnique({ where: { address: lowerAsset } });
    if (!asset) {
      // Read metadata from contract via viem
      let name = 'Demo Bond Token';
      let symbol = 'DBT';
      try {
        name = await this.client.readContract({
          address: assetAddress as `0x${string}`,
          abi: SecurityTokenAbi,
          functionName: 'name'
        });
        symbol = await this.client.readContract({
          address: assetAddress as `0x${string}`,
          abi: SecurityTokenAbi,
          functionName: 'symbol'
        });
      } catch (e) {
        // Fallback defaults
      }

      asset = await prisma.asset.create({
        data: {
          address: lowerAsset,
          name,
          symbol,
          decimals: 18,
          totalSupply: '0',
          totalSupplyDisplay: '0',
          holderCount: 0
        }
      });
    }

    const zeroAddress = '0x0000000000000000000000000000000000000000';

    // Update sender balance if not mint
    if (lowerFrom !== zeroAddress) {
      const fromBal = await this.client.readContract({
        address: assetAddress as `0x${string}`,
        abi: SecurityTokenAbi,
        functionName: 'balanceOf',
        args: [from as `0x${string}`]
      });

      await prisma.holder.upsert({
        where: { address_assetAddress: { address: lowerFrom, assetAddress: lowerAsset } },
        create: {
          address: lowerFrom,
          assetAddress: lowerAsset,
          balance: fromBal.toString(),
          balanceDisplay: formatEther(fromBal),
          lastTransferAt: new Date()
        },
        update: {
          balance: fromBal.toString(),
          balanceDisplay: formatEther(fromBal),
          lastTransferAt: new Date()
        }
      });
    }

    // Update receiver balance if not burn
    if (lowerTo !== zeroAddress) {
      const toBal = await this.client.readContract({
        address: assetAddress as `0x${string}`,
        abi: SecurityTokenAbi,
        functionName: 'balanceOf',
        args: [to as `0x${string}`]
      });

      const isWhitelisted = await this.client.readContract({
        address: assetAddress as `0x${string}`,
        abi: SecurityTokenAbi,
        functionName: 'isWhitelisted',
        args: [to as `0x${string}`]
      });

      await prisma.holder.upsert({
        where: { address_assetAddress: { address: lowerTo, assetAddress: lowerAsset } },
        create: {
          address: lowerTo,
          assetAddress: lowerAsset,
          balance: toBal.toString(),
          balanceDisplay: formatEther(toBal),
          isWhitelisted: Boolean(isWhitelisted),
          lastTransferAt: new Date()
        },
        update: {
          balance: toBal.toString(),
          balanceDisplay: formatEther(toBal),
          isWhitelisted: Boolean(isWhitelisted),
          lastTransferAt: new Date()
        }
      });
    }

    // Update Asset total supply and active holder count
    const totalSup = await this.client.readContract({
      address: assetAddress as `0x${string}`,
      abi: SecurityTokenAbi,
      functionName: 'totalSupply'
    });

    const activeHolderCount = await prisma.holder.count({
      where: {
        assetAddress: lowerAsset,
        NOT: { balance: '0' }
      }
    });

    await prisma.asset.update({
      where: { address: lowerAsset },
      data: {
        totalSupply: totalSup.toString(),
        totalSupplyDisplay: formatEther(totalSup),
        holderCount: activeHolderCount
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        eventType: lowerFrom === zeroAddress ? 'MINT' : lowerTo === zeroAddress ? 'BURN' : 'TRANSFER',
        actor: lowerFrom,
        details: JSON.stringify({ assetAddress: lowerAsset, from: lowerFrom, to: lowerTo, amount: amountStr, amountDisplay }),
        transactionHash: txHash.toLowerCase(),
        blockNumber
      }
    });
  }

  // 2. Handle WhitelistUpdated
  async handleWhitelistUpdated(assetAddress: string, account: string, status: boolean, txHash: string, logIndex: number, blockNumber: bigint, chainId: number) {
    const isNew = await this.deduplicate(txHash, logIndex, chainId, 'WhitelistUpdated', blockNumber);
    if (!isNew) return;

    const lowerAsset = assetAddress.toLowerCase();
    const lowerAccount = account.toLowerCase();

    await prisma.holder.upsert({
      where: { address_assetAddress: { address: lowerAccount, assetAddress: lowerAsset } },
      create: {
        address: lowerAccount,
        assetAddress: lowerAsset,
        isWhitelisted: status
      },
      update: {
        isWhitelisted: status
      }
    });

    await prisma.auditLog.create({
      data: {
        eventType: 'WHITELIST_UPDATED',
        actor: lowerAccount,
        details: JSON.stringify({ account: lowerAccount, status }),
        transactionHash: txHash.toLowerCase(),
        blockNumber
      }
    });
  }

  // 3. Handle ActionCreated
  async handleActionCreated(registryAddress: string, actionId: string, versionId: string, assetToken: string, actionTypeNum: number, versionNum: number, txHash: string, logIndex: number, blockNumber: bigint, chainId: number) {
    const isNew = await this.deduplicate(txHash, logIndex, chainId, 'ActionCreated', blockNumber);
    if (!isNew) return;

    const lowerActionId = actionId.toLowerCase();
    const lowerVersionId = versionId.toLowerCase();
    const lowerAsset = assetToken.toLowerCase();
    const typeStr = actionTypeNum === 0 ? 'COUPON' : actionTypeNum === 1 ? 'INTEREST' : 'REDEMPTION';

    // Fetch full on-chain version terms from CorporateActionRegistry
    let rateBps: number | null = null;
    let amountPerToken: string | null = null;
    let payableDate: Date | null = null;
    let recordDate: Date | null = null;
    let documentHash: string | null = null;
    let announcedBy: string | null = null;

    try {
      const verData = await this.client.readContract({
        address: registryAddress as `0x${string}`,
        abi: CorporateActionRegistryAbi,
        functionName: 'getVersion',
        args: [versionId as `0x${string}`]
      });

      rateBps = Number(verData.rateBps);
      amountPerToken = verData.amountPerToken.toString();
      payableDate = verData.payableDate > 0n ? new Date(Number(verData.payableDate) * 1000) : null;
      recordDate = verData.recordDate > 0n ? new Date(Number(verData.recordDate) * 1000) : null;
      documentHash = verData.documentHash;
      announcedBy = verData.announcedBy.toLowerCase();
    } catch (e) {
      console.warn('Could not fetch version data from contract for ActionCreated:', e);
    }

    // Ensure Asset exists
    await prisma.asset.upsert({
      where: { address: lowerAsset },
      create: {
        address: lowerAsset,
        name: 'Demo Bond Token',
        symbol: 'DBT'
      },
      update: {}
    });

    // Create CorporateAction root record
    await prisma.corporateAction.upsert({
      where: { actionId: lowerActionId },
      create: {
        actionId: lowerActionId,
        actionReference: `CA-${lowerActionId.slice(2, 6).toUpperCase()}`,
        assetAddress: lowerAsset,
        actionType: typeStr,
        activeVersionId: lowerVersionId,
        activeVersionNum: versionNum,
        status: 'ACTIVE'
      },
      update: {
        activeVersionId: lowerVersionId,
        activeVersionNum: versionNum,
        status: 'ACTIVE'
      }
    });

    // Create ActionVersion record
    await prisma.actionVersion.upsert({
      where: { versionId: lowerVersionId },
      create: {
        versionId: lowerVersionId,
        actionId: lowerActionId,
        versionNumber: versionNum,
        rateBps,
        displayRate: rateBps !== null ? `${rateBps / 100}%` : null,
        amountPerToken,
        recordDate,
        payableDate,
        documentHash,
        announcedBy,
        status: 'ACTIVE'
      },
      update: {
        status: 'ACTIVE'
      }
    });

    await prisma.auditLog.create({
      data: {
        eventType: 'ACTION_CREATED',
        actionId: lowerActionId,
        versionId: lowerVersionId,
        details: JSON.stringify({ actionId: lowerActionId, versionId: lowerVersionId, typeStr, rateBps, payableDate, documentHash }),
        transactionHash: txHash.toLowerCase(),
        blockNumber
      }
    });
  }

  // 4. Handle ActionAmended
  async handleActionAmended(registryAddress: string, actionId: string, prevVersionId: string, newVersionId: string, newVersionNum: number, txHash: string, logIndex: number, blockNumber: bigint, chainId: number) {
    const isNew = await this.deduplicate(txHash, logIndex, chainId, 'ActionAmended', blockNumber);
    if (!isNew) return;

    const lowerActionId = actionId.toLowerCase();
    const lowerOldVerId = prevVersionId.toLowerCase();
    const lowerNewVerId = newVersionId.toLowerCase();

    // Mark previous version SUPERSEDED
    await prisma.actionVersion.updateMany({
      where: { versionId: lowerOldVerId },
      data: { status: 'SUPERSEDED' }
    });

    // Fetch new version data from contract
    let rateBps: number | null = null;
    let amountPerToken: string | null = null;
    let payableDate: Date | null = null;
    let recordDate: Date | null = null;
    let documentHash: string | null = null;
    let announcedBy: string | null = null;

    try {
      const verData = await this.client.readContract({
        address: registryAddress as `0x${string}`,
        abi: CorporateActionRegistryAbi,
        functionName: 'getVersion',
        args: [newVersionId as `0x${string}`]
      });

      rateBps = Number(verData.rateBps);
      amountPerToken = verData.amountPerToken.toString();
      payableDate = verData.payableDate > 0n ? new Date(Number(verData.payableDate) * 1000) : null;
      recordDate = verData.recordDate > 0n ? new Date(Number(verData.recordDate) * 1000) : null;
      documentHash = verData.documentHash;
      announcedBy = verData.announcedBy.toLowerCase();
    } catch (e) {
      console.warn('Could not fetch new version from contract:', e);
    }

    // Insert new version
    await prisma.actionVersion.upsert({
      where: { versionId: lowerNewVerId },
      create: {
        versionId: lowerNewVerId,
        actionId: lowerActionId,
        versionNumber: newVersionNum,
        rateBps,
        displayRate: rateBps !== null ? `${rateBps / 100}%` : null,
        amountPerToken,
        recordDate,
        payableDate,
        documentHash,
        supersedesVersionId: lowerOldVerId,
        announcedBy,
        status: 'ACTIVE'
      },
      update: {
        status: 'ACTIVE'
      }
    });

    // Point CorporateAction to new version
    await prisma.corporateAction.update({
      where: { actionId: lowerActionId },
      data: {
        activeVersionId: lowerNewVerId,
        activeVersionNum: newVersionNum,
        status: 'ACTIVE'
      }
    });

    await prisma.auditLog.create({
      data: {
        eventType: 'ACTION_AMENDED',
        actionId: lowerActionId,
        versionId: lowerNewVerId,
        details: JSON.stringify({ actionId: lowerActionId, prevVersionId: lowerOldVerId, newVersionId: lowerNewVerId, newVersionNum, rateBps }),
        transactionHash: txHash.toLowerCase(),
        blockNumber
      }
    });
  }

  // 5. Handle ActionExecuted
  async handleActionExecuted(actionId: string, versionId: string, executor: string, txHash: string, logIndex: number, blockNumber: bigint, chainId: number) {
    const isNew = await this.deduplicate(txHash, logIndex, chainId, 'ActionExecuted', blockNumber);
    if (!isNew) return;

    const lowerActionId = actionId.toLowerCase();
    const lowerVersionId = versionId.toLowerCase();

    await prisma.corporateAction.updateMany({
      where: { actionId: lowerActionId },
      data: { status: 'EXECUTED' }
    });

    await prisma.actionVersion.updateMany({
      where: { versionId: lowerVersionId },
      data: { status: 'EXECUTED' }
    });

    await prisma.auditLog.create({
      data: {
        eventType: 'ACTION_EXECUTED',
        actionId: lowerActionId,
        versionId: lowerVersionId,
        actor: executor.toLowerCase(),
        details: JSON.stringify({ actionId: lowerActionId, versionId: lowerVersionId, executor }),
        transactionHash: txHash.toLowerCase(),
        blockNumber
      }
    });
  }

  // 6. Handle ActionCancelled
  async handleActionCancelled(actionId: string, versionId: string, txHash: string, logIndex: number, blockNumber: bigint, chainId: number) {
    const isNew = await this.deduplicate(txHash, logIndex, chainId, 'ActionCancelled', blockNumber);
    if (!isNew) return;

    const lowerActionId = actionId.toLowerCase();
    const lowerVersionId = versionId.toLowerCase();

    await prisma.corporateAction.updateMany({
      where: { actionId: lowerActionId },
      data: { status: 'CANCELLED' }
    });

    await prisma.actionVersion.updateMany({
      where: { versionId: lowerVersionId },
      data: { status: 'CANCELLED' }
    });

    await prisma.auditLog.create({
      data: {
        eventType: 'ACTION_CANCELLED',
        actionId: lowerActionId,
        versionId: lowerVersionId,
        details: JSON.stringify({ actionId: lowerActionId, versionId: lowerVersionId }),
        transactionHash: txHash.toLowerCase(),
        blockNumber
      }
    });
  }

  // 7. Handle HolderPaid (Coupon)
  async handleHolderPaid(actionId: string, versionId: string, holder: string, assetBal: bigint, paymentAmount: bigint, txHash: string, logIndex: number, blockNumber: bigint, chainId: number) {
    const isNew = await this.deduplicate(txHash, logIndex, chainId, 'HolderPaid', blockNumber);
    if (!isNew) return;

    const lowerActionId = actionId.toLowerCase();
    const lowerVersionId = versionId.toLowerCase();
    const lowerHolder = holder.toLowerCase();

    await prisma.paymentEvent.create({
      data: {
        actionId: lowerActionId,
        versionId: lowerVersionId,
        holderAddress: lowerHolder,
        amount: paymentAmount.toString(),
        amountDisplay: formatEther(paymentAmount),
        assetBalance: assetBal.toString(),
        transactionHash: txHash.toLowerCase(),
        blockNumber
      }
    });

    await prisma.auditLog.create({
      data: {
        eventType: 'HOLDER_PAID',
        actionId: lowerActionId,
        versionId: lowerVersionId,
        actor: lowerHolder,
        details: JSON.stringify({ holder: lowerHolder, assetBalance: assetBal.toString(), paymentAmount: paymentAmount.toString() }),
        transactionHash: txHash.toLowerCase(),
        blockNumber
      }
    });
  }

  // 8. Handle HolderRedeemed (Principal + Burn)
  async handleHolderRedeemed(actionId: string, versionId: string, holder: string, tokenAmount: bigint, principalAmount: bigint, txHash: string, logIndex: number, blockNumber: bigint, chainId: number) {
    const isNew = await this.deduplicate(txHash, logIndex, chainId, 'HolderRedeemed', blockNumber);
    if (!isNew) return;

    const lowerActionId = actionId.toLowerCase();
    const lowerVersionId = versionId.toLowerCase();
    const lowerHolder = holder.toLowerCase();

    await prisma.redemptionEvent.create({
      data: {
        actionId: lowerActionId,
        versionId: lowerVersionId,
        holderAddress: lowerHolder,
        tokensBurned: tokenAmount.toString(),
        principalAmount: principalAmount.toString(),
        transactionHash: txHash.toLowerCase(),
        blockNumber
      }
    });

    await prisma.auditLog.create({
      data: {
        eventType: 'HOLDER_REDEEMED',
        actionId: lowerActionId,
        versionId: lowerVersionId,
        actor: lowerHolder,
        details: JSON.stringify({ holder: lowerHolder, tokensBurned: tokenAmount.toString(), principalAmount: principalAmount.toString() }),
        transactionHash: txHash.toLowerCase(),
        blockNumber
      }
    });
  }
}
