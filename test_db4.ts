import db from './src/database.ts';

async function run() {
  await db.read();
  const coords = (db.data.ministros || []).filter(m => m.role === 'coordenador' || m.role === 'admin' || m.role === 'coordenacao');
  console.log("Coordenadores:");
  coords.forEach(c => {
    console.log(c.nome, c.paroquia);
  });
}

run();
