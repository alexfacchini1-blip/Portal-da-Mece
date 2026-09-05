import 'dotenv/config';
import db, { setupDatabase } from './src/database';

async function main() {
  await setupDatabase();
  console.log("=== ESCALA GERADA ===");
  console.log(JSON.stringify(db.data.escalaGerada, null, 2));
}

main().catch(console.error);
