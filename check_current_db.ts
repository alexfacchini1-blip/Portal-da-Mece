
import db from './src/database';
async function run() {
  await db.read();
  console.log('--- DATABASE CHECK ---');
  console.log('Trocas Count:', db.data?.trocas?.length);
  console.log('Trocas:', JSON.stringify(db.data?.trocas, null, 2));
}
run();
