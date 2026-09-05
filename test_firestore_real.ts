import db, { setupDatabase } from './src/database';
async function test() {
  await setupDatabase();
  await db.read();
  console.log("Ministros count:", db.data?.ministros?.length);
  console.log("Paroquias count:", db.data?.paroquias?.length);
  console.log("Paroquias data:", JSON.stringify(db.data?.paroquias, null, 2));
  process.exit(0);
}
test();
