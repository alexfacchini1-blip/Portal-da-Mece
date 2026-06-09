import db from './src/database.ts';

async function run() {
  await db.read();
  const missas = db.data.missasTemporarias || [];
  const missas1 = missas.filter(m => m.paroquia === 'Paróquia Santa Rita de Cássia');
  const missas2 = missas.filter(m => m.paroquia === 'Paróquia São Cristóvão');
  
  console.log("=== Santa Rita ===");
  console.log(JSON.stringify(missas1, null, 2));

  console.log("=== São Cristóvão ===");
  console.log(JSON.stringify(missas2, null, 2));
}

run();
