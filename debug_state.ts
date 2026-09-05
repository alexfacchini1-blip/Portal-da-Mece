
import db from './src/database';
async function run() {
  await db.read();
  console.log('Total de ministros:', db.data?.ministros?.length);
  console.log('Primeiros 3 ministros:', db.data?.ministros?.slice(0, 3).map(m => m.nome));
  console.log('Admin Password:', db.data?.config?.adminPassword);
}
run();
