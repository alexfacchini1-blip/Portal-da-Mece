
import fs from 'fs';
import db from './src/database';

async function restore() {
  console.log('Iniciando restauração do backup...');
  try {
    const backupData = JSON.parse(fs.readFileSync('backup_sistema_2026-04-02.json', 'utf8'));
    
    await db.read();
    console.log(`Estado atual no Firestore: ${db.data.ministros?.length || 0} ministros.`);
    
    // Merge or Overwrite? Overwrite is safer to ensure it works exactly like the backup
    db.data = backupData;
    
    await db.write();
    console.log('Restauração concluída com sucesso!');
    console.log(`Novo estado no Firestore: ${db.data.ministros?.length || 0} ministros.`);
  } catch (error) {
    console.error('Erro na restauração:', error);
  }
}

restore().catch(console.error);
