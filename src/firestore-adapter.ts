import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import config from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || config.apiKey,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || config.authDomain,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || config.projectId,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || config.storageBucket,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || config.messagingSenderId,
  appId: process.env.VITE_FIREBASE_APP_ID || config.appId
};

// Verifica se as variáveis de ambiente estão presentes
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("AVISO: Variáveis de ambiente do Firebase (VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID) não encontradas. O Firestore pode não funcionar corretamente.");
}

let app: any;
let firestore: any;

function getFirestoreInstance() {
  if (!firestore) {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.warn("Configuração do Firebase incompleta. Firestore não será inicializado.");
      return null;
    }
    app = initializeApp(firebaseConfig);
    firestore = getFirestore(app, config.firestoreDatabaseId || '(default)');
  }
  return firestore;
}

export class FirestoreAdapter<T> {
  private collectionName: string;
  private docId: string;

  constructor(collectionName: string, docId: string) {
    this.collectionName = collectionName;
    this.docId = docId;
  }

  private get docRef() {
    const db = getFirestoreInstance();
    if (!db) return null;
    return doc(db, this.collectionName, this.docId);
  }

  private cachedData: T | null = null;
  private lastReadTime: number = 0;
  private CACHE_DURATION = 10000; // 10 seconds cache

  async read(force: boolean = false): Promise<T | null> {
    if (!this.docRef) return null;
    
    // Return cached data if valid and not forced
    const now = Date.now();
    if (!force && this.cachedData && (now - this.lastReadTime < this.CACHE_DURATION)) {
      return this.cachedData;
    }

    let timeoutId: NodeJS.Timeout | undefined;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Firestore read timeout')), 5000);
      });
      
      const snapshot = await Promise.race([
        getDoc(this.docRef),
        timeoutPromise
      ]) as any;
      
      if (timeoutId) clearTimeout(timeoutId);

      if (snapshot.exists()) {
        this.cachedData = snapshot.data() as T;
        this.lastReadTime = Date.now();
        return this.cachedData;
      }
      return null;
    } catch (error: any) {
      if (timeoutId) clearTimeout(timeoutId);
      console.error("ERRO DETALHADO FIRESTORE:", {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // If we have cached data, return it even if expired, instead of throwing if network is down
      if (this.cachedData) {
        console.warn("Retornando dados cacheados expirados devido a erro no Firestore.");
        return this.cachedData;
      }
      throw error;
    }
  }

  async write(data: T): Promise<void> {
    if (!this.docRef) return;
    let timeoutId: NodeJS.Timeout | undefined;
    try {
      // Update cache immediately on write
      this.cachedData = JSON.parse(JSON.stringify(data)); // Deep copy
      this.lastReadTime = Date.now();

      const cleanData = this.sanitizeForFirestore(data);
      
      const timeoutPromise = new Promise<void>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Firestore write timeout')), 5000);
      });
      
      await Promise.race([
        setDoc(this.docRef, cleanData),
        timeoutPromise
      ]);

      if (timeoutId) clearTimeout(timeoutId);
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      console.error("Erro ao escrever no Firestore:", error);
      throw error;
    }
  }

  private sanitizeForFirestore(obj: any): any {
    if (obj === null || obj === undefined) {
      return null; // Convert undefined to null or just return null
    }

    if (typeof obj === 'number') {
      if (isNaN(obj) || !isFinite(obj)) {
        return null; // Firestore doesn't support NaN or Infinity
      }
      return obj;
    }

    if (typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      // Filter out undefined and sanitize elements
      return obj
        .filter(item => item !== undefined)
        .map(item => this.sanitizeForFirestore(item));
    }

    const newObj: any = {};
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (value !== undefined) {
        newObj[key] = this.sanitizeForFirestore(value);
      }
    });
    return newObj;
  }
}
