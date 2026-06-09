
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function listUsers() {
  const docRef = doc(db, 'app_data', 'main_db');
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    const users = data.ministros.map(m => ({ 
      nome: m.nome, 
      paroquia: m.paroquia, 
      excecaoAcessoAte: m.excecaoAcessoAte 
    }));
    console.log(JSON.stringify(users, null, 2));
  }
}

listUsers().catch(console.error);
