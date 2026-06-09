import fs from "fs";

try {
  const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
  console.log("Paróquia Santa Rita de Cássia dates:", Object.keys(db.escalaGerada?.['Paróquia Santa Rita de Cássia'] || {}));
  console.log("Paróquia São Cristóvão dates:", Object.keys(db.escalaGerada?.['Paróquia São Cristóvão'] || {}));
  console.log("Config escalaPublicadaPorMes:", JSON.stringify(db.config?.escalaPublicadaPorMes, null, 2));
} catch (e) {
  console.error("Error reading db.json:", e);
}
