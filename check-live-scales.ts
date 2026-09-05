import db, { setupDatabase } from './src/database';

async function run() {
  await setupDatabase();
  await db.read();
  
  const alex = db.data.ministros?.find((m: any) => m.email === 'alex.facchini1@gmail.com');
  console.log('User Alex:', alex);
  
  const parishes = db.data.paroquias || [];
  console.log('Paróquias list:', parishes);
  
  const escalaSantaRita = db.data.escalaGerada?.['Paróquia Santa Rita de Cássia'] || {};
  const dates = Object.keys(escalaSantaRita).filter(k => k.startsWith('2026-07'));
  console.log('July 2026 dates in Paróquia Santa Rita de Cássia:', dates);
  if (dates.length > 0) {
    console.log('Sample day in July:', JSON.stringify(escalaSantaRita[dates[0]], null, 2));
  }
}
run();

