
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
    const user = data.ministros.find(m => m.nome.includes('Alexandre') && m.nome.includes('Facchini'));
    console.log(JSON.stringify(user, null, 2));
  } else {
    console.log('No such document!');
  }
}

checkUser().catch(console.error);
