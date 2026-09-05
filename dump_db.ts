
import db from './src/database';

async function dump() {
  await db.read();
  console.log('--- MINISTROS ---');
  console.log(JSON.stringify(db.data.ministros, null, 2));
  console.log('--- ADMIN PASSWORD ---');
  console.log(db.data.config?.adminPassword);
}

dump().catch(console.error);
