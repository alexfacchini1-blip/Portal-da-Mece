import db from './src/database.ts';

async function run() {
  await db.read();
  const ministros = db.data.ministros || [];
  const coords = ministros.filter(m => {
     const p = m.paroquia ? m.paroquia.trim() : '';
     return p.includes('44.454') || p.includes('44454') || p.includes('0027-80') || p.includes('002780');
  });
  console.log("Found coords:", coords.length);
  coords.forEach(c => {
    console.log(c.nome, c.telefone, c.paroquia);
  });
}

run();
