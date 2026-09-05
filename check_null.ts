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
  let hasNull = false;
  
  ministros.forEach((m, idx) => {
    if (!m) {
      console.log(`Minister record at index ${idx} is null/undefined!`);
      hasNull = true;
      return;
    }
    if (m.nome === null || m.nome === undefined) {
      console.log(`Minister ID ${m.id} has null/undefined name!`, m);
      hasNull = true;
    }
    if (m.paroquia === null || m.paroquia === undefined) {
      console.log(`Minister ID ${m.id} has null/undefined paroquia!`, m);
      hasNull = true;
    }
  });

  if (!hasNull) {
    console.log('No null names or fields found in ministros list.');
  }
}

main().catch(console.error);
