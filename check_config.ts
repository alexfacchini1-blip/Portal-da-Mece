
import db from './src/database';

async function checkConfig() {
  await db.read();
  console.log('Config:', JSON.stringify(db.data.config, null, 2));
}

checkConfig().catch(console.error);
