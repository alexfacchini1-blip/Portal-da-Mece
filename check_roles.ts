
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkRoles() {
  const docRef = doc(db, 'app_data', 'main_db');
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    console.log('--- ALL MINISTERS ---');
    data.ministros.forEach(m => {
        console.log(`Nome: ${m.nome}, Role: ${m.role}`);
    });
    console.log('--- END ALL MINISTERS ---');
  } else {
    console.log('No such document!');
  }
}

checkRoles().catch(console.error);
