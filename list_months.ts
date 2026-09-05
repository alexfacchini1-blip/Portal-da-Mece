import fs from 'fs';
import db from './src/database';

async function run() {
  await db.read();
  const list = [];
  const escalas = db.data.escalaGerada || {};
  for (const [paroquia, dates] of Object.entries(escalas)) {
    const datesList = Object.keys(dates as any);
    list.push({ paroquia, datesCount: datesList.length, sampleDates: datesList.slice(0, 5) });
  }
  fs.writeFileSync('months.txt', JSON.stringify(list, null, 2));
}
run();
