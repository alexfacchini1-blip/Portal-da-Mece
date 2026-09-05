import { setupDatabase } from './src/database';
import db from './src/database';

async function main() {
  await setupDatabase();
  console.log('--- MISSAS TEMPORARIAS ---');
  console.log(JSON.stringify(db.data?.missasTemporarias || [], null, 2));
  process.exit(0);
}

main().catch(console.error);
