import fs from 'fs';
import db from './src/database';

async function run() {
  await db.read();
  const disps = db.data.disponibilidades || [];
  const testeDisps = disps.filter(d => String(d.ministro_id) === '13');
  
  fs.writeFileSync('teste_disps.txt', JSON.stringify(testeDisps, null, 2));
  console.log('Done, count:', testeDisps.length);
}
run();
