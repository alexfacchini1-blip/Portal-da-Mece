
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkConfig() {
  const docRef = doc(db, 'app_data', 'main_db');
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    console.log('--- CONFIG ---');
    console.log(JSON.stringify(data.config, null, 2));
    console.log('--- END CONFIG ---');
  } else {
    console.log('No such document!');
  }
}

checkConfig().catch(console.error);
