
import Dexie, { Table } from 'dexie';
import type { Feeding, Diaper, Sleep, Growth, Med, BabyProfile } from './types';

export class BabyDB extends Dexie {
  feedings!: Table<Feeding, number>;
  diapers!: Table<Diaper, number>;
  sleeps!: Table<Sleep, number>;
  growth!: Table<Growth, number>;
  meds!: Table<Med, number>;
  baby!: Table<BabyProfile, number>;

  constructor() {
    super('selin-baby-db');
    this.version(1).stores({
      feedings: '++id, datetime, method',
      diapers: '++id, datetime, type',
      sleeps: '++id, start, end',
      growth: '++id, datetime',
      meds: '++id, datetime, name',
      baby: '++id, name, birthIso'
    });
  }
}

export const db = new BabyDB();
