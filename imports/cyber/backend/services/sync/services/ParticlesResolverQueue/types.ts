import { SyncQueueDto } from '../../../../../CozoDb/types/dto';

export type SyncQueueItem = Omit<SyncQueueDto, 'status'> & {
  status?: SyncQueueDto['status'];
};
