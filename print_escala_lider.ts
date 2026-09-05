import fs from 'fs';
import db from './src/database';

async function run() {
  await db.read();
  let output = '=== PAROQUIA SANTA RITA DE CASSIA SCHEDULE ===\n';
  const paroquia = 'Paróquia Santa Rita de Cássia';
  const escala = db.data.escalaGerada?.[paroquia] || {};
  
  for (const [date, hours] of Object.entries(escala)) {
    output += `Date: ${date}\n`;
    for (const [hour, missa] of Object.entries(hours as any)) {
      output += `  Hour: ${hour} | Missa: ${(missa as any).nome} | Lider: ${(missa as any).lider} | Ministros: ${JSON.stringify((missa as any).ministros)}\n`;
    }
  }
  
  fs.writeFileSync('lider_report.txt', output);
  console.log('Report written to lider_report.txt');
}
run();
