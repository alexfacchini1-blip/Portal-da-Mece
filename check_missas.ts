
import db from './src/database';

async function run() {
  await db.read();
  console.log('--- MISSAS TEMPORARIAS ---');
  console.log('Quantidade:', db.data.missasTemporarias?.length);
  console.log('Missas:', JSON.stringify(db.data.missasTemporarias, null, 2));
}

run().catch(console.error);
