import db from './src/database.ts';

async function checkAndFix() {
  await db.read();
  
  if (!db.data.escalaGerada) {
    console.log('escalaGerada nao encontrado');
    return;
  }

  const escala = db.data.escalaGerada;
  
  // Sábado, 6 de junho
  if (escala['2026-06-06'] && escala['2026-06-06']['17:00']) {
      console.log('Sábado 17:00:', escala['2026-06-06']['17:00'].ministros);
      // The requirement: Valter e Sônia should be Sônia
      escala['2026-06-06']['17:00'].ministros = ['Sônia', 'Teresa', 'Natanael e Zildene', 'Maurício e Juliana'];
  }

  await db.write();
  console.log('Fix applied.');
}

checkAndFix().catch(console.error);
