import db from './src/database';
async function run() {
  await db.read();
  const escalas = db.data.escalaGerada || {};
  console.log('--- ALL LEADERS FOUND ---');
  for (const [paroquia, dates] of Object.entries(escalas)) {
    for (const [date, hours] of Object.entries(dates as any)) {
      for (const [hour, missa] of Object.entries(hours as any)) {
        if ((missa as any).lider) {
          console.log(`Paroquia: ${paroquia}, Date: ${date}, Hour: ${hour}, Lider: ${(missa as any).lider}, Ministros: ${JSON.stringify((missa as any).ministros)}`);
        }
      }
    }
  }
}
run();
