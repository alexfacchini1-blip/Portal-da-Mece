import db, { setupDatabase } from './src/database';

async function run() {
  await setupDatabase();
  await db.read();
  const found = db.data?.ministros?.filter((m: any) => 
    (m.nome && m.nome.toLowerCase().includes('alex')) || 
    (m.telefone && m.telefone.includes('99786')) || 
    (m.telefoneConjuge && m.telefoneConjuge.includes('99786'))
  );
  console.log("Found matches:", JSON.stringify(found, null, 2));
  process.exit(0);
}

run();
