import 'dotenv/config';
import db, { setupDatabase } from './src/database';

async function main() {
  await setupDatabase();
  console.log("=== ALL MINISTROS WITH isTesoureiro ===");
  const tesoureiros = db.data.ministros.filter(m => m.isTesoureiro);
  console.log(JSON.stringify(tesoureiros, null, 2));

  console.log("\n=== DISPONIBILIDADES FOR TESOUREIROS ===");
  for (const t of tesoureiros) {
    const d = db.data.disponibilidades.filter(disp => String(disp.ministro_id) === String(t.id));
    console.log(`User: ${t.nome} (ID ${t.id}) has ${d.length} disponibilidades`);
  }

  console.log("\n=== ALL DISPONIBILIDADES COUNT ===");
  console.log(`Total: ${db.data.disponibilidades.length}`);
}

main().catch(console.error);
