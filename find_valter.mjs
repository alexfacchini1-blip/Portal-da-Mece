import fs from 'fs';
import db from './src/database.js';

const targetParoquia = 'Paróquia Santa Rita de Cássia';

async function verify() {
  await db.read();
  const ministros = db.data.ministros.filter(m => m.paroquia === targetParoquia && m.aprovado);
  const valter = ministros.find(m => (m.nome && m.nome.includes('Valter')) || (m.nomeConjuge && m.nomeConjuge.includes('Valter')));
  console.log("Valter:", valter);
}

verify();
