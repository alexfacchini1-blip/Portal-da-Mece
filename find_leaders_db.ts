import fs from 'fs';
import db from './src/database';

async function run() {
  await db.read();
  const leaders = db.data.ministros.filter(m => m.isLider || m.isLiderConjuge);
  
  const report = leaders.map(m => ({
    id: m.id,
    nome: m.nome,
    nomeExibicao: m.nomeExibicao,
    nomeConjuge: m.nomeConjuge,
    nomeExibicaoConjuge: m.nomeExibicaoConjuge,
    isLider: m.isLider,
    isLiderConjuge: m.isLiderConjuge
  }));
  
  fs.writeFileSync('leaders_db.txt', JSON.stringify(report, null, 2));
}
run();
