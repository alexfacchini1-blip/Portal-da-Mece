import 'dotenv/config';
import db, { setupDatabase } from './src/database';

async function main() {
  await setupDatabase();
  const id = 21;
  const ministro = db.data.ministros.find(m => m.id === id);
  console.log("=== MINISTRO ===");
  console.log(JSON.stringify(ministro, null, 2));

  console.log("\n=== DISPONIBILIDADES ===");
  const disps = db.data.disponibilidades.filter(d => String(d.ministro_id) === String(id));
  console.log(`Total: ${disps.length}`);
  console.log(JSON.stringify(disps, null, 2));

  console.log("\n=== ESCALA GERADA (Keys containing 21) ===");
  const escala = db.data.escalaGerada || {};
  let foundInEscala = [];
  for (const [key, value] of Object.entries(escala)) {
    // If value contains id 21
    if (JSON.stringify(value).includes(String(id))) {
      foundInEscala.push({ key, value });
    }
  }
  console.log(`Encontrado em ${foundInEscala.length} slots da escala`);
  console.log(JSON.stringify(foundInEscala, null, 2));
}

main().catch(console.error);
