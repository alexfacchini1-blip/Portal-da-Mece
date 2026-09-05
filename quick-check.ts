import db from './src/database';

async function check() {
  await db.read();
  console.log('ADMIN_PASSWORD:', db.data?.config?.adminPassword);
  console.log('MAINTENANCE_MODE:', db.data?.config?.modoManutencao);
  console.log('PAROQUIAS_COUNT:', db.data?.paroquias?.length);
}

check().catch(console.error);
