import db from './src/database';
async function run() {
  await db.read();
  console.log('--- COORDINATORS IN DATABASE ---');
  const coordinators = db.data?.ministros?.filter(m => m.role === 'coordenacao');
  if (coordinators) {
    coordinators.forEach(c => {
      console.log(`Nome: ${c.nome} | Tipo: ${c.tipo} | Telefone: ${c.telefone} | Senha: "${c.senha}" | SenhaConjuge: "${c.senhaConjuge}" | Paroquia: ${c.paroquia}`);
    });
  } else {
    console.log('No coordinators found.');
  }
}
run();
