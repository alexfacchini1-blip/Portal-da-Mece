import db from './src/database.ts';

async function run() {
  await db.read();
  const missas = db.data.missasTemporarias || [];
  const missasDaParoquia = missas.filter(m => {
     const p = m.paroquia ? m.paroquia.trim() : '';
     // check if the paroquia name contains '44' or something to find the missa
     return p.includes('44');
  });
  console.log("Filtered length:", missasDaParoquia.length);
  console.log(JSON.stringify(missasDaParoquia.slice(0, 3), null, 2));

  // let's print ALL unique paroquias inside missas
  const paroquias = [...new Set(missas.map(m => m.paroquia))];
  console.log("All unique paroquias in missasTemporarias:", paroquias);
}

run();
