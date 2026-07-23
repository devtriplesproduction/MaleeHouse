import { Database } from './src/types/database.types';

type Tables = Database['public']['Tables'];

const result: any = {};
// We can't iterate types at runtime in TS easily without a transformer.
