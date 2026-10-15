import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Inicializa o Firebase com as configurações do arquivo JSON provisionado
const app = initializeApp(firebaseConfig);

/**
 * Instância do Firestore configurada para usar o banco de dados específico.
 * CRÍTICO: O uso de firebaseConfig.firestoreDatabaseId é essencial para conectar ao banco correto.
 */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

/**
 * Instância do Firebase Auth para autenticação de usuários.
 */
export const auth = getAuth(app);
