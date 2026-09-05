import db from './src/database';

async function check() {
  await db.read();
  console.log(JSON.stringify(db.data.ministros, null, 2));
}

check().catch(console.error);
