import 'dotenv/config';
import db, { setupDatabase } from './src/database';

async function main() {
  await setupDatabase();
  console.log("=== TREASURERS ===");
  if (!db.data || !db.data.ministros) {
    console.log("No data or ministros list empty");
    return;
  }
  for (const m of db.data.ministros) {
    if (m.isTesoureiro) {
      console.log(`ID: ${m.id}, Nome: "${m.nome}", NomeExib: "${m.nomeExibicao || ''}", Tel: "${m.telefone}", Senha: "${m.senha}", Aprovado: ${m.aprovado}, Role: "${m.role}", isTesoureiro: ${m.isTesoureiro}, tipo: "${m.tipo || ''}"`);
    }
  }
}

main().catch(console.error);
