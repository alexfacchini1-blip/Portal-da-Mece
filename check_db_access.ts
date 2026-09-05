import db from './src/database';

async function check() {
  await db.read();
  console.log("Paróquias atuais:", db.data?.paroquias?.length);
  process.exit(0);
}

check();
