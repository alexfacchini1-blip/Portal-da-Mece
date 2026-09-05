
import db from './src/database';
async function recovery() {
  await db.read();
  if (!db.data.ministros) db.data.ministros = [];
  
  // Find or create Alexandre
  let alex = db.data.ministros.find(m => m.nome === 'Alexandre');
  if (!alex) {
    alex = { id: 1, nome: 'Alexandre', telefone: '(14) 99786-5806', senha: '888', role: 'coordenacao', aprovado: true, paroquia: 'Paróquia Santa Rita de Cássia', tipo: 'casal' } as any;
    db.data.ministros.push(alex!);
  } else {
    alex.telefone = '(14) 99786-5806';
    alex.senha = '888';
    alex.role = 'coordenacao';
    alex.aprovado = true;
  }

  if (!db.data.config) db.data.config = {} as any;
  db.data.config!.adminPassword = 'Aqamnsqa081%';
  
  await db.write();
  console.log('Recovery complete for Alexandre and Admin');
}
recovery();
