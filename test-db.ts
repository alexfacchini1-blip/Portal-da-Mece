import fs from 'fs';
const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
const disp = db.disponibilidade || [];
const rita = disp.filter(d => d.paroquia === "Paróquia Santa Rita de Cássia");
console.log(`Santa Rita has ${rita.length} disponibilidades submitted.`);
if (rita.length > 0) {
  console.log("Dates submitted:");
  console.log(rita.map(r => r.disponibilidade.map(slot => slot.data).join(', ')).slice(0, 3));
}
