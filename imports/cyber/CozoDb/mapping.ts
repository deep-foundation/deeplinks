import { LsResult } from 'ipfs-core-types/src/pin';
import { dateToNumber } from '../utils/date';
import { NeuronAddress, ParticleCid, TransactionHash } from '../types/base';
import { IPFSContent } from '../ipfs/ipfs';
import { PinTypeMap } from './types/entities';
import { Transaction } from '../backend/services/dataSource/blockchain/types';
import { LinkDto, ParticleDto, PinDto, TransactionDto } from './types/dto';

export const mapParticleToEntity = (particle: IPFSContent): ParticleDto => {
  const { cid, result, meta, textPreview } = particle;
  const { size, mime, type, blocks, sizeLocal } = meta;
  // hack to fix string command
  const text = textPreview?.replace(/"/g, "'") || '';
  return {
    cid,
    // @ts-ignore
    size: size || 0,
    mime: mime || 'unknown',
    // @ts-ignore
    type,
    text,
    size_local: sizeLocal || -1,
    blocks: blocks || 0,
  };
};

//TODO: REFACTOR
export const mapPinToEntity = (pin: LsResult): PinDto => ({
  cid: pin.cid.toString(),
  type: PinTypeMap[pin.type],
});

export const mapTransactionToEntity = (
  neuron: string,
  tx: Transaction
): TransactionDto => {
  const {
    transaction_hash,
    transaction: {
      memo,
      block: { timestamp },
      success,
    },
    type,
    value,
  } = tx;
  return {
    hash: transaction_hash,
    type,
    timestamp: dateToNumber(timestamp),
    // value: JSON.stringify(value),
    memo,
    // @ts-ignore
    value,
    success,
    neuron,
  };
};

// export const mapSyncStatusToEntity = (
//   id: NeuronAddress | ParticleCid,
//   entryType: EntryType,
//   unreadCount: number,
//   timestampUpdate: number,
//   lastId: TransactionHash | ParticleCid = '',
//   timestampRead: number = timestampUpdate,
//   meta: Object = {}
// ): SyncStatusDbEntity => {
//   return {
//     entry_type: entryType,
//     id,
//     timestamp_update: timestampUpdate,
//     timestamp_read: timestampRead,
//     unread_count: unreadCount,
//     disabled: false,
//     last_id: lastId,
//     meta,
//   };
// };

export const mapLinkToEntity = (
  from: ParticleCid,
  to: ParticleCid,
  neuron: NeuronAddress = '',
  timestamp: number = 0
): LinkDto => ({
  from,
  to,
  neuron,
  timestamp,
} as any);
