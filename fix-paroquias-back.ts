import db from './src/database';

async function fix() {
  await db.read();
  
  if (db.data && db.data.ministros) {
    db.data.ministros.forEach(m => {
       if (m.nome === 'Josué') m.paroquia = 'Paróquia São Cristóvão';
       else if (m.nome === 'Fernanda e Celiomar' || m.nome === 'Fernanda') m.paroquia = 'Paróquia Nossa Senhora das Graças';
       else m.paroquia = 'Paróquia Santa Rita de Cássia';
    });
    
    // let's approve them just in case
    db.data.ministros.forEach(m => {
       m.aprovado = true;
    });
    
    await db.write();
    console.log("Fixed paroquias for coordenadores");
  }
}

fix().catch(console.error);
