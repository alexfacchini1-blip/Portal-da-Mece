import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Adaptador para facilitar operações de leitura e escrita no Firestore com cache e debouncing.
 */
export class FirestoreAdapter<T> {
  private collectionName: string;
  private docId: string;

  constructor(collectionName: string, docId: string) {
    this.collectionName = collectionName;
    this.docId = docId;
  }

  private get docRef() {
    if (!db) return null;
    return doc(db, this.collectionName, this.docId);
  }

  private cachedData: T | null = null;
  private lastReadTime: number = 0;
  private CACHE_DURATION = 30000; // 30 segundos de cache

  async read(force: boolean = false): Promise<T | null> {
    if (!this.docRef) return null;
    
    // Retorna dados do cache se válidos e não forçado
    const now = Date.now();
    if (!force && this.cachedData && (now - this.lastReadTime < this.CACHE_DURATION)) {
      return this.cachedData;
    }

    let timeoutId: any;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Firestore read timeout')), 10000);
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
      
      // Se houver cache, retorna mesmo expirado em caso de erro de rede
      if (this.cachedData) {
        console.warn("Retornando dados cacheados expirados devido a erro no Firestore.");
        return this.cachedData;
      }
      throw error;
    }
  }

  private writeTimeoutId: any = null;
  private pendingWriteData: T | null = null;

  async write(data: T): Promise<void> {
    if (!this.docRef) return;
    
    // Atualiza cache imediatamente
    this.cachedData = JSON.parse(JSON.stringify(data)); // Cópia profunda
    this.lastReadTime = Date.now();
    this.pendingWriteData = data;

    if (this.writeTimeoutId) {
      clearTimeout(this.writeTimeoutId);
    }

    return new Promise((resolve, reject) => {
      this.writeTimeoutId = setTimeout(async () => {
        if (!this.pendingWriteData || !this.docRef) {
          resolve();
          return;
        }

        const dataToWrite = this.pendingWriteData;
        this.pendingWriteData = null;

        let retries = 3;
        let delay = 1000;

        while (retries > 0) {
          let timeoutId: any;
          try {
            const cleanData = this.sanitizeForFirestore(dataToWrite);
            
            const timeoutPromise = new Promise<void>((_, rej) => {
              timeoutId = setTimeout(() => rej(new Error('Firestore write timeout')), 8000);
            });
            
            await Promise.race([
              setDoc(this.docRef, cleanData),
              timeoutPromise
            ]);

            if (timeoutId) clearTimeout(timeoutId);
            resolve();
            return;
          } catch (error: any) {
            if (timeoutId) clearTimeout(timeoutId);
            const isResourceExhausted = error?.code === 'resource-exhausted' || error?.message?.includes('RESOURCE_EXHAUSTED');
            
            if (isResourceExhausted && retries > 1) {
              console.warn(`Firestore resource exhausted. Tentando novamente em ${delay}ms... (${retries} tentativas restantes)`);
              await new Promise(res => setTimeout(res, delay));
              delay *= 2;
              retries--;
            } else {
              console.error("Erro ao escrever no Firestore:", error);
              reject(error);
              return;
            }
          }
        }
        reject(new Error('Falha na escrita do Firestore após tentativas devido a exaustão de recursos'));
      }, 1500); // 1.5s debounce
    });
  }

  private sanitizeForFirestore(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }

    if (typeof obj === 'number') {
      if (isNaN(obj) || !isFinite(obj)) {
        return null;
      }
      return obj;
    }

    if (typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
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
