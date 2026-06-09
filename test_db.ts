import db from './src/database.ts';

async function run() {
  await db.read();
  const missas = db.data.missasTemporarias || [];
  const missasDaParoquia = missas.filter(m => {
     const p = m.paroquia ? m.paroquia.trim() : '';
     return p.indexOf('44.454.312/0027-80') !== -1;
  });
  console.log(JSON.stringify(missasDaParoquia, null, 2));
}

run();
