import db from './src/database';
async function fix() {
  await db.read();
  const missas = db.data.missasTemporarias || [];
  const uniqueMissas = new Map();
  // We should remove duplicate standard missas that don't have IDs
  db.data.missasTemporarias = missas.filter(m => m.id !== 'padrao-sab-17' && m.id !== 'padrao-dom-07');
  await db.write();
}
// wait, I don't need to do this, the merge script is fine.
