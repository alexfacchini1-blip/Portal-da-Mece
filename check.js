import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function check() {
  const docRef = doc(db, 'app_data', 'main_db');
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();
  const disps = data.disponibilidades.filter(d => String(d.ministro_id) === '25');
  console.log(disps);
}
check();
