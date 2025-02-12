import * as migration_20250212_103304 from './20250212_103304';
import * as migration_seed from './seed';

export const migrations = [
  {
    up: migration_20250212_103304.up,
    down: migration_20250212_103304.down,
    name: '20250212_103304',
  },
  {
    up: migration_seed.up,
    down: migration_seed.down,
    name: 'seed'
  },
];
