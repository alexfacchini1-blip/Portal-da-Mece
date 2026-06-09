import db from './src/database.ts';

async function fixEscala() {
  await db.read();
  
  if (!db.data.escalaGerada) {
    console.log('escalaGerada nao encontrado');
    return;
  }

  const escala = db.data.escalaGerada;
  
  // Sábado, 6 de junho
  if (escala['2026-06-06'] && escala['2026-06-06']['17:00']) {
      const slot = escala['2026-06-06']['17:00'];
      console.log('Antes Sábado:', slot.ministros);
      // Remove Valter e Sônia, coloca Sônia
      slot.ministros = slot.ministros.map(m => m === 'Valter e Sônia' ? 'Sônia' : m);
      console.log('Depois Sábado:', slot.ministros);
  }

  // Domingo, 7 de junho
  if (escala['2026-06-07'] && escala['2026-06-07']['10:00']) {
      const slot = escala['2026-06-07']['10:00'];
      console.log('Antes Domingo:', slot.ministros);
      // Remove Sônia, coloca Cristiane
      slot.ministros = slot.ministros.map(m => m === 'Sônia' ? 'Cristiane' : m);
      console.log('Depois Domingo:', slot.ministros);
  }
  
  await db.write();
  console.log('Escala corrigida com sucesso.');
}

fixEscala().catch(console.error);
