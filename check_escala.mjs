import db from './src/database.ts';

async function checkEscala() {
  await db.read();
  
  if (!db.data.escalaGerada) {
    console.log('escalaGerada nao encontrado');
    return;
  }

  const escala = db.data.escalaGerada;
  
  // Sábado, 6 de junho
  if (escala['2026-06-06'] && escala['2026-06-06']['17:00']) {
      console.log('Sábado 17:00 ministros:', escala['2026-06-06']['17:00'].ministros);
  } else {
      console.log('Sábado nao encontrado');
  }

  // Domingo, 7 de junho
  if (escala['2026-06-07'] && escala['2026-06-07']['10:00']) {
      console.log('Domingo 10:00 ministros:', escala['2026-06-07']['10:00'].ministros);
  } else {
      console.log('Domingo nao encontrado');
  }
}

checkEscala().catch(console.error);
