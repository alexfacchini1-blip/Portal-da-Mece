
import db from './src/database';
async function run() {
  await db.read();
  console.log('--- ESTADO ATUAL DO BANCO ---');
  console.log('Total de Ministros:', db.data?.ministros?.length);
  console.log('Total de Paróquias:', db.data?.paroquias?.length);
  console.log('Admin Password:', db.data?.config?.adminPassword);
  if (db.data?.ministros?.length > 0) {
    console.log('Exemplos de Ministros (5):');
    console.log(db.data.ministros.slice(0, 5).map(m => `${m.nome} (${m.telefone})`));
  }
}
run();
