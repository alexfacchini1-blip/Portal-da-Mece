import fs from 'fs';
import db from './src/database';

async function run() {
  await db.read();
  let found = [];
  const escalas = db.data.escalaGerada || {};
  
  for (const [paroquia, dates] of Object.entries(escalas)) {
    for (const [date, hours] of Object.entries(dates as any)) {
      for (const [hour, missa] of Object.entries(hours as any)) {
        const mList = (missa as any).ministros || [];
        const isMin = mList.some((m: string) => m.toLowerCase().includes('teste'));
        const isLid = (missa as any).lider && (missa as any).lider.toLowerCase().includes('teste');
        if (isMin || isLid) {
          found.push({ paroquia, date, hour, lider: (missa as any).lider, ministros: mList });
        }
      }
    }
  }
  
  fs.writeFileSync('teste_search_result.txt', JSON.stringify(found, null, 2));
  console.log('Search results written to teste_search_result.txt. Count:', found.length);
}
run();
