import 'dotenv/config';
import db, { setupDatabase } from './src/database';

async function main() {
  await setupDatabase();
  console.log('Database loaded.');
  
  if (!db.data || !db.data.ministros) {
    console.log('No ministros found.');
    return;
  }
  
  const ministros = db.data.ministros;
  const found = ministros.filter(m => {
    const name = (m.nome || '').toLowerCase();
    const conj = (m.nomeConjuge || '').toLowerCase();
    return name.includes('shyrlei') || conj.includes('shyrlei');
  });

  if (found.length > 0) {
    console.log('Found Shyrlei:', JSON.stringify(found, null, 2));
  } else {
    console.log('No record found containing the name "Shyrlei".');
  }
}

main().catch(console.error);
