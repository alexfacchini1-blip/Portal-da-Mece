
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkUser() {
  const docRef = doc(db, 'app_data', 'main_db');
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    const user = data.ministros.find(m => m.telefone === '14981145657' || m.email === 'alex.facchini1@gmail.com');
    console.log('--- USER ---');
    console.log(JSON.stringify(user, null, 2));
    console.log('--- END USER ---');
  } else {
    console.log('No such document!');
  }
}

checkUser().catch(console.error);
