var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// server.ts
import "dotenv/config";
import fs from "fs";
import * as cheerio from "cheerio";
import express from "express";

// src/database.ts
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

// src/firestore-adapter.ts
import { doc, getDoc, setDoc } from "firebase/firestore";

// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "escala-de-ministros-81967",
  appId: "1:1065775416098:web:66b50f40feac6fc81b9b7b",
  apiKey: "AIzaSyAYvnSsn1ymMq8NcGHaczAn7BidQydiRlw",
  authDomain: "escala-de-ministros-81967.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-escaladeministro-3af5d63f-0153-45e3-9395-d069594784b4",
  storageBucket: "escala-de-ministros-81967.firebasestorage.app",
  messagingSenderId: "1065775416098",
  measurementId: "",
  oAuthClientId: "1065775416098-ohp7bo4plaolru8hgr04vj9hb4tgsqp4.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

// src/firebase.ts
var app = initializeApp(firebase_applet_config_default);
var db = getFirestore(app, firebase_applet_config_default.firestoreDatabaseId);
var auth = getAuth(app);

// src/firestore-adapter.ts
var FirestoreAdapter = class {
  collectionName;
  docId;
  constructor(collectionName, docId) {
    this.collectionName = collectionName;
    this.docId = docId;
  }
  get docRef() {
    if (!db) return null;
    return doc(db, this.collectionName, this.docId);
  }
  cachedData = null;
  lastReadTime = 0;
  CACHE_DURATION = 3e4;
  // 30 segundos de cache
  async read(force = false) {
    if (!this.docRef) return null;
    const now = Date.now();
    if (!force && this.cachedData && now - this.lastReadTime < this.CACHE_DURATION) {
      return this.cachedData;
    }
    let timeoutId;
    try {
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Firestore read timeout")), 1e4);
      });
      const snapshot = await Promise.race([
        getDoc(this.docRef),
        timeoutPromise
      ]);
      if (timeoutId) clearTimeout(timeoutId);
      if (snapshot.exists()) {
        this.cachedData = snapshot.data();
        this.lastReadTime = Date.now();
        return this.cachedData;
      }
      return null;
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      console.error("ERRO DETALHADO FIRESTORE:", {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      if (this.cachedData) {
        console.warn("Retornando dados cacheados expirados devido a erro no Firestore.");
        return this.cachedData;
      }
      throw error;
    }
  }
  writeTimeoutId = null;
  pendingWriteData = null;
  async write(data) {
    if (!this.docRef) return;
    this.cachedData = JSON.parse(JSON.stringify(data));
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
        let delay = 1e3;
        while (retries > 0) {
          let timeoutId;
          try {
            const cleanData = this.sanitizeForFirestore(dataToWrite);
            const timeoutPromise = new Promise((_, rej) => {
              timeoutId = setTimeout(() => rej(new Error("Firestore write timeout")), 8e3);
            });
            await Promise.race([
              setDoc(this.docRef, cleanData),
              timeoutPromise
            ]);
            if (timeoutId) clearTimeout(timeoutId);
            resolve();
            return;
          } catch (error) {
            if (timeoutId) clearTimeout(timeoutId);
            const isResourceExhausted = error?.code === "resource-exhausted" || error?.message?.includes("RESOURCE_EXHAUSTED");
            if (isResourceExhausted && retries > 1) {
              console.warn(`Firestore resource exhausted. Tentando novamente em ${delay}ms... (${retries} tentativas restantes)`);
              await new Promise((res) => setTimeout(res, delay));
              delay *= 2;
              retries--;
            } else {
              console.error("Erro ao escrever no Firestore:", error);
              reject(error);
              return;
            }
          }
        }
        reject(new Error("Falha na escrita do Firestore ap\xF3s tentativas devido a exaust\xE3o de recursos"));
      }, 1500);
    });
  }
  sanitizeForFirestore(obj) {
    if (obj === null || obj === void 0) {
      return null;
    }
    if (typeof obj === "number") {
      if (isNaN(obj) || !isFinite(obj)) {
        return null;
      }
      return obj;
    }
    if (typeof obj !== "object") {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.filter((item) => item !== void 0).map((item) => this.sanitizeForFirestore(item));
    }
    const newObj = {};
    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      if (value !== void 0) {
        newObj[key] = this.sanitizeForFirestore(value);
      }
    });
    return newObj;
  }
};

// src/database.ts
var defaultData = {
  ministros: [],
  paroquias: [],
  disponibilidades: [],
  mensagens: [],
  config: { coordinatorEnabled: false, escalaPublicada: false, adminPassword: "999", disponibilidadeAberta: false },
  missasTemporarias: [],
  escalaGerada: {},
  comunhao: [],
  estoque: [],
  estoqueMovimentacoes: [],
  trocas: [],
  testers: [],
  financeiro: [],
  pushSubscriptions: [],
  fidelisCoordinators: [],
  eventos: []
};
var adapter = new FirestoreAdapter("app_data", "main_db");
var db2 = new Low(adapter, defaultData);
async function setupDatabase() {
  const fs2 = await import("fs");
  fs2.writeFileSync("src/setup.log", `[SETUP] ${(/* @__PURE__ */ new Date()).toISOString()} - Iniciando setup...
`);
  console.log("Iniciando setup do banco de dados...");
  console.log("Verificando vari\xE1veis de ambiente do Firebase:");
  console.log(`- Project ID: ${process.env.VITE_FIREBASE_PROJECT_ID || "N\xC3O DEFINIDO"}`);
  console.log(`- API Key: ${process.env.VITE_FIREBASE_API_KEY ? "DEFINIDA (***)" : "N\xC3O DEFINIDA"}`);
  try {
    fs2.appendFileSync("src/setup.log", `[SETUP] ${(/* @__PURE__ */ new Date()).toISOString()} - Iniciando leitura do Firestore...
`);
    let readSuccess = false;
    try {
      console.log("Tentando ler do Firestore (force read)...");
      const adapter2 = db2.adapter;
      db2.data = await adapter2.read(true);
      fs2.appendFileSync("src/setup.log", `[SETUP] ${(/* @__PURE__ */ new Date()).toISOString()} - Leitura do Firestore conclu\xEDda.
`);
      readSuccess = true;
      if (db2.data) {
        console.log(`Leitura do Firestore conclu\xEDda. Ministros: ${db2.data.ministros?.length || 0}`);
        fs2.appendFileSync("src/setup.log", `[SETUP] ${(/* @__PURE__ */ new Date()).toISOString()} - Ministros encontrados: ${db2.data.ministros?.length || 0}
`);
      } else {
        console.log("Firestore retornou dados nulos (documento n\xE3o existe).");
        fs2.appendFileSync("src/setup.log", `[SETUP] ${(/* @__PURE__ */ new Date()).toISOString()} - Firestore retornou dados nulos.
`);
      }
    } catch (readError) {
      console.error("ERRO CR\xCDTICO ao ler do Firestore durante setup:", readError);
      fs2.appendFileSync("src/setup.log", `[SETUP] ${(/* @__PURE__ */ new Date()).toISOString()} - Erro na leitura do Firestore: ${readError.message}
`);
      readSuccess = false;
      db2.data = defaultData;
    }
    if (readSuccess && db2.data === null) {
      console.log("Banco de dados n\xE3o encontrado no Firestore. Verificando migra\xE7\xE3o local...");
      let localData = null;
      try {
        const localAdapter = new JSONFile("db.json");
        const localDb = new Low(localAdapter, defaultData);
        await localDb.read();
        if (localDb.data && localDb.data.ministros && localDb.data.ministros.length > 0) {
          localData = localDb.data;
        }
      } catch (e) {
        console.log("Nenhum db.json encontrado para migra\xE7\xE3o.");
      }
      if (localData) {
        db2.data = localData;
        try {
          await db2.write();
          console.log("Dados migrados do db.json para o Firestore com sucesso.");
        } catch (e) {
          console.error("Erro ao migrar dados para o Firestore:", e);
        }
      } else {
        db2.data = defaultData;
        try {
          await db2.write();
          console.log("Firestore inicializado com dados padr\xE3o (vazio).");
        } catch (e) {
          console.error("Erro ao inicializar Firestore com dados padr\xE3o:", e);
        }
      }
    } else if (!readSuccess) {
      console.error("AVISO: Setup do banco de dados incompleto devido a erro de leitura. O sistema pode estar operando com dados em branco na mem\xF3ria para evitar sobrescrever o Firestore.");
      db2.data = defaultData;
    } else if (db2.data && !db2.data.ministros) {
      db2.data.ministros = [];
      try {
        await db2.write();
        console.log("Estrutura de ministros inicializada no Firestore.");
      } catch (e) {
        console.error("Erro ao inicializar estrutura de ministros no Firestore:", e);
      }
    }
    console.log(`Banco de dados carregado. Total de ministros: ${db2.data?.ministros?.length || 0}`);
    console.log(`Banco de dados carregado. Total de par\xF3quias: ${db2.data?.paroquias?.length || 0}`);
    if (db2.data?.paroquias?.length === 0) {
      console.log("AVISO: O banco de dados de par\xF3quias est\xE1 VAZIO. Adicionando par\xF3quias padr\xE3o para permitir o in\xEDcio do sistema.");
      db2.data.paroquias = [
        { id: "1772280333795", nome: "Par\xF3quia Santa Rita de C\xE1ssia", cnpj: "44.454.312/0024-37", coordenador: "Alexandre", telefoneCoordenador: "14997865806", estado: "SP", cidade: "Bauru", status: "ativo" },
        { id: "1772281505207", nome: "Par\xF3quia S\xE3o Crist\xF3v\xE3o", cnpj: "00.000.000/0000-00", coordenador: "Josu\xE9", telefoneCoordenador: "14999999999", estado: "SP", cidade: "Bauru", status: "ativo" },
        { id: "1774922106968", nome: "Par\xF3quia Nossa Senhora das Gra\xE7as", cnpj: "00.000.000/0000-00", coordenador: "Fernanda e Celiomar", telefoneCoordenador: "14991133422", estado: "SP", cidade: "Bauru", status: "ativo" }
      ];
      try {
        await db2.write();
      } catch (e) {
        console.error("Erro ao salvar par\xF3quias padr\xE3o no Firestore:", e);
      }
    }
    try {
      const { getDocFromCache, getDocFromServer } = await import("firebase/firestore");
      const adapter2 = db2.adapter;
      if (adapter2 && adapter2.docRef) {
        await getDocFromServer(adapter2.docRef);
        console.log("Conex\xE3o com Firestore verificada com sucesso.");
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("the client is offline")) {
        console.error("ERRO CR\xCDTICO: O cliente Firestore est\xE1 offline. Verifique a configura\xE7\xE3o do Firebase.");
      } else {
        console.warn("Aviso: Teste de conex\xE3o com Firestore falhou (pode ser normal se for a primeira execu\xE7\xE3o ou se estiver usando cache):", error);
      }
    }
    if (db2.data?.ministros?.length === 0) {
      console.log("AVISO: O banco de dados de ministros est\xE1 VAZIO. Ningu\xE9m conseguir\xE1 logar at\xE9 que novos cadastros sejam feitos.");
    }
  } catch (error) {
    console.error("Erro cr\xEDtico ao inicializar banco de dados:", error);
  }
}
var database_default = db2;

// server.ts
import path from "path";
import webpush from "web-push";
process.env.TZ = "America/Sao_Paulo";
fs.appendFileSync("debug.log", `${(/* @__PURE__ */ new Date()).toISOString()} - [BOOT] server.ts starting...
`);
function getBrazilDate(date = /* @__PURE__ */ new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false
    });
    const parts = formatter.formatToParts(date);
    const map = {};
    for (const part of parts) {
      if (part.type !== "literal") {
        map[part.type] = Number(part.value);
      }
    }
    const hour = map.hour === 24 ? 0 : map.hour;
    return new Date(map.year, map.month - 1, map.day, hour, map.minute, map.second);
  } catch (e) {
    return date;
  }
}
var logDebug = (msg) => {
  const logLine = `${(/* @__PURE__ */ new Date()).toISOString()} - ${msg}
`;
  console.log(logLine.trim());
};
var normalize = (str) => {
  if (!str) return "";
  return String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};
var normalizeModo = (modo) => {
  const m = normalize(modo);
  if (m === "casal" || m === "ambos") return "casal";
  if (m === "ela" || m === "esposa" || m === "conjuge") return "ela";
  if (m === "ele" || m === "marido" || m === "esposo" || m === "titular") return "ele";
  return "individual";
};
var findMinistroByNomeOrId = (escMin, paroquia) => {
  if (!escMin) return null;
  if (!database_default.data || !database_default.data.ministros) return null;
  const targetParoquia = String(paroquia || "").trim();
  const paroquiaMinisters = database_default.data.ministros.filter(
    (m) => !targetParoquia || String(m.paroquia || "").trim() === targetParoquia
  );
  const getTelPrimary = (m) => m.telefone ? String(m.telefone).replace(/\D/g, "") : "";
  const getTelConjuge = (m) => m.telefoneConjuge ? String(m.telefoneConjuge).replace(/\D/g, "") : "";
  if (typeof escMin === "object" && escMin !== null) {
    if (escMin.id) {
      const min = paroquiaMinisters.find((m) => String(m.id) === String(escMin.id));
      if (min) {
        const pTel = getTelPrimary(min);
        const cTel = getTelConjuge(min);
        const phones = min.tipo === "casal" ? [pTel, cTel].filter(Boolean) : [pTel].filter(Boolean);
        return { ministro: min, targetPhones: phones, matchedName: min.nome };
      }
    }
    escMin = escMin.nome;
  }
  if (typeof escMin !== "string") return null;
  const rawName = String(escMin).trim();
  if (!rawName) return null;
  const normSearch = normalize(rawName).replace(/[&/]/g, " e ").replace(/\s+/g, " ").trim();
  if (!normSearch || normSearch === "nao definido" || normSearch === "lider da missa" || normSearch === "coordenacao") {
    return null;
  }
  const isCoupleSearch = normSearch.includes(" e ");
  const matchSingle = (nameA, nameB) => {
    if (!nameA || !nameB) return false;
    const cleanA = nameA.trim();
    const cleanB = nameB.trim();
    if (cleanA === cleanB) return true;
    const tokensA = cleanA.split(/\s+/).filter(Boolean);
    const tokensB = cleanB.split(/\s+/).filter(Boolean);
    if (tokensA.length >= 2 && tokensB.length >= 2) {
      const firstMatch = tokensA[0] === tokensB[0];
      const lastMatch = tokensA[tokensA.length - 1] === tokensB[tokensB.length - 1];
      if (firstMatch && lastMatch) {
        return true;
      }
    }
    if (tokensA.length === 1 && tokensB.length === 1) {
      return tokensA[0] === tokensB[0];
    }
    return false;
  };
  if (isCoupleSearch) {
    const searchParts = normSearch.split(" e ").map((p) => p.trim()).filter(Boolean);
    if (searchParts.length < 2) return null;
    for (const m of paroquiaMinisters) {
      const isCasal = m.tipo === "casal" || !!m.nomeConjuge;
      if (!isCasal) continue;
      const eleNames = [m.nome, m.nomeExibicao].filter(Boolean).map(normalize);
      const elaNames = [m.nomeConjuge, m.nomeExibicaoConjuge].filter(Boolean).map(normalize);
      const part1MatchesEle = eleNames.some((n) => matchSingle(n, searchParts[0]));
      const part2MatchesEla = elaNames.some((n) => matchSingle(n, searchParts[1]));
      const part1MatchesEla = elaNames.some((n) => matchSingle(n, searchParts[0]));
      const part2MatchesEle = eleNames.some((n) => matchSingle(n, searchParts[1]));
      if (part1MatchesEle && part2MatchesEla || part1MatchesEla && part2MatchesEle) {
        const pTel = getTelPrimary(m);
        const cTel = getTelConjuge(m);
        return {
          ministro: m,
          targetPhones: [pTel, cTel].filter(Boolean),
          matchedName: `${m.nomeExibicao || m.nome} & ${m.nomeExibicaoConjuge || m.nomeConjuge}`
        };
      }
    }
    return null;
  }
  for (const m of paroquiaMinisters) {
    const eleNames = [m.nome, m.nomeExibicao].filter(Boolean).map(normalize);
    const elaNames = [m.nomeConjuge, m.nomeExibicaoConjuge].filter(Boolean).map(normalize);
    const matchEle = eleNames.some((n) => matchSingle(n, normSearch));
    if (matchEle) {
      const pTel = getTelPrimary(m);
      return {
        ministro: m,
        targetPhones: pTel ? [pTel] : [],
        matchedName: m.nomeExibicao || m.nome
      };
    }
    const matchEla = elaNames.some((n) => matchSingle(n, normSearch));
    if (matchEla) {
      const cTel = getTelConjuge(m);
      return {
        ministro: m,
        targetPhones: cTel ? [cTel] : [],
        matchedName: m.nomeExibicaoConjuge || m.nomeConjuge
      };
    }
  }
  return null;
};
var isComplexPassword = (password) => {
  if (!password) return false;
  if (password.length < 6) return false;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUppercase && hasLowercase && hasSpecial;
};
function matchPhones(tel1, tel2) {
  if (!tel1 || !tel2) return false;
  const clean1 = String(tel1).replace(/\D/g, "");
  const clean2 = String(tel2).replace(/\D/g, "");
  if (!clean1 || !clean2) return false;
  if (clean1 === clean2) return true;
  const minLen = Math.min(clean1.length, clean2.length);
  if (minLen >= 8) {
    return clean1.endsWith(clean2) || clean2.endsWith(clean1);
  }
  return false;
}
async function initVapidKeys() {
  try {
    if (!database_default.data.config) {
      database_default.data.config = { coordinatorEnabled: false, escalaPublicada: false, disponibilidadeAberta: false };
    }
    const anyConfig = database_default.data.config;
    if (!anyConfig.vapidKeys) {
      const keys = webpush.generateVAPIDKeys();
      anyConfig.vapidKeys = keys;
      await database_default.write();
    }
    webpush.setVapidDetails(
      "mailto:alex.facchini1@gmail.com",
      anyConfig.vapidKeys.publicKey,
      anyConfig.vapidKeys.privateKey
    );
    console.log("[PUSH] VAPID keys set successfully.");
  } catch (err) {
    console.error("[PUSH] Failed to init VAPID keys:", err);
  }
}
async function sendPushNotificationToUser(telefone, title, body, url = "/", paroquia) {
  try {
    await database_default.read();
    if (!database_default.data || !database_default.data.ministros) return;
    const matchingMinisters = database_default.data.ministros.filter((m) => {
      const phoneMatches = matchPhones(m.telefone, telefone) || matchPhones(m.telefoneConjuge, telefone);
      if (!phoneMatches) return false;
      if (paroquia) {
        return String(m.paroquia).trim() === String(paroquia).trim();
      }
      return true;
    });
    if (matchingMinisters.length === 0) {
      console.log(`[PUSH] No matching ministers found for phone: ${telefone}`);
      return;
    }
    let dbUpdated = false;
    for (const ministro of matchingMinisters) {
      const subs = ministro.pushSubscriptions || [];
      if (subs.length === 0) continue;
      console.log(`[PUSH] Sending notification to ${ministro.nome} (${subs.length} total subscription(s) on profile)`);
      const payload = JSON.stringify({ title, body, url });
      const activeSubs = [];
      const cleanTargetPhone = String(telefone).replace(/\D/g, "");
      for (const sub of subs) {
        let isLegacy = true;
        let subPhone = "";
        let actualSub = sub;
        if (sub && typeof sub === "object" && "subscription" in sub) {
          isLegacy = false;
          subPhone = sub.telefone ? String(sub.telefone).replace(/\D/g, "") : "";
          actualSub = sub.subscription;
        }
        if (isLegacy) {
          const mPrimary = ministro.telefone ? String(ministro.telefone).replace(/\D/g, "") : "";
          const mConj = ministro.telefoneConjuge ? String(ministro.telefoneConjuge).replace(/\D/g, "") : "";
          if (mPrimary !== cleanTargetPhone && mConj !== cleanTargetPhone) {
            console.log(`[PUSH] Skipping legacy subscription on ${ministro.nome} because profile phones do not match target phone (${cleanTargetPhone})`);
            activeSubs.push(sub);
            continue;
          }
        }
        if (!isLegacy && subPhone && subPhone !== cleanTargetPhone) {
          console.log(`[PUSH] Skipping subscription on ${ministro.nome} because subscription phone (${subPhone}) does not match target phone (${cleanTargetPhone})`);
          activeSubs.push(sub);
          continue;
        }
        try {
          await webpush.sendNotification(actualSub, payload, { TTL: 14400 });
          activeSubs.push(sub);
        } catch (error) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`[PUSH] Subscription for ${ministro.nome} expired (${error.statusCode} ${error.message || "Gone"}), removing from database.`);
            dbUpdated = true;
          } else {
            console.error(`[PUSH] Failed to send push to sub of ${ministro.nome}:`, error.statusCode || error, error.message);
            activeSubs.push(sub);
          }
        }
      }
      if (activeSubs.length !== subs.length) {
        ministro.pushSubscriptions = activeSubs;
        dbUpdated = true;
      }
    }
    if (dbUpdated) {
      await database_default.write();
    }
  } catch (err) {
    console.error("[PUSH] Error in sendPushNotificationToUser:", err);
  }
}
async function sendPushNotificationToParoquia(paroquia, title, body, url = "/") {
  try {
    await database_default.read();
    if (!database_default.data || !database_default.data.ministros) return;
    const targetParoquia = String(paroquia).trim().toLowerCase();
    const matchingMinisters = database_default.data.ministros.filter((m) => String(m.paroquia).trim().toLowerCase() === targetParoquia);
    let dbUpdated = false;
    for (const ministro of matchingMinisters) {
      const subs = ministro.pushSubscriptions || [];
      if (subs.length === 0) continue;
      const payload = JSON.stringify({ title, body, url });
      const activeSubs = [];
      for (const sub of subs) {
        let actualSub = sub;
        if (sub && typeof sub === "object" && "subscription" in sub) {
          actualSub = sub.subscription;
        }
        try {
          await webpush.sendNotification(actualSub, payload, { TTL: 14400 });
          activeSubs.push(sub);
        } catch (error) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`[PUSH] Subscription for ${ministro.nome} expired (${error.statusCode} ${error.message || "Gone"}), removing from database.`);
            dbUpdated = true;
          } else {
            console.error(`[PUSH] Failed to send push to sub of ${ministro.nome}:`, error.statusCode || error, error.message);
            activeSubs.push(sub);
          }
        }
      }
      if (activeSubs.length !== subs.length) {
        ministro.pushSubscriptions = activeSubs;
        dbUpdated = true;
      }
    }
    if (dbUpdated) {
      await database_default.write();
    }
  } catch (err) {
    console.error("[PUSH] Error in sendPushNotificationToParoquia:", err);
  }
}
async function runMigrations(skipRead = false) {
  try {
    if (!skipRead) {
      await database_default.read();
    }
    let changed = false;
    if (database_default.data) {
      if (database_default.data.ministros) {
        database_default.data.ministros.forEach((m) => {
          if (m.paroquia === "Santa Rita de C\xE1ssia - Bauru/SP" || m.paroquia === "Santa Rita de C\xE1ssia") {
            m.paroquia = "Par\xF3quia Santa Rita de C\xE1ssia";
            changed = true;
          }
        });
      }
      if (database_default.data.paroquias) {
        database_default.data.paroquias.forEach((p) => {
          if (p.status === void 0) {
            p.status = p.bloqueada ? "bloqueado" : "ativo";
            delete p.bloqueada;
            changed = true;
          }
        });
      }
      if (database_default.data.paroquias) {
        const targetName = "Par\xF3quia Santa Rita de C\xE1ssia";
        const oldNames = ["Santa Rita de C\xE1ssia - Bauru/SP", "Santa Rita de C\xE1ssia"];
        let targetExists = database_default.data.paroquias.some((p) => p.nome === targetName);
        database_default.data.paroquias.forEach((p) => {
          if (oldNames.includes(p.nome)) {
            if (!targetExists) {
              p.nome = targetName;
              targetExists = true;
              changed = true;
            } else {
              database_default.data.paroquias = database_default.data.paroquias.filter((item) => item !== p);
              changed = true;
            }
          }
        });
      }
      const collectionsToTrim = ["ministros", "paroquias", "disponibilidades", "missasTemporarias"];
      collectionsToTrim.forEach((coll) => {
        if (database_default.data && database_default.data[coll]) {
          database_default.data[coll].forEach((item) => {
            const field = coll === "paroquias" ? "nome" : "paroquia";
            if (item[field] && item[field] !== item[field].trim()) {
              item[field] = item[field].trim();
              changed = true;
            }
          });
        }
      });
      if (database_default.data.escalaGerada) {
        const newEscala = {};
        let escalaChanged = false;
        Object.keys(database_default.data.escalaGerada).forEach((key) => {
          const trimmedKey = key.trim();
          if (trimmedKey !== key) {
            newEscala[trimmedKey] = { ...newEscala[trimmedKey] || {}, ...database_default.data.escalaGerada[key] };
            escalaChanged = true;
          } else {
            newEscala[key] = database_default.data.escalaGerada[key];
          }
        });
        if (escalaChanged) {
          database_default.data.escalaGerada = newEscala;
          changed = true;
        }
      }
      if (database_default.data.escalaGerada) {
        const rootKeys = Object.keys(database_default.data.escalaGerada);
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const defaultParoquia = "Par\xF3quia Santa Rita de C\xE1ssia";
        if (rootKeys.some((k) => dateRegex.test(k))) {
          if (!database_default.data.escalaGerada[defaultParoquia]) {
            database_default.data.escalaGerada[defaultParoquia] = {};
          }
          rootKeys.forEach((key) => {
            if (dateRegex.test(key)) {
              if (database_default.data.escalaGerada[defaultParoquia][key]) {
                database_default.data.escalaGerada[defaultParoquia][key] = {
                  ...database_default.data.escalaGerada[defaultParoquia][key],
                  ...database_default.data.escalaGerada[key]
                };
              } else {
                database_default.data.escalaGerada[defaultParoquia][key] = database_default.data.escalaGerada[key];
              }
              delete database_default.data.escalaGerada[key];
              changed = true;
            }
          });
        }
      }
      const collectionsToCheckMissa = ["disponibilidades", "missasTemporarias"];
      collectionsToCheckMissa.forEach((coll) => {
        if (database_default.data && database_default.data[coll]) {
          database_default.data[coll].forEach((item) => {
            const field = coll === "disponibilidades" ? "nomeMissa" : "nome";
            if (item[field] && item[field].includes("Cura")) {
              item[field] = "Missa com Ben\xE7\xE3o do Sant\xEDssimo";
              changed = true;
            }
          });
        }
      });
      if (database_default.data.escalaGerada) {
        Object.keys(database_default.data.escalaGerada).forEach((data) => {
          if (typeof database_default.data.escalaGerada[data] === "object") {
            Object.keys(database_default.data.escalaGerada[data]).forEach((horario) => {
              const missa = database_default.data.escalaGerada[data][horario];
              if (missa && missa.nome && missa.nome.includes("Cura")) {
                missa.nome = "Missa com Ben\xE7\xE3o do Sant\xEDssimo";
                changed = true;
              }
            });
          }
        });
      }
      if (database_default.data.mensagens) {
        database_default.data.mensagens.forEach((m) => {
          if (m.texto && m.texto.includes("Cura")) {
            m.texto = m.texto.replace(/Cura e Libertação/g, "Ben\xE7\xE3o do Sant\xEDssimo");
            changed = true;
          }
        });
      }
      if (database_default.data.config) {
        if (!database_default.data.config.diaAbertura) {
          database_default.data.config.diaAbertura = 20;
          changed = true;
        }
        if (!database_default.data.config.horaAbertura) {
          database_default.data.config.horaAbertura = "06:00";
          changed = true;
        }
        if (!database_default.data.config.diaFechamento) {
          database_default.data.config.diaFechamento = 30;
          changed = true;
        }
        if (!database_default.data.config.horaFechamento) {
          database_default.data.config.horaFechamento = "23:59";
          changed = true;
        }
      }
      if (database_default.data.ministros) {
        database_default.data.ministros.forEach((m) => {
          if (!m.paroquia) {
            if (m.nomeConjuge) {
              const spouse = database_default.data.ministros.find(
                (s) => s.paroquia && (s.nome && s.nome.toLowerCase().includes(m.nomeConjuge.toLowerCase()) || s.nomeConjuge && s.nomeConjuge.toLowerCase().includes(m.nome.toLowerCase()) || m.telefoneConjuge && s.telefone && s.telefone.replace(/\D/g, "") === m.telefoneConjuge.replace(/\D/g, ""))
              );
              if (spouse) {
                m.paroquia = spouse.paroquia;
                changed = true;
                console.log(`[HEAL] Copied paroquia '${m.paroquia}' for ${m.nome} from spouse ${spouse.nome}`);
              }
            }
            if (!m.paroquia) {
              m.paroquia = "Par\xF3quia Santa Rita de C\xE1ssia";
              changed = true;
              console.log(`[HEAL] Assigned default paroquia '${m.paroquia}' for ${m.nome}`);
            }
          }
        });
      }
      if (database_default.data.paroquias) {
        database_default.data.paroquias.forEach((p) => {
          const { coordenador, telefoneCoordenador, nome } = p;
          if (coordenador && telefoneCoordenador && nome) {
            if (!database_default.data.ministros) database_default.data.ministros = [];
            const clean = (num) => num ? num.replace(/\D/g, "") : "";
            const cleanTel = clean(telefoneCoordenador);
            if (cleanTel) {
              const existing = database_default.data.ministros.find((m) => clean(m.telefone) === cleanTel || m.telefoneConjuge && clean(m.telefoneConjuge) === cleanTel);
              if (existing) {
                if (existing.role !== "coordenacao" || existing.paroquia !== nome || !existing.aprovado) {
                  if (existing.role !== "admin") existing.role = "coordenacao";
                  existing.aprovado = true;
                  existing.paroquia = nome;
                  changed = true;
                  console.log(`[COORD-SYNC] Found existing minister ${existing.nome} with matching phone ${telefoneCoordenador}, elevated to coordinator for '${nome}'`);
                }
              } else {
                const novoId = database_default.data.ministros.length > 0 ? Math.max(...database_default.data.ministros.map((m) => m.id)) + 1 : 1;
                database_default.data.ministros.push({
                  id: novoId,
                  nome: coordenador,
                  nomeExibicao: coordenador,
                  telefone: telefoneCoordenador,
                  paroquia: nome,
                  senha: "123456",
                  // senha padrão para acesso inicial
                  tipo: "individual",
                  role: "coordenacao",
                  acessoCoordenacao: "casal",
                  aprovado: true,
                  cadastroCompleto: false,
                  incompatibilidades: []
                });
                changed = true;
                console.log(`[COORD-SYNC] Created new coordinator account ${coordenador} with phone ${telefoneCoordenador} for '${nome}'`);
              }
            }
          }
        });
      }
      if (database_default.data.escalaGerada) {
        const eg = database_default.data.escalaGerada;
        Object.keys(eg).forEach((par) => {
          const escala = eg[par];
          if (!escala || typeof escala !== "object") return;
          if (escala["2026-06-06"] && escala["2026-06-06"]["17:00"]) {
            const slot = escala["2026-06-06"]["17:00"];
            const before = JSON.stringify(slot.ministros);
            slot.ministros = slot.ministros.map((m) => {
              const lower = m.toLowerCase();
              if (lower.includes("valter") && (lower.includes("sonia") || lower.includes("s\xF4nia") || lower.includes("s\xF5nia"))) {
                return "S\xF4nia";
              }
              return m;
            });
            slot.ministros = Array.from(new Set(slot.ministros));
            if (before !== JSON.stringify(slot.ministros)) {
              changed = true;
              console.log(`[SURGICAL-FIX] Updated 2026-06-06 17:00 in ${par}`);
            }
          }
          if (escala["2026-06-07"] && escala["2026-06-07"]["10:00"]) {
            const slot = escala["2026-06-07"]["10:00"];
            const before = JSON.stringify(slot.ministros);
            slot.ministros = slot.ministros.map((m) => {
              if (m === "S\xF4nia" || m === "S\xF5nia") return "Cristiane";
              return m;
            });
            slot.ministros = Array.from(new Set(slot.ministros));
            if (before !== JSON.stringify(slot.ministros)) {
              changed = true;
              console.log(`[SURGICAL-FIX] Updated 2026-06-07 10:00 in ${par}`);
            }
          }
        });
      }
      if (database_default.data.ministros) {
        const seenEndpoints = /* @__PURE__ */ new Map();
        database_default.data.ministros.forEach((m) => {
          const anyM = m;
          if (Array.isArray(anyM.pushSubscriptions)) {
            const cleanMPrimary = m.telefone ? String(m.telefone).replace(/\D/g, "") : "";
            const cleanMConjuge = m.telefoneConjuge ? String(m.telefoneConjuge).replace(/\D/g, "") : "";
            const validPhones = [cleanMPrimary, cleanMConjuge].filter(Boolean);
            const filteredSubs = [];
            for (const item of anyM.pushSubscriptions) {
              const actualSub = item && item.subscription ? item.subscription : item;
              const itemPhone = item && item.telefone ? String(item.telefone).replace(/\D/g, "") : cleanMPrimary;
              if (actualSub && actualSub.endpoint) {
                if (validPhones.includes(itemPhone) || validPhones.length === 0) {
                  filteredSubs.push({
                    telefone: itemPhone || cleanMPrimary,
                    subscription: actualSub
                  });
                }
              }
            }
            if (filteredSubs.length !== anyM.pushSubscriptions.length) {
              anyM.pushSubscriptions = filteredSubs;
              changed = true;
            }
          }
        });
      }
      if (database_default.data.mensagens && Array.isArray(database_default.data.mensagens)) {
        const beforeCount = database_default.data.mensagens.length;
        database_default.data.mensagens = database_default.data.mensagens.filter((msg) => {
          const isReminder = msg.texto && (msg.texto.includes("Lembrete de Escala") || msg.texto.includes("Lembrete de L\xEDder") || msg.texto.includes("Lembrete Di\xE1rio") || msg.texto.includes("Lembrete Pr\xF3ximo") || msg.texto.includes("voc\xEA est\xE1 escalado") || msg.texto.includes("Voc\xEA \xE9 o L\xCDDER"));
          if (isReminder) {
            const cleanTel = msg.destinatario_telefone ? String(msg.destinatario_telefone).replace(/\D/g, "") : "";
            if (!cleanTel) return false;
          }
          return true;
        });
        if (database_default.data.mensagens.length !== beforeCount) {
          changed = true;
        }
      }
    }
    if (changed) {
      await database_default.write();
      console.log("System: Migrations applied successfully.");
      logDebug("System: Migrations applied successfully.");
    }
  } catch (e) {
    console.error("Migration error:", e);
    logDebug(`Migration error: ${e instanceof Error ? e.message : String(e)}`);
  }
}
async function enviarLembretesAutomaticos(paroquia) {
  try {
    await database_default.read();
    const config = database_default.data.config || {};
    if (!config.lembreteAutomaticoPorParoquia) {
      config.lembreteAutomaticoPorParoquia = {};
    }
    const automaticoEnabled = config.lembreteAutomaticoPorParoquia[paroquia] === true;
    if (!automaticoEnabled) return;
    if (!database_default.data.escalaGerada || !database_default.data.escalaGerada[paroquia]) return;
    const nowMs = Date.now();
    let dbUpdated = false;
    if (!database_default.data.mensagens) database_default.data.mensagens = [];
    const paroquiaEscala = database_default.data.escalaGerada[paroquia];
    for (const dataStr of Object.keys(paroquiaEscala)) {
      const slotsNoDia = paroquiaEscala[dataStr];
      if (!slotsNoDia) continue;
      for (const horario of Object.keys(slotsNoDia)) {
        const missa = slotsNoDia[horario];
        if (!missa || !missa.ministros || !Array.isArray(missa.ministros) || missa.ministros.length === 0) continue;
        const cleanHorario = horario.trim();
        const timeParts = cleanHorario.split(":");
        if (timeParts.length < 2) continue;
        const hStr = timeParts[0].padStart(2, "0");
        const mStr = timeParts[1].padStart(2, "0");
        const massISOStr = `${dataStr}T${hStr}:${mStr}:00-03:00`;
        const massDate = new Date(massISOStr);
        const massTimeMs = massDate.getTime();
        if (isNaN(massTimeMs)) continue;
        const ms24h = 24 * 60 * 60 * 1e3;
        const ms3h = 3 * 60 * 60 * 1e3;
        const time24hStart = massTimeMs - ms24h;
        const time3hStart = massTimeMs - ms3h;
        const is24hWindow = nowMs >= massTimeMs - ms24h && nowMs < massTimeMs - (ms24h - 60 * 60 * 1e3);
        const is3hWindow = nowMs >= massTimeMs - ms3h && nowMs < massTimeMs - (ms3h - 60 * 60 * 1e3);
        if (is24hWindow || is3hWindow) {
          for (const escMin of missa.ministros) {
            const matchResult = findMinistroByNomeOrId(escMin, paroquia);
            if (!matchResult || matchResult.targetPhones.length === 0) continue;
            const { ministro, targetPhones } = matchResult;
            const nomeEscala = typeof escMin === "object" && escMin !== null ? escMin.nome || "" : String(escMin);
            const dateBr = dataStr.split("-").reverse().join("/");
            const isEleLider = Boolean(ministro.isLider || ministro.role === "coordenacao" || ministro.role === "vice_coordenacao" || ministro.role === "admin");
            const isElaLider = Boolean(ministro.isLiderConjuge || ministro.role === "coordenacao" || ministro.role === "vice_coordenacao" || ministro.role === "admin");
            const rawLider = typeof missa.lider === "object" && missa.lider !== null ? missa.lider.nome || "" : String(missa.lider || "");
            const isLiderValid = rawLider && rawLider !== "N\xE3o definido" && rawLider !== "L\xEDder da Missa" && rawLider !== "Coordena\xE7\xE3o";
            let isLider = false;
            if (isLiderValid) {
              if (typeof missa.lider === "object" && missa.lider !== null && missa.lider.id && String(missa.lider.id) === String(ministro.id)) {
                isLider = isEleLider || isElaLider;
              } else {
                const normL = normalize(rawLider);
                if (normL === normalize(nomeEscala)) {
                  isLider = isEleLider || isElaLider;
                } else if (normL === normalize(ministro.nome || "") || normL === normalize(ministro.nomeExibicao || "")) {
                  isLider = isEleLider;
                } else if (normL === normalize(ministro.nomeConjuge || "") || normL === normalize(ministro.nomeExibicaoConjuge || "")) {
                  isLider = isElaLider;
                }
              }
            }
            if (is24hWindow) {
              for (const phone of targetPhones) {
                const jaNotificado24h = database_default.data.mensagens.some(
                  (msg) => msg.type === "private" && String(msg.destinatario_telefone).replace(/\D/g, "") === phone && msg.texto.includes(dateBr) && msg.texto.includes(cleanHorario) && (msg.texto.includes("24h") || msg.texto.includes("24 horas"))
                );
                if (!jaNotificado24h) {
                  const msgTexto24h = isLider ? `Ol\xE1, ${nomeEscala}! Lembrete de Escala (24h): Voc\xEA \xE9 o L\xCDDER da missa das ${cleanHorario}h (${dateBr} - ${missa.nome || "Missa"}). Lembre-se de chegar com anteced\xEAncia para conferir alfaias e a equipe. Contamos com a sua presen\xE7a! Am\xE9m.` : `Ol\xE1, ${nomeEscala}! Lembrete de Escala (24h): voc\xEA est\xE1 escalado para a missa das ${cleanHorario}h (${dateBr} - ${missa.nome || "Missa"}). Contamos com a sua presen\xE7a! Am\xE9m.`;
                  database_default.data.mensagens.push({
                    id: Date.now() + Math.floor(Math.random() * 1e3),
                    nome: "Sistema de Lembretes",
                    telefone: "00000000000",
                    destinatario_telefone: phone,
                    texto: msgTexto24h,
                    paroquia,
                    type: "private",
                    data: (/* @__PURE__ */ new Date()).toISOString()
                  });
                  dbUpdated = true;
                  sendPushNotificationToUser(phone, isLider ? "Lembrete de L\xEDder (24h) \u2B50" : "Lembrete de Escala (24h) \u{1F4C5}", msgTexto24h, "/", paroquia);
                }
              }
            }
            if (is3hWindow) {
              for (const phone of targetPhones) {
                const jaNotificado3h = database_default.data.mensagens.some(
                  (msg) => msg.type === "private" && String(msg.destinatario_telefone).replace(/\D/g, "") === phone && msg.texto.includes(dateBr) && msg.texto.includes(cleanHorario) && (msg.texto.includes("3h") || msg.texto.includes("3 horas"))
                );
                if (!jaNotificado3h) {
                  const msgTexto3h = isLider ? `Ol\xE1, ${nomeEscala}! Lembrete Pr\xF3ximo (3h): Voc\xEA \xE9 o L\xCDDER da missa HOJE em 3 horas, \xE0s ${cleanHorario}h (${dateBr} - ${missa.nome || "Missa"}). Lembre-se de chegar com anteced\xEAncia para conferir alfaias e a equipe. Que Deus aben\xE7oe seu servir! Am\xE9m.` : `Ol\xE1, ${nomeEscala}! Lembrete Pr\xF3ximo (3h): sua missa \xE9 HOJE em 3 horas, \xE0s ${cleanHorario}h (${dateBr} - ${missa.nome || "Missa"}). Que Deus aben\xE7oe seu servir! Am\xE9m.`;
                  database_default.data.mensagens.push({
                    id: Date.now() + Math.floor(Math.random() * 1e3),
                    nome: "Sistema de Lembretes",
                    telefone: "00000000000",
                    destinatario_telefone: phone,
                    texto: msgTexto3h,
                    paroquia,
                    type: "private",
                    data: (/* @__PURE__ */ new Date()).toISOString()
                  });
                  dbUpdated = true;
                  sendPushNotificationToUser(phone, isLider ? "Lembrete de L\xEDder (3h) \u2B50" : "Lembrete de Escala (3h) \u{1F514}", msgTexto3h, "/", paroquia);
                }
              }
            }
          }
        }
      }
    }
    if (dbUpdated) {
      await database_default.write();
      console.log(`[Lembrete Autom\xE1tico] Mensagens de lembrete geradas para par\xF3quia: ${paroquia}`);
    }
  } catch (error) {
    console.error("Erro ao enviar lembretes autom\xE1ticos:", error);
  }
}
async function triggerAllBackgroundReminders() {
  try {
    await database_default.read();
    if (!database_default.data || !database_default.data.config) return;
    const config = database_default.data.config;
    if (config.lembreteAutomaticoPorParoquia) {
      for (const paroquia of Object.keys(config.lembreteAutomaticoPorParoquia)) {
        if (config.lembreteAutomaticoPorParoquia[paroquia] === true) {
          console.log(`[BACKGROUND LEMBRETE] Executing background reminders for par\xF3quia: ${paroquia}`);
          try {
            await enviarLembretesAutomaticos(paroquia);
          } catch (err) {
            console.error(`[BACKGROUND LEMBRETE] Error sending reminders for ${paroquia}:`, err);
          }
        }
      }
    }
  } catch (err) {
    console.error("[BACKGROUND LEMBRETE] Error running background reminders task:", err);
  }
}
async function startServer() {
  const app2 = express();
  const PORT = 3e3;
  let isReady = false;
  const waitingRequests = [];
  app2.use((req, res, next) => {
    if (isReady) return next();
    let done = false;
    const proceed = () => {
      if (!done) {
        done = true;
        next();
      }
    };
    waitingRequests.push(proceed);
    setTimeout(proceed, 2e4).unref();
  });
  const server = app2.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Instant-Listen ativo na porta ${PORT}`);
    logDebug(`[SERVER] Servidor ouvindo imediatamente na porta ${PORT}`);
  });
  server.on("error", (err) => {
    console.error("[SERVER LISTEN ERROR]", err);
    logDebug(`[SERVER LISTEN ERROR] ${err.message || String(err)}`);
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Exiting process...`);
      process.exit(1);
    }
  });
  const handleShutdown = () => {
    console.log("[SHUTDOWN] Signal received. Closing server gracefully...");
    server.close(() => {
      console.log("[SHUTDOWN] Server closed.");
      process.exit(0);
    });
    setTimeout(() => {
      console.warn("[SHUTDOWN] Force exiting after timeout.");
      process.exit(0);
    }, 2e3).unref();
  };
  process.on("SIGTERM", handleShutdown);
  process.on("SIGINT", handleShutdown);
  await setupDatabase();
  await initVapidKeys();
  try {
    const fs2 = await import("fs");
    const path2 = await import("path");
    const restorePath = path2.join(process.cwd(), "restore_data.json");
    await database_default.read();
    if (fs2.existsSync(restorePath)) {
      console.log("[RECOVERY] Encontrado restore_data.json. Aplicando dados...");
      const jsonData = JSON.parse(fs2.readFileSync(restorePath, "utf8"));
      database_default.data = {
        ...database_default.data,
        ...jsonData,
        ministros: jsonData.ministros || database_default.data.ministros,
        config: { ...database_default.data.config, ...jsonData.config }
      };
      await database_default.write();
      console.log("[RECOVERY] Dados restaurados com sucesso do arquivo.");
      try {
        fs2.renameSync(restorePath, restorePath + ".applied");
        console.log("[RECOVERY] Arquivo restore_data.json renomeado para .applied com sucesso.");
      } catch (renameErr) {
        console.error("[RECOVERY] Erro ao renomear arquivo restore_data.json:", renameErr);
      }
    }
    const cleanPhone = (phone) => phone ? phone.replace(/\D/g, "") : "";
    const alex = database_default.data.ministros?.find((m) => m.id === 1 || m.telefone && cleanPhone(m.telefone) === "14997865806");
    if (!alex) {
      console.log("[RECOVERY] Alexandre account missing. Initializing standard accounts...");
      if (!database_default.data.ministros) database_default.data.ministros = [];
      const criticalMinistros = [
        { id: 1, nome: "Alexandre", telefone: "(14) 99786-5806", senha: "888", role: "coordenacao", aprovado: true, paroquia: "Par\xF3quia Santa Rita de C\xE1ssia", tipo: "casal" },
        { id: 43, nome: "Josu\xE9", telefone: "(14) 99999-9999", senha: "111", role: "coordenacao", aprovado: true, paroquia: "Par\xF3quia S\xE3o Crist\xF3v\xE3o", tipo: "individual" },
        { id: 47, nome: "Ministro", telefone: "(14) 98888-8888", senha: "888", role: "coordenacao", aprovado: true, paroquia: "Par\xF3quia Teste", tipo: "individual" }
      ];
      criticalMinistros.forEach((cm) => {
        const existing = database_default.data.ministros.find((m) => m.id === cm.id || m.telefone && cleanPhone(m.telefone) === cleanPhone(cm.telefone));
        if (!existing) {
          database_default.data.ministros.push(cm);
        }
      });
      if (!database_default.data.config) database_default.data.config = {};
      if (!database_default.data.config.adminPassword) {
        database_default.data.config.adminPassword = "Aqamnsqa081%";
      }
      await database_default.write();
      console.log("[RECOVERY] Contas cr\xEDticas garantidas.");
    }
    let changedAny = false;
    if (database_default.data.ministros) {
      database_default.data.ministros.forEach((m) => {
        if (m.role === "admin") {
          m.role = "coordenacao";
          console.log(`[SECURITY] For\xE7ado role 'coordenacao' para o usu\xE1rio ${m.nome} que estava como 'admin'.`);
          changedAny = true;
        }
      });
    }
    if (changedAny) {
      await database_default.write();
    }
    if (database_default.data.ministros && database_default.data.ministros.length > 0) {
      const seenCleanPhones = /* @__PURE__ */ new Set();
      const uniqueMinistros = [];
      let duplicateFoundAndCleared = false;
      const groupedByPhone = {};
      database_default.data.ministros.forEach((m) => {
        const ph = cleanPhone(m.telefone);
        if (ph) {
          if (!groupedByPhone[ph]) groupedByPhone[ph] = [];
          groupedByPhone[ph].push(m);
        } else {
          uniqueMinistros.push(m);
        }
      });
      Object.entries(groupedByPhone).forEach(([ph, list]) => {
        if (list.length > 1) {
          list.sort((a, b) => {
            if (a.id === 1) return -1;
            if (b.id === 1) return 1;
            const aLen = (a.nome || "").length + (a.nomeConjuge || "").length;
            const bLen = (b.nome || "").length + (b.nomeConjuge || "").length;
            return bLen - aLen;
          });
          const primary = list[0];
          for (let i = 1; i < list.length; i++) {
            const secondary = list[i];
            if (!primary.nomeConjuge && secondary.nomeConjuge) primary.nomeConjuge = secondary.nomeConjuge;
            if (!primary.nomeExibicao && secondary.nomeExibicao) primary.nomeExibicao = secondary.nomeExibicao;
            if (!primary.nomeExibicaoConjuge && secondary.nomeExibicaoConjuge) primary.nomeExibicaoConjuge = secondary.nomeExibicaoConjuge;
            if (!primary.senha && secondary.senha) primary.senha = secondary.senha;
            if (!primary.paroquia && secondary.paroquia) primary.paroquia = secondary.paroquia;
            if (!primary.tipo && secondary.tipo) {
              primary.tipo = secondary.tipo;
            }
            if (!primary.telefoneConjuge && secondary.telefoneConjuge) primary.telefoneConjuge = secondary.telefoneConjuge;
            if (!primary.dataNascimento && secondary.dataNascimento) primary.dataNascimento = secondary.dataNascimento;
            if (!primary.dataNascimentoConjuge && secondary.dataNascimentoConjuge) primary.dataNascimentoConjuge = secondary.dataNascimentoConjuge;
          }
          uniqueMinistros.push(primary);
          duplicateFoundAndCleared = true;
        } else {
          uniqueMinistros.push(list[0]);
        }
      });
      if (duplicateFoundAndCleared) {
        database_default.data.ministros = uniqueMinistros;
        await database_default.write();
        console.log("[RECOVERY] Duplicidade de telefones limpa e mesclada com sucesso!");
      }
    }
  } catch (e) {
    console.error("[RECOVERY] Erro durante recupera\xE7\xE3o:", e);
  }
  console.log(`[SERVER] Banco de dados carregado. Ministros: ${database_default.data?.ministros?.length || 0}`);
  logDebug(`[SERVER] Banco de dados carregado. Ministros: ${database_default.data?.ministros?.length || 0}`);
  setInterval(async () => {
    const now = /* @__PURE__ */ new Date();
    const todayStr = now.toISOString().split("T")[0];
    const currentMonthStr = todayStr.substring(0, 7);
    try {
      await database_default.read();
      if (!database_default.data) return;
      let changed = false;
      if (now.getDate() === 20) {
        if (!database_default.data.config) {
          database_default.data.config = {
            coordinatorEnabled: false,
            escalaPublicada: false,
            disponibilidadeAberta: false,
            disponibilidadeAbertaPorParoquia: {}
          };
        }
        const lastRun = database_default.data.config.lastClearAvailabilityDate;
        if (lastRun !== todayStr) {
          console.log("[Cleanup] Clearing availability for past months...");
          const currentMonthStr2 = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
          const beforeCount = (database_default.data.disponibilidades || []).length;
          database_default.data.disponibilidades = (database_default.data.disponibilidades || []).filter((d) => {
            const dispMonth = d.data.substring(0, 7);
            return dispMonth >= currentMonthStr2;
          });
          const afterCount = database_default.data.disponibilidades.length;
          database_default.data.config.lastClearAvailabilityDate = todayStr;
          changed = true;
          console.log(`[Cleanup] Availability cleared. ${beforeCount - afterCount} records removed.`);
        }
      }
      if (database_default.data.escalaGerada) {
        Object.keys(database_default.data.escalaGerada).forEach((paroquia) => {
          const paroquiaEscala = database_default.data.escalaGerada[paroquia];
          if (paroquiaEscala && typeof paroquiaEscala === "object") {
            const dates = Object.keys(paroquiaEscala);
            let paroquiaChanged = false;
            dates.forEach((dateKey) => {
              if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
                const dataMes = dateKey.substring(0, 7);
                if (dataMes < currentMonthStr) {
                  delete paroquiaEscala[dateKey];
                  paroquiaChanged = true;
                  changed = true;
                }
              }
            });
            if (paroquiaChanged) {
              console.log(`[Cleanup] Old schedules cleared for parish: ${paroquia}`);
            }
          }
        });
      }
      if (database_default.data.paroquias) {
        database_default.data.paroquias.forEach((p) => {
          if (p.status === "testes" && p.dataBloqueio) {
            if (todayStr >= p.dataBloqueio) {
              p.status = "bloqueado";
              changed = true;
              console.log(`[Cleanup] Parish ${p.nome} auto-locked due to date expiration.`);
            }
          }
        });
      }
      if (!database_default.data.estoque) {
        database_default.data.estoque = [];
        changed = true;
      }
      if (!database_default.data.estoqueMovimentacoes) {
        database_default.data.estoqueMovimentacoes = [];
        changed = true;
      }
      if (changed) {
        await database_default.write();
        console.log("[Cleanup] Database updated with cleaned records.");
      }
    } catch (err) {
      console.error("[Cleanup] Error during periodic cleanup:", err);
    }
  }, 1e3 * 60 * 60);
  await runMigrations();
  logDebug("[SERVER] Migra\xE7\xF5es conclu\xEDdas. Configurando rotas e middlewares...");
  app2.use((req, res, next) => {
    next();
  });
  app2.get("/api/test-route", (req, res) => {
    res.status(200).send("Test route working");
  });
  app2.get("/api/keep-alive", (req, res) => {
    res.status(200).send("OK");
  });
  app2.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app2.use((req, res, next) => {
    next();
  });
  app2.use((req, res, next) => {
    res.on("finish", () => {
      if (res.statusCode === 404) {
        console.log(`[DEBUG] 404 Not Found: ${req.method} ${req.path}`);
      }
    });
    next();
  });
  app2.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, x-fidelis-token, Accept, Origin, x-user-phone, x-user-name, x-user-email, x-session-token");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
  app2.set("etag", false);
  app2.use((req, res, next) => {
    const isStaticAsset = req.path.match(/\.(png|jpg|jpeg|gif|ico|svg|webp|woff|woff2|ttf|eot)$/i);
    if (isStaticAsset) {
      res.setHeader("Cache-Control", "public, max-age=86400, must-revalidate");
    } else {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("Surrogate-Control", "no-store");
    }
    next();
  });
  app2.use(express.json({ limit: "50mb" }));
  app2.use(express.urlencoded({ limit: "50mb", extended: true }));
  const isAlexandreOrAdmin = (userOrPhoneOrName) => {
    if (!userOrPhoneOrName) return false;
    if (typeof userOrPhoneOrName === "string") {
      const raw = userOrPhoneOrName;
      const digits = raw.replace(/\D/g, "");
      if (digits.endsWith("14997865806") || digits === "14997865806" || digits.endsWith("997865806")) return true;
      const norm = raw.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (norm.includes("alexandre borelli facchini") || norm.includes("alexandre facchini") || norm === "admin" || norm === "alexandre") return true;
      if (norm.includes("alex.facchini1@gmail.com")) return true;
      return false;
    }
    const u = userOrPhoneOrName;
    if (u.role === "admin" || u.role === "coordenacao" || u.role === "vice_coordenacao") return true;
    const cleanP = (p) => (p || "").replace(/\D/g, "");
    const phones = [
      cleanP(u.telefone),
      cleanP(u.telefoneConjuge),
      cleanP(u.loginPhone),
      cleanP(u.phone)
    ];
    if (phones.some((p) => p.endsWith("14997865806") || p === "14997865806" || p.endsWith("997865806"))) return true;
    const normalizeStr = (s) => (s || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const names = [
      normalizeStr(u.nome),
      normalizeStr(u.nomeExibicao),
      normalizeStr(u.nomeConjuge),
      normalizeStr(u.nomeExibicaoConjuge),
      normalizeStr(u.loggedInName)
    ];
    if (names.some((n) => n.includes("alexandre borelli facchini") || n.includes("alexandre facchini") || n === "alexandre")) return true;
    if (u.email && normalizeStr(u.email).includes("alex.facchini1@gmail.com")) return true;
    return false;
  };
  app2.use((req, res, next) => {
    if (!req.path.startsWith("/api/")) {
      return next();
    }
    if (req.path === "/api/health" || req.path === "/api/keep-alive" || req.path === "/api/test-route" || req.path === "/api/liturgia") {
      return next();
    }
    const maintenanceActive = database_default.data?.config?.modoManutencao === true;
    if (maintenanceActive) {
      console.log(`[DEBUG] Maintenance mode active, checking access for: ${req.path} [${req.method}]`);
      const userHeaderPhone = req.headers["x-user-phone"] || "";
      let userHeaderName = req.headers["x-user-name"] || "";
      try {
        userHeaderName = decodeURIComponent(userHeaderName);
      } catch (_) {
      }
      const userHeaderEmail = req.headers["x-user-email"] || "";
      const queryPhone = req.query.userPhone || req.query.telefone || "";
      const queryName = req.query.userName || req.query.nome || "";
      const queryEmail = req.query.userEmail || req.query.email || "";
      const isExempt = isAlexandreOrAdmin(userHeaderPhone) || isAlexandreOrAdmin(userHeaderName) || isAlexandreOrAdmin(userHeaderEmail) || isAlexandreOrAdmin(queryPhone) || isAlexandreOrAdmin(queryName) || isAlexandreOrAdmin(queryEmail) || req.body && (isAlexandreOrAdmin(req.body.telefone) || isAlexandreOrAdmin(req.body.nome) || isAlexandreOrAdmin(req.body.user) || isAlexandreOrAdmin(req.body.email));
      const isMutation = req.method === "POST" || req.method === "PUT" || req.method === "PATCH" || req.method === "DELETE";
      if (isMutation) {
        if (req.path === "/api/login" || req.path === "/api/login/") {
          return next();
        }
        if ((req.path === "/api/config" || req.path === "/api/config/") && req.body && req.body.modoManutencao !== void 0) {
          return next();
        }
        if (isExempt) {
          const allowedAdminMutations = [
            "/api/config",
            "/api/admin/login"
          ];
          const isAllowedAdminMutation = allowedAdminMutations.some((p) => req.path === p || req.path === p + "/") || req.path.startsWith("/api/admin/");
          if (isAllowedAdminMutation) {
            return next();
          }
        }
        console.log(`[DEBUG] Maintenance mode BLOCKED mutation (${req.method}) to: ${req.path}`);
        return res.status(503).json({
          error: "O sistema est\xE1 temporariamente em modo de manuten\xE7\xE3o preventiva. N\xE3o \xE9 permitido fazer altera\xE7\xF5es ou inclus\xF5es no momento."
        });
      }
      if (req.method === "GET" || req.method === "HEAD") {
        return next();
      }
    }
    next();
  });
  const publicPath = path.resolve(process.cwd(), "public");
  app2.use(express.static(publicPath));
  const serveFile = (filename, res) => {
    const filePath = path.join(publicPath, filename);
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Type", "image/jpeg");
      return res.sendFile(filePath);
    }
    return res.status(404).send("Arquivo n\xE3o encontrado");
  };
  app2.get("/dl/banner", (req, res) => serveFile("play_store_banner.jpg", res));
  app2.get("/dl/recurso", (req, res) => serveFile("recurso_grafico_1024x500.jpg", res));
  app2.get("/dl/graphic", (req, res) => serveFile("play_store_graphic_1024x500.jpg", res));
  app2.get("/recurso_grafico_1024x500.jpg", (req, res) => res.sendFile(path.join(publicPath, "recurso_grafico_1024x500.jpg")));
  app2.get("/play_store_banner.jpg", (req, res) => res.sendFile(path.join(publicPath, "play_store_banner.jpg")));
  app2.get("/api/debug/db-state", async (req, res) => {
    try {
      await database_default.read();
      res.json({
        cwd: process.cwd(),
        ministrosCount: database_default.data?.ministros?.length || 0,
        paroquiasCount: database_default.data?.paroquias?.length || 0,
        config: database_default.data?.config,
        hasData: !!database_default.data
      });
    } catch (err) {
      res.status(500).json({ error: "Erro ao ler estado do banco: " + err });
    }
  });
  app2.get("/api/debug/logs", (req, res) => {
    try {
      if (fs.existsSync("debug.log")) {
        const logs = fs.readFileSync("debug.log", "utf8");
        const lines = logs.split("\n").slice(-100);
        res.send(lines.join("\n"));
      } else {
        res.send("Arquivo debug.log n\xE3o encontrado.");
      }
    } catch (err) {
      res.status(500).send("Erro ao ler logs: " + err);
    }
  });
  app2.get("/api/debug/firebase-config", (req, res) => {
    const config = {
      apiKey: process.env.VITE_FIREBASE_API_KEY ? "Configurado (***)" : "N\xE3o configurado",
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || "N\xE3o configurado",
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "N\xE3o configurado",
      hasAppId: !!process.env.VITE_FIREBASE_APP_ID
    };
    res.json(config);
  });
  app2.get("/api/debug/db", async (req, res) => {
    await database_default.read();
    res.json(database_default.data);
  });
  app2.get("/api/push/public-key", async (req, res) => {
    try {
      await database_default.read();
      if (!database_default.data.config || !database_default.data.config.vapidKeys) {
        await initVapidKeys();
      }
      res.json({ publicKey: database_default.data.config.vapidKeys.publicKey });
    } catch (error) {
      console.error("Error fetching VAPID public key:", error);
      res.status(500).json({ error: "Failed to fetch public key" });
    }
  });
  app2.post("/api/push/subscribe", async (req, res) => {
    const { telefone, subscription } = req.body;
    if (!telefone || !subscription) {
      return res.status(400).json({ error: "Telefone and subscription are required." });
    }
    try {
      await database_default.read();
      if (!database_default.data || !database_default.data.ministros) {
        return res.status(500).json({ error: "Server data not initialized." });
      }
      let updated = false;
      const matchingMinisters = database_default.data.ministros.filter((m) => {
        return matchPhones(m.telefone, telefone) || matchPhones(m.telefoneConjuge, telefone);
      });
      if (matchingMinisters.length === 0) {
        return res.status(404).json({ error: "Minister not found for provided phone." });
      }
      const cleanInputPhone = String(telefone).replace(/\D/g, "");
      database_default.data.ministros.forEach((m) => {
        const anyM = m;
        if (Array.isArray(anyM.pushSubscriptions)) {
          const beforeLen = anyM.pushSubscriptions.length;
          anyM.pushSubscriptions = anyM.pushSubscriptions.filter((s) => {
            const sSub = s && s.subscription ? s.subscription : s;
            return sSub?.endpoint !== subscription.endpoint;
          });
          if (anyM.pushSubscriptions.length !== beforeLen) {
            updated = true;
          }
        }
      });
      for (const ministro of matchingMinisters) {
        const anyM = ministro;
        anyM.pushSubscriptions = anyM.pushSubscriptions || [];
        const exists = anyM.pushSubscriptions.some((s) => {
          const sSub = s && s.subscription ? s.subscription : s;
          return sSub && sSub.endpoint === subscription.endpoint;
        });
        if (!exists) {
          anyM.pushSubscriptions.push({
            telefone: cleanInputPhone,
            subscription
          });
          updated = true;
        } else {
          const idx = anyM.pushSubscriptions.findIndex((s) => {
            const sSub = s && s.subscription ? s.subscription : s;
            return sSub && sSub.endpoint === subscription.endpoint;
          });
          if (idx !== -1) {
            anyM.pushSubscriptions[idx] = {
              telefone: cleanInputPhone,
              subscription
            };
            updated = true;
          }
        }
      }
      if (updated) {
        await database_default.write();
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error subscribing to push:", error);
      res.status(500).json({ error: "Failed to subscribe." });
    }
  });
  app2.get("/api/config", async (req, res) => {
    const { paroquia } = req.query;
    console.log(`[API CONFIG] Request received. Par\xF3quia: ${paroquia}`);
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      await database_default.read();
      if (!database_default.data) {
        database_default.data = { ministros: [], disponibilidades: [], mensagens: [], config: { coordinatorEnabled: false, escalaPublicada: false, disponibilidadeAberta: false } };
      }
      const config = database_default.data.config || {
        coordinatorEnabled: false,
        escalaPublicada: false,
        escalaPublicadaPorParoquia: {},
        disponibilidadeAberta: false,
        disponibilidadeAbertaPorParoquia: {}
      };
      if (paroquia) {
        const targetParoquia = String(paroquia).trim();
        const agendamento = config.agendamentoPorParoquia?.[targetParoquia] || {};
        const { aberta } = getDisponibilidadeStatus(config, null, targetParoquia);
        const mergedConfig = {
          ...config,
          // Default to false if not explicitly set for this parish to avoid leaking global state
          escalaPublicada: config.escalaPublicadaPorParoquia?.[targetParoquia] ?? false,
          escalaPublicadaPorMes: config.escalaPublicadaPorMes?.[targetParoquia] || {},
          disponibilidadeAberta: aberta,
          // Agora usa o valor real (manual ou agendado)
          // Use parish-specific scheduling if available, otherwise return empty for isolation
          diaAbertura: agendamento.diaAbertura !== void 0 ? agendamento.diaAbertura : "",
          horaAbertura: agendamento.horaAbertura !== void 0 ? agendamento.horaAbertura : "",
          diaFechamento: agendamento.diaFechamento !== void 0 ? agendamento.diaFechamento : "",
          horaFechamento: agendamento.horaFechamento !== void 0 ? agendamento.horaFechamento : "",
          maxEscalacoes: config.limiteEscalacaoPorParoquia?.[targetParoquia] ?? 3,
          limiteNovos: config.limiteNovosPorMissaPorParoquia?.[targetParoquia] ?? 2,
          regraDisponibilidade: config.regraDisponibilidadePorParoquia?.[targetParoquia] ?? "regra2",
          lembreteAutomatico: config.lembreteAutomaticoPorParoquia?.[targetParoquia] ?? false
        };
        console.log(`[API CONFIG] Returning merged config for ${targetParoquia}`);
        const sanitizedMerged = { ...mergedConfig };
        delete sanitizedMerged.adminPassword;
        return res.json(sanitizedMerged);
      }
      console.log(`[API CONFIG] Returning global config`);
      const { aberta: globalAberta } = getDisponibilidadeStatus(config, null);
      const sanitizedGlobal = { ...config, disponibilidadeAberta: globalAberta };
      delete sanitizedGlobal.adminPassword;
      res.json(sanitizedGlobal);
    } catch (error) {
      console.error(`[API CONFIG] Erro ao buscar config: ${error}`);
      res.status(500).json({ error: "Erro interno do servidor ao buscar configura\xE7\xF5es." });
    }
  });
  app2.post("/api/config", async (req, res) => {
    const {
      coordinatorEnabled,
      escalaPublicada,
      mesPublicado,
      disponibilidadeAberta,
      paroquia,
      diaAbertura,
      horaAbertura,
      diaFechamento,
      horaFechamento,
      maxEscalacoes,
      limiteNovos,
      regraDisponibilidade,
      modoManutencao,
      lembreteAutomatico
    } = req.body;
    const targetParoquia = paroquia ? String(paroquia).trim() : null;
    logDebug(`[DEBUG] Received config update: paroquia=${targetParoquia}, disponibilidadeAberta=${disponibilidadeAberta}, maxEscalacoes=${maxEscalacoes}, limiteNovos=${limiteNovos}, regraDisponibilidade=${regraDisponibilidade}, modoManutencao=${modoManutencao}, lembreteAutomatico=${lembreteAutomatico}`);
    await database_default.read();
    if (!database_default.data.config) database_default.data.config = { coordinatorEnabled: false, escalaPublicada: false, disponibilidadeAberta: false, disponibilidadeAbertaPorParoquia: {} };
    if (!database_default.data.config.disponibilidadeAbertaPorParoquia) database_default.data.config.disponibilidadeAbertaPorParoquia = {};
    if (!database_default.data.config.escalaPublicadaPorParoquia) database_default.data.config.escalaPublicadaPorParoquia = {};
    if (!database_default.data.config.escalaPublicadaPorMes) database_default.data.config.escalaPublicadaPorMes = {};
    if (!database_default.data.config.limiteEscalacaoPorParoquia) database_default.data.config.limiteEscalacaoPorParoquia = {};
    if (!database_default.data.config.limiteNovosPorMissaPorParoquia) database_default.data.config.limiteNovosPorMissaPorParoquia = {};
    if (!database_default.data.config.regraDisponibilidadePorParoquia) database_default.data.config.regraDisponibilidadePorParoquia = {};
    if (!database_default.data.config.lembreteAutomaticoPorParoquia) database_default.data.config.lembreteAutomaticoPorParoquia = {};
    if (modoManutencao !== void 0) {
      database_default.data.config.modoManutencao = modoManutencao;
    }
    if (targetParoquia && maxEscalacoes !== void 0) {
      database_default.data.config.limiteEscalacaoPorParoquia[targetParoquia] = maxEscalacoes === "libre" || maxEscalacoes === 99 || maxEscalacoes === "99" ? 99 : Number(maxEscalacoes);
    }
    if (targetParoquia && limiteNovos !== void 0) {
      database_default.data.config.limiteNovosPorMissaPorParoquia[targetParoquia] = limiteNovos;
      if (!database_default.data.config.limiteCasaisNovosPorMissaPorParoquia) database_default.data.config.limiteCasaisNovosPorMissaPorParoquia = {};
      if (!database_default.data.config.limiteIndividuaisNovosPorMissaPorParoquia) database_default.data.config.limiteIndividuaisNovosPorMissaPorParoquia = {};
      if (limiteNovos === "livre") {
        database_default.data.config.limiteCasaisNovosPorMissaPorParoquia[targetParoquia] = "livre";
        database_default.data.config.limiteIndividuaisNovosPorMissaPorParoquia[targetParoquia] = "livre";
      } else if (typeof limiteNovos === "object" && limiteNovos !== null) {
        database_default.data.config.limiteCasaisNovosPorMissaPorParoquia[targetParoquia] = limiteNovos.casais ?? 2;
        database_default.data.config.limiteIndividuaisNovosPorMissaPorParoquia[targetParoquia] = limiteNovos.individuais ?? 2;
      } else {
        database_default.data.config.limiteCasaisNovosPorMissaPorParoquia[targetParoquia] = Number(limiteNovos);
        database_default.data.config.limiteIndividuaisNovosPorMissaPorParoquia[targetParoquia] = Number(limiteNovos);
      }
    }
    if (targetParoquia && regraDisponibilidade !== void 0) {
      database_default.data.config.regraDisponibilidadePorParoquia[targetParoquia] = regraDisponibilidade;
    }
    if (targetParoquia && lembreteAutomatico !== void 0) {
      database_default.data.config.lembreteAutomaticoPorParoquia[targetParoquia] = lembreteAutomatico === true || lembreteAutomatico === "true";
    }
    if (coordinatorEnabled !== void 0) database_default.data.config.coordinatorEnabled = coordinatorEnabled;
    if (escalaPublicada !== void 0) {
      if (targetParoquia) {
        if (mesPublicado) {
          if (!database_default.data.config.escalaPublicadaPorMes[targetParoquia]) database_default.data.config.escalaPublicadaPorMes[targetParoquia] = {};
          database_default.data.config.escalaPublicadaPorMes[targetParoquia][mesPublicado] = escalaPublicada;
        } else {
          database_default.data.config.escalaPublicadaPorParoquia[targetParoquia] = escalaPublicada;
          if (!escalaPublicada && database_default.data.config.escalaPublicadaPorMes[targetParoquia]) {
            database_default.data.config.escalaPublicadaPorMes[targetParoquia] = {};
          }
        }
      } else {
        database_default.data.config.escalaPublicada = escalaPublicada;
        if (!escalaPublicada) {
          database_default.data.config.escalaPublicadaPorParoquia = {};
          database_default.data.config.escalaPublicadaPorMes = {};
        }
      }
    }
    if (disponibilidadeAberta !== void 0) {
      if (targetParoquia) {
        if (disponibilidadeAberta === null) {
          delete database_default.data.config.disponibilidadeAbertaPorParoquia[targetParoquia];
        } else {
          const wasOpen = database_default.data.config.disponibilidadeAbertaPorParoquia[targetParoquia] === true;
          database_default.data.config.disponibilidadeAbertaPorParoquia[targetParoquia] = disponibilidadeAberta;
          const isOpeningNow = disponibilidadeAberta === true && !wasOpen;
          if (isOpeningNow || req.body.resetConfirmations === true) {
            database_default.data.ministros.forEach((m) => {
              if (m.paroquia && String(m.paroquia).trim() === targetParoquia) {
                m.disponibilidadeConfirmada = false;
              }
            });
            const now = /* @__PURE__ */ new Date();
            const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            const nextMonthStr = nextMonthDate.toISOString().substring(0, 7);
            database_default.data.disponibilidades = (database_default.data.disponibilidades || []).filter((d) => {
              if (d.paroquia && String(d.paroquia).trim() !== targetParoquia) return true;
              const dispMonth = d.data.substring(0, 7);
              return dispMonth >= nextMonthStr;
            });
          }
        }
      } else {
        const wasOpen = database_default.data.config.disponibilidadeAberta === true;
        database_default.data.config.disponibilidadeAberta = disponibilidadeAberta;
        const isOpeningNow = disponibilidadeAberta === true && !wasOpen;
        if (isOpeningNow || req.body.resetConfirmations === true) {
          database_default.data.ministros.forEach((m) => {
            m.disponibilidadeConfirmada = false;
          });
          const now = /* @__PURE__ */ new Date();
          const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          const nextMonthStr = nextMonthDate.toISOString().substring(0, 7);
          database_default.data.disponibilidades = (database_default.data.disponibilidades || []).filter((d) => {
            const dispMonth = d.data.substring(0, 7);
            return dispMonth >= nextMonthStr;
          });
        }
      }
    }
    if (targetParoquia) {
      if (!database_default.data.config.agendamentoPorParoquia) database_default.data.config.agendamentoPorParoquia = {};
      if (!database_default.data.config.agendamentoPorParoquia[targetParoquia]) database_default.data.config.agendamentoPorParoquia[targetParoquia] = {};
      const agendamento = database_default.data.config.agendamentoPorParoquia[targetParoquia];
      if (diaAbertura !== void 0) agendamento.diaAbertura = Number(diaAbertura);
      if (horaAbertura !== void 0) agendamento.horaAbertura = horaAbertura;
      if (diaFechamento !== void 0) agendamento.diaFechamento = Number(diaFechamento);
      if (horaFechamento !== void 0) agendamento.horaFechamento = horaFechamento;
    } else {
      if (diaAbertura !== void 0) database_default.data.config.diaAbertura = diaAbertura;
      if (horaAbertura !== void 0) database_default.data.config.horaAbertura = horaAbertura;
      if (diaFechamento !== void 0) database_default.data.config.diaFechamento = diaFechamento;
      if (horaFechamento !== void 0) database_default.data.config.horaFechamento = horaFechamento;
    }
    await database_default.write();
    res.json({ message: "Configura\xE7\xE3o salva com sucesso!" });
  });
  app2.get("/api/backup", async (req, res) => {
    try {
      const adapter2 = database_default.adapter;
      const latestData = await adapter2.read(true);
      if (latestData) {
        database_default.data = latestData;
      }
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", "attachment; filename=backup_sistema.json");
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.send(JSON.stringify(database_default.data, null, 2));
    } catch (error) {
      console.error("Erro ao gerar backup:", error);
      res.status(500).json({ error: "Erro ao gerar backup." });
    }
  });
  app2.post("/api/login", async (req, res) => {
    const { nome, telefone, senha } = req.body;
    logDebug(`Tentativa de login: Nome=${nome}, Telefone=${telefone}, Senha=${senha}`);
    try {
      await database_default.read();
      logDebug(`Total de ministros no banco: ${database_default.data?.ministros?.length || 0}`);
      const cleanPhone = (phone) => {
        if (!phone) return "";
        let num = phone.replace(/\D/g, "");
        if (num.startsWith("55") && (num.length === 12 || num.length === 13)) {
          num = num.substring(2);
        }
        return num;
      };
      const normalize2 = (s) => {
        if (typeof s !== "string") return "";
        return s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, " e ").replace(/\s+/g, " ").trim();
      };
      const loginPhone = cleanPhone(telefone);
      console.log(`Telefone limpo para login: ${loginPhone}`);
      console.log("Ministros cadastrados (primeiros 5):", database_default.data.ministros.slice(0, 5).map((m) => ({ nome: m.nome, telefone: m.telefone, telefoneConjuge: m.telefoneConjuge })));
      const candidateMinisters = database_default.data.ministros.filter(
        (m) => m.telefone && cleanPhone(m.telefone) === loginPhone || m.telefoneConjuge && cleanPhone(m.telefoneConjuge) === loginPhone
      );
      if (!candidateMinisters || candidateMinisters.length === 0) {
        logDebug(`Login falhou: Ministro n\xE3o encontrado para o telefone ${loginPhone}`);
        const debugInfo2 = {
          loginPhone,
          totalMinistros: database_default.data.ministros.length,
          samplePhones: database_default.data.ministros.slice(0, 5).map((m) => cleanPhone(m.telefone))
        };
        return res.status(401).json({ error: "Telefone ou senha inv\xE1lidos.", data: { debugInfo: debugInfo2 } });
      }
      const inputNomeNormalized = normalize2(nome);
      const matchName = (target, input) => {
        if (!target || !input) return false;
        const norm = normalize2(target);
        if (norm === input) return true;
        const first = norm.split(" ")[0];
        if (first && first === input) return true;
        if (norm.includes(" e ")) {
          const parts = norm.split(/\s+e\s+/).map((p) => p.trim());
          if (parts.some((p) => p === input || p.split(" ")[0] === input)) return true;
        }
        if (input.length >= 3 && (norm.startsWith(input) || norm.includes(input))) return true;
        return false;
      };
      let ministro = candidateMinisters.find((m) => {
        const isPrincipal2 = matchName(m.nomeExibicao, inputNomeNormalized) || matchName(m.nome, inputNomeNormalized);
        const isConjuge2 = matchName(m.nomeExibicaoConjuge, inputNomeNormalized) || matchName(m.nomeConjuge, inputNomeNormalized);
        return isPrincipal2 || isConjuge2;
      });
      if (!ministro) {
        ministro = candidateMinisters[0];
      }
      logDebug(`Ministro selecionado para login: ${ministro.nome} (Par\xF3quia: ${ministro.paroquia})`);
      const isPrincipal = matchName(ministro.nomeExibicao, inputNomeNormalized) || matchName(ministro.nome, inputNomeNormalized);
      const isConjuge = matchName(ministro.nomeExibicaoConjuge, inputNomeNormalized) || matchName(ministro.nomeConjuge, inputNomeNormalized);
      if (!isPrincipal && !isConjuge) {
        logDebug(`Login falhou: Nome "${nome}" n\xE3o corresponde ao cadastro para o telefone ${loginPhone}`);
        const debugInfo2 = {
          inputNomeNormalized,
          ministroNome: ministro.nome,
          ministroNomeConjuge: ministro.nomeConjuge,
          loginPhone
        };
        return res.status(401).json({ error: "O nome informado n\xE3o corresponde ao cadastro deste telefone.", data: { debugInfo: debugInfo2 } });
      }
      const isElaLogin = isConjuge && !isPrincipal;
      const isEleLogin = isPrincipal;
      const senhaCorreta = isElaLogin ? ministro.senhaConjuge || ministro.senha : ministro.senha;
      const debugInfo = {
        inputNome: nome,
        inputNomeNormalized,
        isPrincipal,
        isConjuge,
        ministroNome: ministro.nome,
        ministroNomeConjuge: ministro.nomeConjuge,
        isEleLogin,
        isElaLogin,
        senhaDigitada: senha,
        senhaCorreta
      };
      console.log(`Login debug:`, debugInfo);
      logDebug(`Login debug: ${JSON.stringify(debugInfo)}`);
      if (senha !== senhaCorreta) {
        return res.status(401).json({ error: "Telefone ou senha inv\xE1lidos.", data: { debugInfo } });
      }
      const isMaintenance = database_default.data?.config?.modoManutencao === true;
      if (isMaintenance && !isAlexandreOrAdmin(ministro) && !isAlexandreOrAdmin(nome) && !isAlexandreOrAdmin(telefone)) {
        return res.status(503).json({
          error: "O sistema est\xE1 temporariamente em manuten\xE7\xE3o preventiva para atualiza\xE7\xF5es. O acesso est\xE1 pausado temporariamente."
        });
      }
      if (ministro.aprovado === false) {
        return res.status(403).json({ error: "Seu cadastro est\xE1 pendente de aprova\xE7\xE3o pela Coordena\xE7\xE3o." });
      }
      let userResponse = { ...ministro };
      userResponse.isConjugeLogin = isElaLogin || isConjuge && !isPrincipal;
      userResponse.loggedInName = userResponse.isConjugeLogin ? ministro.nomeExibicaoConjuge || ministro.nomeConjuge : ministro.nomeExibicao || ministro.nome;
      let finalRole = ministro.role || "ministro";
      if (["coordenacao", "vice_coordenacao"].includes(finalRole) && ministro.tipo === "casal") {
        const acesso = ministro.acessoCoordenacao || "casal";
        if (acesso === "ele" && userResponse.isConjugeLogin) finalRole = "ministro";
        if (acesso === "ela" && !userResponse.isConjugeLogin) finalRole = "ministro";
      }
      userResponse.role = finalRole;
      userResponse.loginPhone = loginPhone;
      if (req.body.isCoordenador && !["coordenacao", "vice_coordenacao", "admin"].includes(finalRole)) {
        return res.status(401).json({ error: "Este cadastro n\xE3o possui perfil de Coordena\xE7\xE3o." });
      }
      const newSessionToken = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      const dbMinistro = database_default.data.ministros.find((m) => m.id === ministro.id);
      if (dbMinistro) {
        if (userResponse.isConjugeLogin) {
          dbMinistro.sessionTokenConjuge = newSessionToken;
        } else {
          dbMinistro.sessionToken = newSessionToken;
        }
        await database_default.write();
        logDebug(`Sess\xE3o gerada para ministro ID ${ministro.id}: ${newSessionToken} (isConjuge=${userResponse.isConjugeLogin})`);
      }
      userResponse.sessionToken = newSessionToken;
      const paroquia = database_default.data.paroquias?.find((p) => p.nome === ministro.paroquia);
      if (paroquia && paroquia.status === "bloqueado") {
        return res.status(403).json({ error: "Sua par\xF3quia est\xE1 bloqueada. Entre em contato com o administrador." });
      }
      res.json({ message: "Login bem-sucedido!", user: userResponse });
    } catch (error) {
      console.error("Erro no login:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.post("/api/admin/login", async (req, res) => {
    const { senha } = req.body;
    logDebug(`Admin Login Attempt: receivedPassword=${senha}`);
    try {
      await database_default.read();
      if (!database_default.data.config) database_default.data.config = { coordinatorEnabled: false, escalaPublicada: false, adminPassword: "999" };
      const adminPass = String(database_default.data.config.adminPassword || "999");
      logDebug(`Admin Stored Password: ${adminPass}`);
      if (String(senha) === adminPass) {
        logDebug("Admin Login Success");
        res.json({ message: "Login Admin bem-sucedido!", user: { nome: "Admin", role: "admin" } });
      } else {
        logDebug("Admin Login Failed: Incorrect password");
        res.status(401).json({ error: "Senha de administrador incorreta." });
      }
    } catch (error) {
      logDebug(`Admin Login Error: ${error}`);
      res.status(500).json({ error: "Erro no login admin." });
    }
  });
  app2.use("/api", (req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      logDebug(`[API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${Date.now() - start}ms)`);
    });
    next();
  });
  app2.post("/api/admin/change-password", async (req, res) => {
    const { novaSenha } = req.body;
    const adminPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,15}$/;
    if (!novaSenha || !adminPasswordRegex.test(novaSenha)) {
      return res.status(400).json({
        error: "A senha do Admin deve ter entre 8 e 15 caracteres, incluindo letras mai\xFAsculas, min\xFAsculas, n\xFAmeros e s\xEDmbolos."
      });
    }
    try {
      await database_default.read();
      if (!database_default.data.config) database_default.data.config = { coordinatorEnabled: false, escalaPublicada: false, adminPassword: "999" };
      database_default.data.config.adminPassword = novaSenha;
      await database_default.write();
      res.json({ message: "Senha alterada com sucesso!" });
    } catch (error) {
      res.status(500).json({ error: "Erro ao alterar senha admin." });
    }
  });
  app2.post("/api/ministros", async (req, res) => {
    const { nome, nomeExibicao, nomeExibicaoConjuge, telefone, dataNascimento, nomeConjuge, dataNascimentoConjuge, telefoneConjuge, paroquia, senha, senhaConjuge, role, aprovado, acessoCoordenacao, tipo, afastado, afastadoConjuge, tempoMinisterio, tempoMinisterioConjuge, incompatibilidades, isTesoureiro, isLider, isLiderConjuge } = req.body;
    console.log(`Tentativa de cadastro: Nome=${nome}, Telefone=${telefone}, Par\xF3quia=${paroquia}`);
    if (!nome || !telefone || !senha || !paroquia) {
      console.log("Cadastro falhou: Campos obrigat\xF3rios ausentes.");
      return res.status(400).json({ error: "Nome, telefone, senha e par\xF3quia s\xE3o obrigat\xF3rios." });
    }
    try {
      await database_default.read();
      const cleanInputPhone = (telefone || "").replace(/\D/g, "");
      const cleanInputPhoneConjuge = (telefoneConjuge || "").replace(/\D/g, "");
      if (!cleanInputPhone) {
        return res.status(400).json({ error: "O n\xFAmero de telefone \xE9 obrigat\xF3rio." });
      }
      const existingMinistro = database_default.data.ministros.find((m) => {
        const cleanDbPhone = (m.telefone || "").replace(/\D/g, "");
        const cleanDbPhoneConjuge = (m.telefoneConjuge || "").replace(/\D/g, "");
        const mainPhoneMatches = cleanInputPhone && (cleanDbPhone === cleanInputPhone || cleanDbPhoneConjuge === cleanInputPhone);
        const conjugePhoneMatches = cleanInputPhoneConjuge && (cleanDbPhone === cleanInputPhoneConjuge || cleanDbPhoneConjuge === cleanInputPhoneConjuge);
        return mainPhoneMatches || conjugePhoneMatches;
      });
      if (existingMinistro) {
        console.log(`Cadastro falhou: Telefone/DDD ${telefone} j\xE1 cadastrado.`);
        return res.status(409).json({ error: "Este n\xFAmero de telefone (DDD + telefone) j\xE1 possui um cadastro efetuado." });
      }
      const cleanName = (s) => s ? s.replace(/\s+&\s+/g, " e ") : s;
      const novoId = database_default.data.ministros.length > 0 ? Math.max(...database_default.data.ministros.map((m) => m.id)) + 1 : 1;
      const novoMinistro = {
        id: novoId,
        nome: cleanName(nome),
        nomeExibicao: cleanName(nomeExibicao),
        nomeExibicaoConjuge: cleanName(nomeExibicaoConjuge),
        telefone,
        telefoneConjuge,
        dataNascimento,
        nomeConjuge: cleanName(nomeConjuge),
        dataNascimentoConjuge,
        paroquia,
        senha,
        senhaConjuge,
        tipo: tipo || (nomeConjuge ? "casal" : "individual"),
        role: role || "ministro",
        acessoCoordenacao: acessoCoordenacao || "casal",
        aprovado: aprovado !== void 0 ? aprovado : false,
        tempoMinisterio: tempoMinisterio || "novo",
        tempoMinisterioConjuge: tempoMinisterioConjuge || "novo",
        afastado: afastado !== void 0 ? afastado : false,
        afastadoConjuge: afastadoConjuge !== void 0 ? afastadoConjuge : false,
        incompatibilidades: incompatibilidades || [],
        isTesoureiro: isTesoureiro !== void 0 ? isTesoureiro : false,
        isLider: isLider !== void 0 ? isLider : false,
        isLiderConjuge: isLiderConjuge !== void 0 ? isLiderConjuge : false
      };
      database_default.data.ministros.push(novoMinistro);
      await database_default.write();
      res.status(201).json({ message: "Cadastro realizado com sucesso!", user: novoMinistro });
    } catch (error) {
      console.error("Erro ao cadastrar ministro:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.get("/api/ministros", async (req, res) => {
    console.log("DEBUG_SERVER_MINISTROS", "request received");
    let { paroquia } = req.query;
    if (paroquia === "undefined" || paroquia === "null") paroquia = void 0;
    try {
      await database_default.read();
      if (!database_default.data || !database_default.data.ministros) {
        return res.json([]);
      }
      const targetParoquia = paroquia ? normalize(String(paroquia)) : null;
      const ministrosArr = [];
      database_default.data.ministros.forEach((m) => {
        if (!m) return;
        if (m.aprovado !== true || m.role === "admin") return;
        if (targetParoquia) {
          if (!m.paroquia) return;
          if (normalize(m.paroquia) !== targetParoquia) return;
        }
        ministrosArr.push(m);
      });
      ministrosArr.sort((a, b) => {
        const nameA = a.nomeExibicao || a.nome || "";
        const nameB = b.nomeExibicao || b.nome || "";
        return nameA.localeCompare(nameB);
      });
      res.json(ministrosArr);
    } catch (error) {
      console.error("Erro ao buscar ministros:", error);
      res.status(500).json({ error: "Erro ao buscar ministros." });
    }
  });
  app2.get("/api/ministros/aniversariantes", async (req, res) => {
    let { paroquia, mes } = req.query;
    if (paroquia === "undefined" || paroquia === "null") paroquia = void 0;
    if (mes === "undefined" || mes === "null") mes = void 0;
    try {
      await database_default.read();
      const ministrosFiltrados = (database_default.data.ministros || []).filter((m) => {
        if (paroquia && m.paroquia) {
          const mP = normalize(m.paroquia);
          const qP = normalize(paroquia);
          if (mP !== qP) return false;
        }
        return true;
      });
      const getAniversariantesForMonth = (mNum) => {
        return ministrosFiltrados.map((m) => {
          const results = [];
          const b1 = parseBirthday(m.dataNascimento);
          if (b1 && b1.month === mNum) {
            results.push({ nome: m.nome, dia: b1.day, mes: mNum, tipo: "Ministro", telefone: m.telefone });
          }
          const b2 = parseBirthday(m.dataNascimentoConjuge);
          if (b2 && b2.month === mNum) {
            results.push({ nome: m.nomeConjuge || "Ministro", dia: b2.day, mes: mNum, tipo: "Ministro", telefone: m.telefoneConjuge || m.telefone });
          }
          return results;
        }).flat().sort((a, b) => a.dia - b.dia);
      };
      if (mes === "all") {
        const allMonths = [];
        const monthNamesList = ["Janeiro", "Fevereiro", "Mar\xE7o", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        for (let m = 1; m <= 12; m++) {
          allMonths.push({
            mesNum: m,
            mesNome: monthNamesList[m - 1],
            aniversariantes: getAniversariantesForMonth(m)
          });
        }
        return res.json({ tipo: "all", data: allMonths });
      }
      const mesAtual = mes ? parseInt(mes) : (/* @__PURE__ */ new Date()).getMonth() + 1;
      const aniversariantes = getAniversariantesForMonth(mesAtual);
      res.json(aniversariantes);
    } catch (error) {
      console.error("Erro ao buscar aniversariantes:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.get("/api/ministros/:telefone", async (req, res) => {
    const { telefone } = req.params;
    try {
      await database_default.read();
      const cleanPhone = (p) => p ? p.replace(/\D/g, "") : "";
      const searchPhone = cleanPhone(telefone);
      const ministro = database_default.data.ministros.find(
        (m) => m.telefone && cleanPhone(m.telefone) === searchPhone || m.telefoneConjuge && cleanPhone(m.telefoneConjuge) === searchPhone
      );
      if (!ministro) {
        return res.status(404).json({ error: "Ministro n\xE3o encontrado." });
      }
      let responseData = { ...ministro };
      const isEle = cleanPhone(ministro.telefone) === searchPhone;
      const isEla = cleanPhone(ministro.telefoneConjuge) === searchPhone;
      responseData.isConjugeLogin = isEla;
      if (isEla) {
        console.log(`[DEBUG API] Swapping for spouse: ${ministro.nomeConjuge}`);
        responseData.nome = ministro.nomeConjuge;
        responseData.telefone = ministro.telefoneConjuge;
        responseData.dataNascimento = ministro.dataNascimentoConjuge;
        responseData.nomeConjuge = ministro.nome;
        responseData.telefoneConjuge = ministro.telefone;
        responseData.dataNascimentoConjuge = ministro.dataNascimento;
        console.log(`[DEBUG API] Spouse data swapped (no token swap)`);
      } else {
        console.log(`[DEBUG API] No swap needed for titular: ${ministro.nome}`);
      }
      let finalRole = ministro.role || "ministro";
      if (["coordenacao", "vice_coordenacao"].includes(finalRole) && ministro.tipo === "casal") {
        const acesso = ministro.acessoCoordenacao || "casal";
        if (acesso === "ele" && responseData.isConjugeLogin) finalRole = "ministro";
        if (acesso === "ela" && !responseData.isConjugeLogin) finalRole = "ministro";
      }
      responseData.role = finalRole;
      res.json(responseData);
    } catch (error) {
      console.error("Erro ao buscar ministro:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.put("/api/ministros/:telefone", async (req, res) => {
    const { telefone } = req.params;
    const { nome, nomeExibicao, nomeExibicaoConjuge, nomeConjuge, dataNascimento, dataNascimentoConjuge, paroquia, senha, senhaConjuge, telefone: novoTelefone, telefoneConjuge, tipo, role, acessoCoordenacao, afastado, afastadoConjuge, tempoMinisterio, tempoMinisterioConjuge, incompatibilidades, isTesoureiro, isLider, isLiderConjuge } = req.body;
    try {
      await database_default.read();
      const cleanPhone = (p) => p ? p.replace(/\D/g, "") : "";
      const searchPhone = cleanPhone(telefone);
      const ministro = database_default.data.ministros.find(
        (m) => m.telefone && cleanPhone(m.telefone) === searchPhone || m.telefoneConjuge && cleanPhone(m.telefoneConjuge) === searchPhone
      );
      if (!ministro) {
        return res.status(404).json({ error: "Ministro n\xE3o encontrado." });
      }
      const cleanName = (s) => s ? s.replace(/\s+&\s+/g, " e ") : s;
      if (nome) ministro.nome = cleanName(nome);
      ministro.cadastroCompleto = true;
      if (nomeExibicao !== void 0) ministro.nomeExibicao = cleanName(nomeExibicao);
      if (nomeExibicaoConjuge !== void 0) ministro.nomeExibicaoConjuge = cleanName(nomeExibicaoConjuge);
      if (novoTelefone !== void 0) {
        ministro.telefone = novoTelefone;
      }
      if (nomeConjuge !== void 0) ministro.nomeConjuge = cleanName(nomeConjuge);
      if (dataNascimento !== void 0) ministro.dataNascimento = dataNascimento;
      if (dataNascimentoConjuge !== void 0) ministro.dataNascimentoConjuge = dataNascimentoConjuge;
      if (paroquia !== void 0) ministro.paroquia = paroquia;
      const isCoordenadorRole = ["coordenacao", "vice_coordenacao"].includes(role !== void 0 ? role : ministro.role);
      const effectiveAcessoCoordenacao = acessoCoordenacao !== void 0 ? acessoCoordenacao : ministro.acessoCoordenacao;
      logDebug(`[DEBUG] Update password check: isCoordenadorRole=${isCoordenadorRole}, effectiveAcessoCoordenacao=${effectiveAcessoCoordenacao}, senha=${senha ? "***" : "undefined"}, senhaConjuge=${senhaConjuge ? "***" : "undefined"}`);
      if (senha !== void 0) {
        if (isCoordenadorRole && ["casal", "ele"].includes(effectiveAcessoCoordenacao) && !isComplexPassword(senha)) {
          return res.status(400).json({ error: "A senha do Coordenador ou Vice-Coordenador deve ter pelo menos 6 caracteres, contendo letras mai\xFAsculas, min\xFAsculas e caracteres especiais." });
        }
        ministro.senha = senha;
      }
      if (senhaConjuge !== void 0) {
        if (isCoordenadorRole && ["casal", "ela"].includes(effectiveAcessoCoordenacao) && !isComplexPassword(senhaConjuge)) {
          return res.status(400).json({ error: "A senha do c\xF4njuge do Coordenador ou Vice-Coordenador deve ter pelo menos 6 caracteres, contendo letras mai\xFAsculas, min\xFAsculas e caracteres especiais." });
        }
        ministro.senhaConjuge = senhaConjuge;
      }
      if (telefoneConjuge !== void 0) ministro.telefoneConjuge = telefoneConjuge;
      if (tipo !== void 0) ministro.tipo = tipo;
      if (role !== void 0) ministro.role = role;
      if (acessoCoordenacao !== void 0) ministro.acessoCoordenacao = acessoCoordenacao;
      if (afastado !== void 0) ministro.afastado = afastado;
      if (afastadoConjuge !== void 0) ministro.afastadoConjuge = afastadoConjuge;
      if (tempoMinisterio !== void 0) ministro.tempoMinisterio = tempoMinisterio;
      if (tempoMinisterioConjuge !== void 0) ministro.tempoMinisterioConjuge = tempoMinisterioConjuge;
      if (incompatibilidades !== void 0) ministro.incompatibilidades = incompatibilidades;
      if (isTesoureiro !== void 0) ministro.isTesoureiro = isTesoureiro;
      if (isLider !== void 0) ministro.isLider = isLider;
      if (isLiderConjuge !== void 0) ministro.isLiderConjuge = isLiderConjuge;
      await database_default.write();
      res.json({ message: "Dados atualizados com sucesso!", ministro });
    } catch (error) {
      console.error("Erro ao atualizar ministro:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.post("/api/reset-password", async (req, res) => {
    const { telefone } = req.body;
    try {
      await database_default.read();
      const cleanPhone = (phone) => phone ? phone.replace(/\D/g, "") : "";
      const searchPhone = cleanPhone(telefone);
      const ministro = database_default.data.ministros.find(
        (m) => m.telefone && cleanPhone(m.telefone) === searchPhone || m.telefoneConjuge && cleanPhone(m.telefoneConjuge) === searchPhone
      );
      if (!ministro) {
        return res.status(404).json({ error: "Ministro n\xE3o encontrado." });
      }
      const isCoordenador = ["coordenacao", "vice_coordenacao"].includes(ministro.role);
      const newPassword = isCoordenador ? `Temp@${Math.floor(100 + Math.random() * 900)}X` : Math.floor(100 + Math.random() * 900).toString();
      const isElaReset = cleanPhone(ministro.telefoneConjuge) === searchPhone;
      if (isElaReset) {
        ministro.senhaConjuge = newPassword;
      } else {
        ministro.senha = newPassword;
      }
      await database_default.write();
      res.json({ message: "Nova senha gerada com sucesso!", newPassword });
    } catch (error) {
      console.error("Erro ao resetar senha:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  const findBestMinisterMatch = (ministros, nome, telefone, nomeConjuge, paroquia) => {
    const cleanPhone = (phone) => {
      if (!phone) return "";
      let num = String(phone).replace(/\D/g, "");
      if (num.startsWith("55") && num.length > 11) num = num.slice(2);
      return num;
    };
    const normalizeName = (s) => {
      if (!s) return "";
      return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, " e ").replace(/\s+/g, " ").trim();
    };
    if (paroquia) {
      const normP = normalizeName(paroquia);
      const sameParish = ministros.filter((m) => !m.paroquia || normalizeName(m.paroquia) === normP);
      if (sameParish.length > 0) {
        ministros = sameParish;
      }
    }
    const targetPhone = cleanPhone(telefone);
    if (targetPhone && targetPhone.length >= 8) {
      const byPhone = ministros.find((m) => {
        const mP = cleanPhone(m.telefone);
        const mPC = cleanPhone(m.telefoneConjuge);
        return mP === targetPhone || mPC === targetPhone;
      });
      if (byPhone) return byPhone;
      return null;
    }
    if (!nome) return null;
    const n1 = normalizeName(nome);
    const c1 = nomeConjuge ? normalizeName(nomeConjuge) : "";
    const tokensN1 = n1.split(/\s+/).filter(Boolean);
    let bestMatch = null;
    let bestScore = 0;
    for (const m of ministros) {
      let score = 0;
      const n2 = normalizeName(m.nome || "");
      const conj = normalizeName(m.nomeConjuge || "");
      const tokensN2 = n2.split(/\s+/).filter(Boolean);
      if (m.tipo === "casal" && conj) {
        const tokensConj = conj.split(/\s+/).filter(Boolean);
        if (c1) {
          const tokensC1 = c1.split(/\s+/).filter(Boolean);
          const matchA = tokensN1[0] === tokensN2[0] && tokensC1[0] === tokensConj[0];
          const matchB = tokensN1[0] === tokensConj[0] && tokensC1[0] === tokensN2[0];
          if (matchA || matchB) score += 30;
        } else if (n1.includes(" e ")) {
          const parts = n1.split(" e ").map((x) => x.trim()).filter(Boolean);
          if (parts.length >= 2) {
            const p0Tokens = parts[0].split(/\s+/).filter(Boolean);
            const p1Tokens = parts[1].split(/\s+/).filter(Boolean);
            const matchA = p0Tokens[0] === tokensN2[0] && p1Tokens[0] === tokensConj[0];
            const matchB = p0Tokens[0] === tokensConj[0] && p1Tokens[0] === tokensN2[0];
            if (matchA || matchB) score += 30;
          }
        } else {
          if (tokensN1[0] && (tokensN1[0] === tokensN2[0] || tokensN1[0] === tokensConj[0])) {
            score += 10;
          }
        }
      } else {
        if (tokensN1.length > 0 && tokensN2.length > 0 && tokensN1[0] === tokensN2[0]) {
          if (tokensN1.join(" ") === tokensN2.join(" ")) {
            score += 30;
          } else if (tokensN1[tokensN1.length - 1] === tokensN2[tokensN2.length - 1]) {
            score += 25;
          } else if (tokensN1.length === 1 || tokensN2.length === 1) {
            score += 15;
          }
        }
      }
      if (score > bestScore && score >= 10) {
        bestScore = score;
        bestMatch = m;
      }
    }
    return bestMatch;
  };
  function getDisponibilidadeStatus(config, ministro, paroquia) {
    const agora = getBrazilDate();
    const finalParoquia = (ministro?.paroquia || paroquia || "").toString().trim();
    let estaNoPeriodoAgendado = false;
    const agendamento = config.agendamentoPorParoquia?.[finalParoquia] || {};
    const diaAbertura = agendamento.diaAbertura !== void 0 && agendamento.diaAbertura !== "" ? agendamento.diaAbertura : config.diaAbertura;
    const horaAbertura = agendamento.horaAbertura || config.horaAbertura;
    const diaFechamento = agendamento.diaFechamento !== void 0 && agendamento.diaFechamento !== "" ? agendamento.diaFechamento : config.diaFechamento;
    const horaFechamento = agendamento.horaFechamento || config.horaFechamento;
    if (diaAbertura && horaAbertura && typeof horaAbertura === "string" && horaAbertura.includes(":") && diaFechamento && horaFechamento && typeof horaFechamento === "string" && horaFechamento.includes(":")) {
      const [hA, mA] = horaAbertura.split(":").map(Number);
      const [hF, mF] = horaFechamento.split(":").map(Number);
      const dataAbertura = new Date(agora.getFullYear(), agora.getMonth(), diaAbertura, hA, mA, 0, 0);
      const dataFechamento = new Date(agora.getFullYear(), agora.getMonth(), diaFechamento, hF, mF, 59, 999);
      if (dataFechamento < dataAbertura) {
        dataFechamento.setMonth(dataFechamento.getMonth() + 1);
      }
      if (agora >= dataAbertura && agora <= dataFechamento) {
        estaNoPeriodoAgendado = true;
      } else {
        const dAMesAnt = new Date(dataAbertura);
        dAMesAnt.setMonth(dAMesAnt.getMonth() - 1);
        const dFMesAnt = new Date(dataFechamento);
        dFMesAnt.setMonth(dFMesAnt.getMonth() - 1);
        if (agora >= dAMesAnt && agora <= dFMesAnt) {
          estaNoPeriodoAgendado = true;
        }
      }
    }
    const manualOverride = finalParoquia && config.disponibilidadeAbertaPorParoquia ? config.disponibilidadeAbertaPorParoquia[finalParoquia] : void 0;
    const aberta = manualOverride !== void 0 ? manualOverride : config.disponibilidadeAberta || estaNoPeriodoAgendado;
    let temExcecao = false;
    if (ministro?.excecaoAcessoAte) {
      const dataExcecao = new Date(ministro.excecaoAcessoAte);
      if (dataExcecao > agora) {
        temExcecao = true;
      }
    }
    return { aberta, estaNoPeriodoAgendado, manualOverride, temExcecao };
  }
  app2.post("/api/disponibilidade", async (req, res) => {
    const { ministro_id, nome, telefone, disponibilidade, tipo, nomeConjuge, paroquia, isCoordenador } = req.body;
    const role = (req.body.role || "").toLowerCase().trim();
    const isCoordenadorRequest = isCoordenador === true || role === "admin" || role === "coordenador" || role === "coordenacao" || role === "vice_coordenacao" || role.includes("coordena");
    logDebug(`POST /api/disponibilidade recebido: ${JSON.stringify(req.body)}`);
    logDebug(`POST /api/disponibilidade recebido: ministro_id=${ministro_id}, nome=${nome}, paroquia=${paroquia}, disponibilidade.length=${disponibilidade?.length}, isCoordenadorRequest=${isCoordenadorRequest}`);
    if (!nome || !disponibilidade || !Array.isArray(disponibilidade)) {
      return res.status(400).json({ error: "Nome e lista de disponibilidade s\xE3o obrigat\xF3rios." });
    }
    if (!isCoordenadorRequest && (!telefone || disponibilidade.length < 2)) {
      return res.status(400).json({ error: "Nome, telefone e pelo menos duas missas s\xE3o obrigat\xF3rios para ministros." });
    }
    try {
      await database_default.read();
      let ministro = null;
      if (ministro_id) {
        const ministroIdNum = parseInt(ministro_id);
        ministro = database_default.data.ministros.find((m) => m.id === ministroIdNum);
      }
      if (!ministro) {
        ministro = findBestMinisterMatch(database_default.data.ministros, nome, telefone, nomeConjuge, paroquia);
      }
      const finalParoquia = (ministro?.paroquia || paroquia || "").toString().trim();
      const config = database_default.data.config || {
        coordinatorEnabled: false,
        escalaPublicada: false,
        disponibilidadeAberta: false
      };
      if (config.modoManutencao === true) {
        logDebug(`Bloqueio modoManutencao para envio de disponibilidade de ${nome}`);
        return res.status(503).json({
          error: "O sistema est\xE1 em modo de manuten\xE7\xE3o preventiva. Altera\xE7\xF5es e inclus\xF5es de disponibilidade est\xE3o bloqueadas."
        });
      }
      const { aberta, estaNoPeriodoAgendado, manualOverride, temExcecao } = getDisponibilidadeStatus(config, ministro, finalParoquia);
      logDebug(`Checking availability for ${nome} (${finalParoquia}): manualOverride=${manualOverride}, global=${config.disponibilidadeAberta}, estaNoPeriodo=${estaNoPeriodoAgendado}, temExcecao=${temExcecao}, isCoordenadorRequest=${isCoordenadorRequest}`);
      if (!aberta && !temExcecao && !isCoordenadorRequest) {
        logDebug(`Access denied for ${nome}: aberta=${aberta}, temExcecao=${temExcecao}, isCoordenadorRequest=${isCoordenadorRequest}`);
        return res.status(403).json({ error: "O per\xEDodo de preenchimento da disponibilidade est\xE1 encerrado. Entre em contato com a coordena\xE7\xE3o." });
      }
      let final_ministro_id;
      if (ministro) {
        final_ministro_id = ministro.id;
        if (!ministro.nome && nome) {
          ministro.nome = nome;
        }
        if (tipo) {
          ministro.tipo = tipo;
        }
        if (nomeConjuge && !ministro.nomeConjuge) {
          ministro.nomeConjuge = nomeConjuge;
        }
      } else {
        const novoId = database_default.data.ministros.length > 0 ? Math.max(...database_default.data.ministros.map((m) => m.id)) + 1 : 1;
        const novoMinistro = {
          id: novoId,
          nome,
          telefone,
          tipo: tipo || "individual",
          nomeConjuge: nomeConjuge || "",
          paroquia: finalParoquia,
          aprovado: false,
          role: "ministro"
        };
        database_default.data.ministros.push(novoMinistro);
        final_ministro_id = novoId;
      }
      const targetMonthYear = disponibilidade.length > 0 ? `${disponibilidade[0].data.split("-")[0]}-${disponibilidade[0].data.split("-")[1]}` : (() => {
        const today = /* @__PURE__ */ new Date();
        const targetDate = new Date(today.getFullYear(), today.getDate() >= 20 ? today.getMonth() + 1 : today.getMonth(), 1);
        return `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`;
      })();
      database_default.data.disponibilidades = database_default.data.disponibilidades.filter(
        (d) => !(d.ministro_id === final_ministro_id && d.data.startsWith(targetMonthYear))
      );
      const ministroAtualizado = database_default.data.ministros.find((m) => m.id === final_ministro_id);
      if (ministroAtualizado) {
        ministroAtualizado.disponibilidadeConfirmada = true;
        ministroAtualizado.excecaoAcessoAte = null;
      }
      let proxIdDisp = database_default.data.disponibilidades.length > 0 ? Math.max(...database_default.data.disponibilidades.map((d) => d.id)) + 1 : 1;
      for (const slot of disponibilidade) {
        logDebug(`Salvando disponibilidade: ministro_id=${final_ministro_id}, data=${slot.data}, horario=${slot.horario}, nomeMissa=${slot.nomeMissa}`);
        database_default.data.disponibilidades.push({
          id: proxIdDisp++,
          ministro_id: final_ministro_id,
          data: slot.data,
          horario: slot.horario,
          nomeMissa: slot.nomeMissa,
          modo: slot.modo || "individual",
          paroquia: finalParoquia
          // Save parish for easier filtering
        });
      }
      await database_default.write();
      res.status(201).json({ message: "Disponibilidade salva com sucesso!" });
    } catch (error) {
      console.error("Erro ao salvar disponibilidade:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.get("/api/disponibilidade", async (req, res) => {
    const { paroquia } = req.query;
    try {
      await database_default.read();
      let dbChanged = false;
      let disponibilidades = database_default.data.disponibilidades || [];
      if (paroquia) {
        const targetParoquia = normalize(String(paroquia));
        disponibilidades = disponibilidades.filter((d) => {
          const dParoquia = normalize(d.paroquia);
          if (dParoquia === targetParoquia) return true;
          let ministro = database_default.data.ministros.find((m) => String(m.id) === String(d.ministro_id));
          if (!ministro && (d.nome || d.telefone)) {
            ministro = findBestMinisterMatch(database_default.data.ministros, d.nome, d.telefone, d.nomeConjuge, d.paroquia || paroquia);
            if (ministro) {
              d.ministro_id = ministro.id;
              dbChanged = true;
            }
          }
          const mParoquia = normalize(ministro?.paroquia);
          return mParoquia === targetParoquia;
        });
      }
      const grouped = disponibilidades.reduce((acc, curr) => {
        let minId = curr.ministro_id;
        let ministro = null;
        if (minId) {
          ministro = database_default.data.ministros.find((m) => String(m.id) === String(minId));
        }
        if (!ministro && (curr.nome || curr.telefone)) {
          ministro = findBestMinisterMatch(database_default.data.ministros, curr.nome, curr.telefone, curr.nomeConjuge, curr.paroquia || paroquia);
          if (ministro) {
            minId = ministro.id;
            curr.ministro_id = ministro.id;
            dbChanged = true;
          }
        }
        if (!ministro && minId) {
          ministro = database_default.data.ministros.find((m) => m.id === minId);
        }
        if (ministro && ministro.tipo === "individual" && curr.modo === "casal") {
          const correctCouple = database_default.data.ministros.find((m) => m.tipo === "casal" && (m.telefone === ministro.telefone || m.nome.includes(ministro.nome)));
          if (correctCouple) {
            ministro = correctCouple;
            minId = correctCouple.id;
            if (curr.ministro_id !== correctCouple.id) {
              curr.ministro_id = correctCouple.id;
              dbChanged = true;
            }
          }
        }
        const key = minId || curr.telefone || curr.nome || Math.random().toString();
        if (!acc[key]) {
          if (ministro) {
            acc[key] = {
              ministro_id: ministro.id,
              nome: ministro.nome,
              nomeExibicao: ministro.nomeExibicao,
              nomeExibicaoConjuge: ministro.nomeExibicaoConjuge,
              telefone: ministro.telefone,
              nomeConjuge: ministro.nomeConjuge,
              tipo: ministro.tipo || "individual",
              disponibilidade: []
            };
          } else {
            acc[key] = {
              ministro_id: null,
              nome: curr.nome || "Desconhecido",
              nomeExibicao: curr.nomeExibicao || curr.nome || "Desconhecido",
              nomeExibicaoConjuge: curr.nomeExibicaoConjuge || curr.nomeConjuge || "",
              telefone: curr.telefone || "",
              nomeConjuge: "",
              tipo: "individual",
              disponibilidade: []
            };
          }
        }
        acc[key].disponibilidade.push({
          data: curr.data,
          horario: curr.horario,
          nomeMissa: curr.nomeMissa,
          modo: curr.modo
        });
        return acc;
      }, {});
      if (dbChanged) {
        await database_default.write();
        console.log("Database updated with corrected minister IDs.");
      }
      res.json(Object.values(grouped));
    } catch (error) {
      console.error("Erro ao buscar disponibilidades:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.get("/api/disponibilidade/:telefone", async (req, res) => {
    const { telefone } = req.params;
    try {
      await database_default.read();
      const cleanPhone = (p) => p ? p.replace(/\D/g, "") : "";
      const searchPhone = cleanPhone(telefone);
      const ministro = database_default.data.ministros.find(
        (m) => m.telefone && cleanPhone(m.telefone) === searchPhone || m.telefoneConjuge && cleanPhone(m.telefoneConjuge) === searchPhone
      );
      if (!ministro) {
        return res.json([]);
      }
      const { mes, ano } = req.query;
      let disponibilidades = database_default.data.disponibilidades.filter((d) => d.ministro_id === ministro.id);
      if (mes && ano) {
        const m = parseInt(mes, 10);
        const y = parseInt(ano, 10);
        disponibilidades = disponibilidades.filter((d) => {
          const date = /* @__PURE__ */ new Date(d.data + "T00:00:00");
          return date.getMonth() + 1 === m && date.getFullYear() === y;
        });
      }
      const result = disponibilidades.map((d) => {
        return { data: d.data, horario: d.horario, nomeMissa: d.nomeMissa, modo: d.modo };
      });
      res.json(result);
    } catch (error) {
      console.error("Erro ao buscar disponibilidade do ministro:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.get("/api/vagas", async (req, res) => {
    fs.appendFileSync("debug.log", `${(/* @__PURE__ */ new Date()).toISOString()} - [DEBUG /api/vagas] Route HIT. Params: ${JSON.stringify(req.query)}
`);
    const { paroquia, mes, ano } = req.query;
    const targetMonth = mes ? parseInt(String(mes)) : null;
    const targetYear = ano ? parseInt(String(ano)) : null;
    fs.appendFileSync("debug.log", `${(/* @__PURE__ */ new Date()).toISOString()} - [DEBUG /api/vagas] Entry. Paroquia: ${paroquia}, Mes: ${mes}, Ano: ${ano}
`);
    try {
      await database_default.read();
      const contagem = {};
      let disponibilidades = database_default.data.disponibilidades || [];
      console.log(`[DEBUG /api/vagas] Total initial disponibilidades: ${disponibilidades.length}`);
      fs.appendFileSync("debug.log", `${(/* @__PURE__ */ new Date()).toISOString()} - [DEBUG /api/vagas] Total initial disponibilidades: ${disponibilidades.length}
`);
      if (paroquia) {
        const targetParoquia = normalize(String(paroquia));
        disponibilidades = disponibilidades.filter((d) => {
          const dParoquia = normalize(d.paroquia);
          if (dParoquia === targetParoquia) return true;
          const ministro = database_default.data.ministros.find((m) => String(m.id) === String(d.ministro_id));
          const mParoquia = normalize(ministro?.paroquia);
          return mParoquia === targetParoquia;
        });
        console.log(`[DEBUG /api/vagas] Disponibilidades ap\xF3s filtro paroquia ("${paroquia}"): ${disponibilidades.length}`);
        fs.appendFileSync("debug.log", `${(/* @__PURE__ */ new Date()).toISOString()} - [DEBUG /api/vagas] Disponibilidades ap\xF3s filtro paroquia ("${paroquia}"): ${disponibilidades.length}
`);
      }
      if (targetMonth && !isNaN(targetMonth) && targetYear && !isNaN(targetYear)) {
        disponibilidades = disponibilidades.filter((d) => {
          if (!d.data) return false;
          const [y, m, d_day] = d.data.split("-").map(Number);
          return m === targetMonth && y === targetYear;
        });
      }
      for (const disp of disponibilidades) {
        const normModo = normalizeModo(disp.modo);
        let isCasal = normModo === "casal";
        if (!disp.modo) {
          const ministro2 = database_default.data.ministros.find((m) => String(m.id) === String(disp.ministro_id));
          if (ministro2 && ministro2.tipo === "casal") isCasal = true;
        }
        let peso = isCasal ? 2 : 1;
        let nomeParaChave = disp.nomeMissa || disp.nome || "";
        let chave = `${disp.data}-${disp.horario}-${normalize(nomeParaChave)}`;
        fs.appendFileSync("debug.log", `${(/* @__PURE__ */ new Date()).toISOString()} - [DEBUG /api/vagas] Chave gerada: "${chave}" (Data: ${disp.data}, Horario: ${disp.horario}, Nome: "${nomeParaChave}")
`);
        if (!contagem[chave]) {
          contagem[chave] = { total: 0, casal: 0, individual: 0, ministros: [] };
        }
        contagem[chave].total += peso;
        if (isCasal) contagem[chave].casal += 1;
        else contagem[chave].individual += 1;
        const altChave1 = `${disp.data}_${disp.horario}_${normalize(nomeParaChave)}`;
        const altChave2 = `${disp.data}_${disp.horario}_${nomeParaChave}`;
        contagem[altChave1] = contagem[chave];
        contagem[altChave2] = contagem[chave];
        const ministro = database_default.data.ministros.find((m) => String(m.id) === String(disp.ministro_id));
        if (ministro) {
          let nomeExibicao = ministro.nomeExibicao || ministro.nome;
          if (isCasal) {
            const n1 = ministro.nomeExibicao || ministro.nome;
            const n2 = ministro.nomeExibicaoConjuge || ministro.nomeConjuge;
            nomeExibicao = `${n1} e ${n2}`;
          } else if (normModo === "ela") {
            nomeExibicao = ministro.nomeExibicaoConjuge || ministro.nomeConjuge;
          } else if (normModo === "ele") {
            nomeExibicao = ministro.nomeExibicao || ministro.nome;
          }
          contagem[chave].ministros.push({
            id: ministro.id,
            nome: nomeExibicao,
            tipo: ministro.tipo,
            isCasalActive: isCasal
          });
        }
      }
      res.json(contagem);
    } catch (error) {
      console.error("Erro ao buscar vagas:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.post("/api/mensagens", async (req, res) => {
    const { nome, telefone, mensagem, paroquia, type } = req.body;
    if (!nome || !mensagem || !paroquia) {
      return res.status(400).json({ error: "Nome, mensagem e par\xF3quia s\xE3o obrigat\xF3rios." });
    }
    try {
      await database_default.read();
      if (!database_default.data.mensagens) {
        database_default.data.mensagens = [];
      }
      database_default.data.mensagens.push({
        id: Date.now(),
        nome,
        telefone,
        destinatario_telefone: req.body.destinatario_telefone || null,
        texto: mensagem,
        paroquia,
        type: type || "broadcast",
        data: (/* @__PURE__ */ new Date()).toISOString()
      });
      await database_default.write();
      if (req.body.destinatario_telefone) {
        sendPushNotificationToUser(req.body.destinatario_telefone, "Nova Mensagem \u{1F4E9}", mensagem, "/", paroquia);
      } else {
        sendPushNotificationToParoquia(paroquia, "Comunicado da Coordena\xE7\xE3o \u{1F4E2}", mensagem, "/");
      }
      res.status(201).json({ message: "Mensagem enviada com sucesso!" });
    } catch (error) {
      console.error("Erro ao salvar mensagem:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.post("/api/comunhao", async (req, res) => {
    try {
      await database_default.read();
      if (!database_default.data.comunhao) database_default.data.comunhao = [];
      console.log("[DEBUG] Server Saving Communion:", req.body);
      database_default.data.comunhao.push({
        id: Date.now(),
        ...req.body,
        ministro_id: Number(req.body.ministro_id),
        dataCadastro: (/* @__PURE__ */ new Date()).toISOString()
      });
      await database_default.write();
      res.status(201).json({ message: "Cadastro de comunh\xE3o realizado com sucesso!" });
    } catch (error) {
      console.error("Erro ao salvar comunh\xE3o:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.delete("/api/comunhao/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await database_default.read();
      if (!database_default.data.comunhao) return res.status(404).json({ error: "Nenhuma comunh\xE3o encontrada." });
      const index = database_default.data.comunhao.findIndex((c) => String(c.id) === String(id));
      if (index === -1) return res.status(404).json({ error: "Comunh\xE3o n\xE3o encontrada." });
      database_default.data.comunhao.splice(index, 1);
      await database_default.write();
      res.json({ message: "Comunh\xE3o exclu\xEDda com sucesso!" });
    } catch (error) {
      console.error("Erro ao excluir comunh\xE3o:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.put("/api/comunhao/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await database_default.read();
      if (!database_default.data.comunhao) return res.status(404).json({ error: "Nenhuma comunh\xE3o encontrada." });
      const index = database_default.data.comunhao.findIndex((c) => String(c.id) === String(id));
      if (index === -1) return res.status(404).json({ error: "Comunh\xE3o n\xE3o encontrada." });
      database_default.data.comunhao[index] = {
        ...database_default.data.comunhao[index],
        ...req.body,
        ministro_id: Number(req.body.ministro_id),
        id: Number(id)
      };
      await database_default.write();
      res.json({ message: "Comunh\xE3o atualizada com sucesso!" });
    } catch (error) {
      console.error("Erro ao atualizar comunh\xE3o:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.get("/api/comunhao/:ministro_id", async (req, res) => {
    const { ministro_id } = req.params;
    try {
      await database_default.read();
      const ministro_id_num = Number(ministro_id);
      const main_id = Math.floor(ministro_id_num);
      const spouse_id = main_id + 0.5;
      const ministro = database_default.data.ministros.find((m) => Number(m.id) === main_id);
      const comunhoes = (database_default.data.comunhao || []).filter((c) => {
        const cid = Number(c.ministro_id);
        if (ministro && ministro.tipo === "casal") {
          return cid === main_id || cid === spouse_id;
        } else {
          return cid === ministro_id_num;
        }
      }).map((c) => {
        const id = Number(c.ministro_id);
        const main_id2 = Math.floor(id);
        const ministro2 = database_default.data.ministros.find((m) => Number(m.id) === main_id2);
        let ministro_nome = "Desconhecido";
        if (ministro2) {
          if (id === main_id2) {
            ministro_nome = ministro2.nomeExibicao || ministro2.nome;
          } else if (id === main_id2 + 0.5) {
            ministro_nome = ministro2.nomeExibicaoConjuge || ministro2.nomeConjuge || "Desconhecido";
          }
        }
        return { ...c, ministro_nome };
      });
      res.json(comunhoes);
    } catch (error) {
      console.error("Erro ao buscar comunh\xF5es:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.get("/api/comunhao/paroquia/:paroquia", async (req, res) => {
    const { paroquia } = req.params;
    try {
      await database_default.read();
      const targetParoquia = normalize(paroquia);
      const comunhoes = (database_default.data.comunhao || []).filter((c) => {
        const ministro = database_default.data.ministros.find((m) => {
          const id = Number(c.ministro_id);
          const main_id = Math.floor(id);
          return Number(m.id) === main_id;
        });
        const matchCParoquia = c.paroquia && normalize(c.paroquia) === targetParoquia;
        const matchMParoquia = ministro && normalize(ministro.paroquia) === targetParoquia;
        const isClinica = c.tipoAtendimento === "clinica";
        const isFamilia = c.tipoAtendimento === "familia";
        console.log(`[DEBUG] Communion ${c.id}: paroquia=${c.paroquia}, tipo=${c.tipoAtendimento}, matchC=${matchCParoquia}, matchM=${matchMParoquia}, isClinica=${isClinica}, isFamilia=${isFamilia}`);
        return matchCParoquia || matchMParoquia || isClinica || isFamilia;
      }).map((c) => {
        const id = Number(c.ministro_id);
        const main_id = Math.floor(id);
        const ministro = database_default.data.ministros.find((m) => Number(m.id) === main_id);
        let ministro_nome = "Desconhecido";
        if (ministro) {
          if (id === main_id) {
            ministro_nome = ministro.nomeExibicao || ministro.nome;
          } else if (id === main_id + 0.5) {
            ministro_nome = `${ministro.nomeExibicao || ministro.nome} e ${ministro.nomeExibicaoConjuge || ministro.nomeConjuge}`;
          }
        }
        return { ...c, ministro_nome };
      });
      res.json(comunhoes);
    } catch (error) {
      console.error("Erro ao buscar comunh\xF5es da par\xF3quia:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.get("/api/comunhao/:ministroId", async (req, res) => {
    const { ministroId } = req.params;
    try {
      await database_default.read();
      const mainId = Math.floor(Number(ministroId));
      const comunhoes = (database_default.data.comunhao || []).filter((c) => {
        const id = Number(c.ministro_id);
        const main_id = Math.floor(id);
        return main_id === mainId;
      }).map((c) => {
        const id = Number(c.ministro_id);
        const main_id = Math.floor(id);
        const ministro = database_default.data.ministros.find((m) => Number(m.id) === main_id);
        let ministro_nome = "Desconhecido";
        if (ministro) {
          if (id === main_id) {
            ministro_nome = ministro.nomeExibicao || ministro.nome;
          } else if (id === main_id + 0.5) {
            ministro_nome = `${ministro.nomeExibicao || ministro.nome} e ${ministro.nomeExibicaoConjuge || ministro.nomeConjuge}`;
          }
        }
        return { ...c, ministro_nome };
      });
      res.json(comunhoes);
    } catch (error) {
      console.error("Erro ao buscar comunh\xF5es do ministro:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.get("/api/faltas", async (req, res) => {
    const { paroquia, mes, ministroId } = req.query;
    if (!paroquia || paroquia === "undefined" || paroquia === "null") {
      return res.status(400).json({ error: "Par\xF3quia n\xE3o informada ou inv\xE1lida." });
    }
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      await database_default.read();
      if (!database_default.data) return res.json([]);
      if (!database_default.data.faltas) database_default.data.faltas = [];
      const initialFaltasCount = database_default.data.faltas.length;
      database_default.data.faltas = database_default.data.faltas.filter((f) => {
        if (!f) return false;
        const reg = String(f.registradoPor || "");
        if (reg.startsWith("L\xEDder:") || reg.startsWith("Lider:")) {
          return false;
        }
        if (f.justificativa === "Falta reportada pelo L\xEDder da Missa") {
          return false;
        }
        return true;
      });
      if (database_default.data.faltas.length !== initialFaltasCount) {
        await database_default.write();
      }
      const targetParoquia = normalize(String(paroquia));
      let list = database_default.data.faltas.filter((f) => f && f.paroquia && normalize(f.paroquia) === targetParoquia);
      if (mes) {
        list = list.filter((f) => f.data && f.data.startsWith(String(mes)));
      }
      if (ministroId) {
        list = list.filter((f) => String(f.ministroId) === String(ministroId));
      }
      list.sort((a, b) => {
        const dCompare = (b.data || "").localeCompare(a.data || "");
        if (dCompare !== 0) return dCompare;
        return (b.horario || "").localeCompare(a.horario || "");
      });
      res.json(list);
    } catch (error) {
      console.error("Erro ao buscar faltas:", error);
      res.status(500).json({ error: "Erro interno ao buscar faltas." });
    }
  });
  app2.post("/api/faltas", async (req, res) => {
    const { paroquia, data, horario, ministroId, ministroNome, quantidade, tipoFalta, justificativa, registradoPor } = req.body;
    if (!paroquia || !data || !horario || !ministroId || !ministroNome) {
      return res.status(400).json({ error: "Campos obrigat\xF3rios ausentes (paroquia, data, horario, ministroId, ministroNome)." });
    }
    try {
      await database_default.read();
      if (!database_default.data) database_default.data = {};
      if (!database_default.data.faltas) database_default.data.faltas = [];
      let qtd = 1;
      if (typeof quantidade === "number" && quantidade > 0) {
        qtd = quantidade;
      } else if (tipoFalta === "ambos") {
        qtd = 2;
      } else {
        const norm = normalize(String(ministroNome || ""));
        if (norm.includes(" e ") || norm.includes(" & ") || norm.includes(" / ")) {
          qtd = 2;
        }
      }
      const novaFalta = {
        id: Date.now().toString() + "_" + Math.random().toString(36).substring(2, 7),
        paroquia: String(paroquia).trim(),
        data: String(data).trim(),
        // YYYY-MM-DD
        horario: String(horario).trim(),
        // e.g. "08:00"
        ministroId: String(ministroId).trim(),
        ministroNome: String(ministroNome).trim(),
        quantidade: qtd,
        tipoFalta: tipoFalta || (qtd === 2 ? "ambos" : "individual"),
        justificativa: justificativa ? String(justificativa).trim() : "",
        registradoPor: registradoPor ? String(registradoPor).trim() : "",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      database_default.data.faltas.push(novaFalta);
      await database_default.write();
      res.status(201).json({ success: true, falta: novaFalta });
    } catch (error) {
      console.error("Erro ao registrar falta:", error);
      res.status(500).json({ error: "Erro interno ao registrar falta." });
    }
  });
  app2.delete("/api/faltas/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await database_default.read();
      if (!database_default.data || !database_default.data.faltas) {
        return res.status(404).json({ error: "Registro n\xE3o encontrado." });
      }
      const index = database_default.data.faltas.findIndex((f) => String(f.id) === String(id));
      if (index === -1) {
        return res.status(404).json({ error: "Registro de falta n\xE3o encontrado." });
      }
      database_default.data.faltas.splice(index, 1);
      await database_default.write();
      res.json({ success: true, message: "Registro de falta removido com sucesso." });
    } catch (error) {
      console.error("Erro ao remover falta:", error);
      res.status(500).json({ error: "Erro interno ao remover falta." });
    }
  });
  app2.get("/api/relatorios-lider", async (req, res) => {
    const { paroquia, data, horario } = req.query;
    try {
      await database_default.read();
      if (!database_default.data) database_default.data = {};
      if (!database_default.data.relatoriosLider) database_default.data.relatoriosLider = [];
      const targetParoquia = paroquia ? normalize(String(paroquia)) : "";
      let list = database_default.data.relatoriosLider.filter((r) => r && r.paroquia && normalize(r.paroquia) === targetParoquia);
      if (data) {
        list = list.filter((r) => r.data === String(data));
      }
      if (horario) {
        list = list.filter((r) => r.horario === String(horario));
      }
      res.json(list);
    } catch (error) {
      console.error("Erro ao buscar relat\xF3rios de l\xEDder:", error);
      res.status(500).json({ error: "Erro interno ao buscar relat\xF3rios de l\xEDder." });
    }
  });
  app2.post("/api/relatorios-lider", async (req, res) => {
    const { paroquia, data, horario, liderNome, presencas, faltasReportadas, trocasNaoRegistradas, usoEstoque, observacoes, semAlteracao } = req.body;
    if (!paroquia || !data || !horario || !liderNome) {
      return res.status(400).json({ error: "Campos obrigat\xF3rios ausentes (paroquia, data, horario, liderNome)." });
    }
    try {
      await database_default.read();
      if (!database_default.data) database_default.data = {};
      if (!database_default.data.relatoriosLider) database_default.data.relatoriosLider = [];
      if (!database_default.data.faltas) database_default.data.faltas = [];
      const normalizedParoquia = String(paroquia).trim();
      const existingIdx = database_default.data.relatoriosLider.findIndex(
        (r) => normalize(r.paroquia) === normalize(normalizedParoquia) && r.data === String(data) && r.horario === String(horario)
      );
      const novoRelatorio = {
        id: existingIdx !== -1 ? database_default.data.relatoriosLider[existingIdx].id : Date.now().toString() + "_" + Math.random().toString(36).substring(2, 7),
        paroquia: normalizedParoquia,
        data: String(data).trim(),
        horario: String(horario).trim(),
        liderNome: String(liderNome).trim(),
        presencas: presencas || {},
        // { "Nome do Ministro": true/false }
        faltasReportadas: faltasReportadas || [],
        // [{ ministroNome: string, ministroId?: string, justificativa?: string }]
        trocasNaoRegistradas: trocasNaoRegistradas ? String(trocasNaoRegistradas).trim() : "",
        usoEstoque: usoEstoque ? String(usoEstoque).trim() : "",
        observacoes: observacoes ? String(observacoes).trim() : "",
        semAlteracao: Boolean(semAlteracao),
        lidoPorCoordenacao: req.body.lidoPorCoordenacao !== void 0 ? Boolean(req.body.lidoPorCoordenacao) : false,
        lidoEm: req.body.lidoPorCoordenacao ? (/* @__PURE__ */ new Date()).toISOString() : null,
        lidoPor: req.body.lidoPorCoordenacao ? req.body.usuarioNome || "Coordena\xE7\xE3o" : null,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (existingIdx !== -1) {
        database_default.data.relatoriosLider[existingIdx] = novoRelatorio;
      } else {
        database_default.data.relatoriosLider.push(novoRelatorio);
      }
      await database_default.write();
      res.status(200).json({ success: true, relatorio: novoRelatorio });
    } catch (error) {
      console.error("Erro ao salvar relat\xF3rio de l\xEDder:", error);
      res.status(500).json({ error: "Erro interno ao salvar relat\xF3rio do l\xEDder." });
    }
  });
  app2.delete("/api/relatorios-lider/:id", async (req, res) => {
    const { id } = req.params;
    const { paroquia } = req.query;
    try {
      await database_default.read();
      if (!database_default.data || !database_default.data.relatoriosLider) {
        return res.status(404).json({ error: "Nenhum relat\xF3rio encontrado." });
      }
      const idx = database_default.data.relatoriosLider.findIndex((r) => String(r.id) === String(id));
      if (idx === -1) {
        return res.status(404).json({ error: "Relat\xF3rio n\xE3o encontrado." });
      }
      database_default.data.relatoriosLider.splice(idx, 1);
      await database_default.write();
      res.json({ success: true, message: "Relat\xF3rio exclu\xEDdo com sucesso." });
    } catch (error) {
      console.error("Erro ao excluir relat\xF3rio de l\xEDder:", error);
      res.status(500).json({ error: "Erro interno ao excluir relat\xF3rio." });
    }
  });
  app2.put("/api/relatorios-lider/:id/marcar-lido", async (req, res) => {
    const { id } = req.params;
    const { lido = true, usuarioNome } = req.body;
    try {
      await database_default.read();
      if (!database_default.data || !database_default.data.relatoriosLider) {
        return res.status(404).json({ error: "Nenhum relat\xF3rio encontrado." });
      }
      const relatorio = database_default.data.relatoriosLider.find((r) => String(r.id) === String(id));
      if (!relatorio) {
        return res.status(404).json({ error: "Relat\xF3rio n\xE3o encontrado." });
      }
      relatorio.lidoPorCoordenacao = Boolean(lido);
      relatorio.lidoEm = lido ? (/* @__PURE__ */ new Date()).toISOString() : null;
      relatorio.lidoPor = lido ? usuarioNome || "Coordena\xE7\xE3o" : null;
      await database_default.write();
      res.json({ success: true, relatorio });
    } catch (error) {
      console.error("Erro ao atualizar leitura do relat\xF3rio:", error);
      res.status(500).json({ error: "Erro interno ao marcar relat\xF3rio como lido." });
    }
  });
  app2.put("/api/relatorios-lider/marcar-todos-lidos", async (req, res) => {
    const { paroquia, usuarioNome } = req.body;
    try {
      await database_default.read();
      if (!database_default.data || !database_default.data.relatoriosLider) {
        return res.status(404).json({ error: "Nenhum relat\xF3rio encontrado." });
      }
      const targetParoquia = paroquia ? normalize(String(paroquia)) : "";
      let updatedCount = 0;
      database_default.data.relatoriosLider.forEach((r) => {
        if (r && (!targetParoquia || r.paroquia && normalize(r.paroquia) === targetParoquia)) {
          r.lidoPorCoordenacao = true;
          r.lidoEm = (/* @__PURE__ */ new Date()).toISOString();
          r.lidoPor = usuarioNome || "Coordena\xE7\xE3o";
          updatedCount++;
        }
      });
      await database_default.write();
      res.json({ success: true, count: updatedCount });
    } catch (error) {
      console.error("Erro ao marcar todos relat\xF3rios como lidos:", error);
      res.status(500).json({ error: "Erro interno ao marcar todos relat\xF3rios como lidos." });
    }
  });
  app2.get("/api/financeiro", async (req, res) => {
    let { paroquia } = req.query;
    if (!paroquia || paroquia === "undefined" || paroquia === "null") {
      return res.status(403).json({ error: "Par\xF3quia n\xE3o informada ou inv\xE1lida." });
    }
    try {
      await database_default.read();
      if (!database_default.data) return res.json([]);
      if (!database_default.data.financeiro) {
        database_default.data.financeiro = [];
      }
      let items = database_default.data.financeiro;
      const targetParoquia = normalize(String(paroquia));
      items = items.filter((i) => i && normalize(i.paroquia) === targetParoquia);
      res.json(items);
    } catch (error) {
      console.error("Erro ao buscar financeiro:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.post("/api/financeiro", async (req, res) => {
    const { tipo, categoria, valor, data, ministroId, ministroNome, usuario, paroquia, descricao, mesReferencia } = req.body;
    if (!tipo || !categoria || !valor || !data || !paroquia) {
      return res.status(400).json({ error: "Campos obrigat\xF3rios ausentes." });
    }
    try {
      await database_default.read();
      if (!database_default.data) return res.status(500).json({ error: "Banco de dados n\xE3o carregado." });
      if (!database_default.data.financeiro) {
        database_default.data.financeiro = [];
      }
      const hash = Math.random().toString(36).substring(2, 9).toUpperCase();
      const novoLancamento = {
        id: `FIN-${hash}`,
        tipo,
        categoria,
        valor: Number(valor),
        data,
        ministroId: ministroId ? Number(ministroId) : void 0,
        ministroNome,
        usuario,
        paroquia,
        descricao,
        mesReferencia,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      database_default.data.financeiro.push(novoLancamento);
      await database_default.write();
      res.status(201).json({ message: "Lan\xE7amento registrado com sucesso!", lancamento: novoLancamento });
    } catch (error) {
      console.error("Erro ao salvar lan\xE7amento financeiro:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.delete("/api/financeiro/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await database_default.read();
      if (!database_default.data || !database_default.data.financeiro) {
        return res.status(404).json({ error: "Lan\xE7amento n\xE3o encontrado." });
      }
      const index = database_default.data.financeiro.findIndex((f) => f.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Lan\xE7amento n\xE3o encontrado." });
      }
      database_default.data.financeiro.splice(index, 1);
      await database_default.write();
      res.json({ message: "Lan\xE7amento exclu\xEDdo com sucesso!" });
    } catch (error) {
      console.error("Erro ao excluir lan\xE7amento financeiro:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.get("/api/estoque", async (req, res) => {
    const { paroquia } = req.query;
    try {
      await database_default.read();
      if (!database_default.data || !database_default.data.estoque) return res.json([]);
      let items = database_default.data.estoque;
      if (paroquia && paroquia !== "undefined" && paroquia !== "null") {
        const targetParoquia = normalize(String(paroquia));
        items = items.filter((i) => i && normalize(i.paroquia) === targetParoquia);
      }
      res.json(items);
    } catch (error) {
      console.error("Erro ao buscar estoque:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.get("/api/estoque/movimentacoes", async (req, res) => {
    const { paroquia, itemId } = req.query;
    try {
      await database_default.read();
      if (!database_default.data || !database_default.data.estoqueMovimentacoes) return res.json([]);
      let docs = database_default.data.estoqueMovimentacoes;
      if (paroquia && paroquia !== "undefined" && paroquia !== "null") {
        const target = normalize(String(paroquia));
        docs = docs.filter((m) => m && normalize(m.paroquia) === target);
      }
      if (itemId) {
        docs = docs.filter((m) => m && m.itemId === itemId);
      }
      docs.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      res.json(docs);
    } catch (error) {
      console.error("Erro ao buscar movimenta\xE7\xF5es:", error);
      res.status(500).json({ error: "Erro ao buscar movimenta\xE7\xF5es." });
    }
  });
  app2.post("/api/estoque/movimentar", async (req, res) => {
    const { itemId, tipo, quantidade, isEmbalagem, quantidadeOriginal, usuario, observacao, paroquia, dataMissa, horarioMissa, ministroResponsavel } = req.body;
    try {
      await database_default.read();
      const itemIndex = database_default.data.estoque.findIndex((i) => i.id === itemId);
      if (itemIndex === -1) return res.status(404).json({ error: "Item n\xE3o encontrado." });
      const item = database_default.data.estoque[itemIndex];
      const unitsToMove = Number(quantidade);
      if (tipo === "entrada") {
        item.quantidade += unitsToMove;
        item.entradas = (item.entradas || 0) + unitsToMove;
      } else {
        item.quantidade -= unitsToMove;
        item.saidas = (item.saidas || 0) + unitsToMove;
      }
      item.quantidade = Math.max(0, item.quantidade);
      item.quantidadeEmbalagens = item.quantidade / (item.unidadesPorEmbalagem || 1);
      item.ultimaAtualizacao = (/* @__PURE__ */ new Date()).toISOString();
      const movimentacao = {
        id: Date.now().toString(),
        itemId,
        tipo,
        quantidade: unitsToMove,
        isEmbalagem: !!isEmbalagem,
        quantidadeOriginal: Number(quantidadeOriginal || unitsToMove),
        data: (/* @__PURE__ */ new Date()).toISOString(),
        dataMissa,
        horarioMissa,
        ministroResponsavel,
        usuario,
        paroquia,
        observacao
      };
      if (!database_default.data.estoqueMovimentacoes) database_default.data.estoqueMovimentacoes = [];
      database_default.data.estoqueMovimentacoes.push(movimentacao);
      await database_default.write();
      res.json({ item, movimentacao });
    } catch (error) {
      console.error("Erro ao registrar movimenta\xE7\xE3o:", error);
      res.status(500).json({ error: "Erro ao registrar movimenta\xE7\xE3o." });
    }
  });
  app2.post("/api/estoque", async (req, res) => {
    try {
      await database_default.read();
      if (!database_default.data.estoque) database_default.data.estoque = [];
      const data = { ...req.body };
      const unidadesPorEmbalagem = Number(data.unidadesPorEmbalagem) || 1;
      const quantidade = Number(data.quantidade) || 0;
      const quantidadeEmbalagens = data.quantidadeEmbalagens !== void 0 ? Number(data.quantidadeEmbalagens) : quantidade / unidadesPorEmbalagem;
      const newItem = {
        ...data,
        quantidade,
        unidadesPorEmbalagem,
        quantidadeEmbalagens,
        id: Date.now().toString(),
        ultimaAtualizacao: (/* @__PURE__ */ new Date()).toISOString()
      };
      database_default.data.estoque.push(newItem);
      await database_default.write();
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Erro ao criar item no estoque:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  const handleUpdateEstoque = async (req, res) => {
    const id = req.params.id || req.body?.id || req.query?.id;
    if (!id) {
      return res.status(400).json({ error: "ID do item \xE9 obrigat\xF3rio para atualiza\xE7\xE3o." });
    }
    try {
      await database_default.read();
      if (!database_default.data.estoque) return res.status(404).json({ error: "Estoque vazio." });
      const index = database_default.data.estoque.findIndex((i) => i.id === id || String(i.id) === String(id));
      if (index === -1) return res.status(404).json({ error: "Item n\xE3o encontrado." });
      const item = database_default.data.estoque[index];
      const updatedData = { ...req.body };
      if (updatedData.unidadesPorEmbalagem !== void 0) {
        item.unidadesPorEmbalagem = Number(updatedData.unidadesPorEmbalagem);
        item.quantidadeEmbalagens = item.quantidade / (item.unidadesPorEmbalagem || 1);
      }
      if (updatedData.quantidade !== void 0) {
        item.quantidade = Number(updatedData.quantidade);
        item.quantidadeEmbalagens = item.quantidade / (item.unidadesPorEmbalagem || 1);
      }
      database_default.data.estoque[index] = {
        ...item,
        ...updatedData,
        id,
        ultimaAtualizacao: (/* @__PURE__ */ new Date()).toISOString()
      };
      await database_default.write();
      res.json(database_default.data.estoque[index]);
    } catch (error) {
      console.error("Erro ao atualizar item no estoque:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  };
  app2.put("/api/estoque/:id", handleUpdateEstoque);
  app2.put("/api/estoque", handleUpdateEstoque);
  app2.patch("/api/estoque/:id", handleUpdateEstoque);
  app2.patch("/api/estoque", handleUpdateEstoque);
  app2.delete("/api/estoque/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await database_default.read();
      if (!database_default.data.estoque) return res.status(404).json({ error: "Estoque vazio." });
      const index = database_default.data.estoque.findIndex((i) => i.id === id);
      if (index === -1) return res.status(404).json({ error: "Item n\xE3o encontrado." });
      database_default.data.estoque.splice(index, 1);
      await database_default.write();
      res.json({ message: "Item exclu\xEDdo com sucesso!" });
    } catch (error) {
      console.error("Erro ao excluir item do estoque:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.post("/api/escala/gerar", async (req, res) => {
    const { paroquia, mes, ano, keep, includeNextSunday: incNextSun, maxEscalacoes: qMaxEsc, limiteNovos: qLimNovos } = req.query;
    const keepExisting = keep === "true";
    const includeNextSunday = incNextSun === "true";
    if (!paroquia) return res.status(400).json({ error: "Par\xF3quia \xE9 obrigat\xF3ria." });
    console.log(`[POST /api/escala/gerar] Iniciando nova l\xF3gica para: Paroquia: ${paroquia}, Mes: ${mes}, Ano: ${ano}, Keep: ${keepExisting}, IncludeNextSunday: ${includeNextSunday}, MaxEscalacoes: ${qMaxEsc}, LimiteNovos: ${qLimNovos}`);
    try {
      let tentarPreencher = function(maxEscalacoesPermitidas, ignorarRestricoes = false, ignorarRegraDaSemana = false, ignorarSequenciaDias = false, ignorarMesmoDia = false, chavesParaProcessar) {
        let alocouAlguem = false;
        const chavesAtivas = chavesParaProcessar || chavesSlots;
        const currentOrder = [...chavesAtivas].sort((a, b) => {
          const slotA = slots[a];
          const slotB = slots[b];
          const missingA = slotA.quantidade - slotA.ocupacao;
          const missingB = slotB.quantidade - slotB.ocupacao;
          const ratioA = (missingA > 0 ? slotA.candidatos.length / missingA : 999) + Math.random() * 0.4;
          const ratioB = (missingB > 0 ? slotB.candidatos.length / missingB : 999) + Math.random() * 0.4;
          return ratioA - ratioB;
        });
        for (const chave of currentOrder) {
          const slot = slots[chave];
          if (slot.ocupacao >= slot.quantidade) continue;
          const remainingCapacity = slot.quantidade - slot.ocupacao;
          let slotHasLeader = slot.ministros.some((mEsc) => {
            const mObj = ministros.find((m) => String(m.id) === String(mEsc.id));
            if (!mObj) return false;
            const normM = normalizeModo(mEsc.modo);
            if (normM === "ela") return !!mObj.isLiderConjuge || mObj.role === "coordenacao" || mObj.role === "vice_coordenacao";
            if (normM === "ele") return !!mObj.isLider || mObj.role === "coordenacao" || mObj.role === "vice_coordenacao";
            return !!(mObj.isLider || mObj.isLiderConjuge || mObj.role === "coordenacao" || mObj.role === "vice_coordenacao");
          });
          const candidatesToTest = [...slot.candidatos].map((d) => {
            const m = ministros.find((min) => String(min.id) === String(d.ministro_id));
            const normModo = normalizeModo(d.modo);
            let p = 1;
            if (normModo === "casal" || !d.modo && m?.tipo === "casal") p = 2;
            const isLiderCand = normModo === "ela" ? !!m?.isLiderConjuge || m?.role === "coordenacao" || m?.role === "vice_coordenacao" : normModo === "ele" ? !!m?.isLider || m?.role === "coordenacao" || m?.role === "vice_coordenacao" : !!(m?.isLider || m?.isLiderConjuge || m?.role === "coordenacao" || m?.role === "vice_coordenacao");
            return { ...d, modo: normModo, peso: p, isLiderCand };
          }).sort((a, b) => {
            const mIdA = String(a.ministro_id);
            const mIdB = String(b.ministro_id);
            const countA = contagemMinistro[mIdA] || 0;
            const countB = contagemMinistro[mIdB] || 0;
            if (!slotHasLeader) {
              if (a.isLiderCand !== b.isLiderCand) {
                return a.isLiderCand ? -1 : 1;
              }
              if (a.isLiderCand && b.isLiderCand) {
                const lIdA = String(a.ministro_id);
                const lIdB = String(b.ministro_id);
                const lCountA = currentSimulationLeaderCount[lIdA] || 0;
                const lCountB = currentSimulationLeaderCount[lIdB] || 0;
                if (lCountA !== lCountB) {
                  return lCountA - lCountB;
                }
                const randA = candidateSlotRandom[chave]?.[lIdA] ?? Math.random();
                const randB = candidateSlotRandom[chave]?.[lIdB] ?? Math.random();
                if (Math.abs(randA - randB) > 1e-4) {
                  return randA - randB;
                }
              }
            }
            const hasZeroA = countA === 0;
            const hasZeroB = countB === 0;
            if (hasZeroA !== hasZeroB) return hasZeroA ? -1 : 1;
            if (countA !== countB) return countA - countB;
            const dispA = dispCount[mIdA] || 0;
            const dispB = dispCount[mIdB] || 0;
            if (hasZeroA && hasZeroB) {
              const isCritA = dispA <= 2;
              const isCritB = dispB <= 2;
              if (isCritA !== isCritB) return isCritA ? -1 : 1;
              if (isCritA && isCritB && dispA !== dispB) return dispA - dispB;
            }
            if (a.peso !== b.peso) {
              if (remainingCapacity >= 2) {
                return b.peso - a.peso;
              } else {
                return a.peso - b.peso;
              }
            }
            const slotRandA = candidateSlotRandom[chave]?.[mIdA] ?? Math.random();
            const slotRandB = candidateSlotRandom[chave]?.[mIdB] ?? Math.random();
            const scoreA = slotRandA * 10 + dispA * 0.3;
            const scoreB = slotRandB * 10 + dispB * 0.3;
            if (Math.abs(scoreA - scoreB) > 1e-4) {
              return scoreA - scoreB;
            }
            return (randomTieBreaker[mIdA] || 0) - (randomTieBreaker[mIdB] || 0);
          });
          for (const disp of candidatesToTest) {
            if (slot.ocupacao >= slot.quantidade) break;
            const mId = String(disp.ministro_id);
            const ministro = ministros.find((m) => String(m.id) === mId);
            if (!ministro) continue;
            const modo = normalizeModo(disp.modo);
            const peso = disp.peso;
            let nomeExib = ministro.nomeExibicao || ministro.nome;
            if (peso === 2) {
              nomeExib = `${ministro.nomeExibicao || ministro.nome} e ${ministro.nomeExibicaoConjuge || ministro.nomeConjuge}`;
            } else if (modo === "ela") {
              nomeExib = ministro.nomeExibicaoConjuge || ministro.nomeConjuge;
            } else if (modo === "ele") {
              nomeExib = ministro.nomeExibicao || ministro.nome;
            }
            if (contagemMinistro[mId] >= maxEscalacoesPermitidas && !ignorarRestricoes) continue;
            if (slot.ocupacao + peso > slot.quantidade) continue;
            if (!ignorarMesmoDia) {
              if (isJaEscaladoNoDia(slot.data, mId, nomeExib)) continue;
            } else {
              if (slot.ministros.some((mEsc) => String(mEsc.id) === mId)) continue;
            }
            if (!ignorarSequenciaDias) {
              const { prevStr, nextStr } = getAdjacentDateStrings(slot.data);
              if (prevStr && isJaEscaladoNoDia(prevStr, mId, nomeExib) || nextStr && isJaEscaladoNoDia(nextStr, mId, nomeExib)) continue;
            }
            if (!ignorarRegraDaSemana && isJaEscaladoNaSemana(slot.data, mId)) continue;
            const isNovoTitular = String(ministro.tempoMinisterio || "novo").trim().toLowerCase() === "novo";
            const isNovoConjuge = String(ministro.tempoMinisterioConjuge || "novo").trim().toLowerCase() === "novo";
            const isCasalCandidato = peso === 2 || modo === "casal" || !modo && ministro.tipo === "casal";
            const isCasalNovo = isCasalCandidato && (isNovoTitular || isNovoConjuge);
            const isIndividualNovo = !isCasalCandidato && (modo === "ela" ? isNovoConjuge : isNovoTitular);
            if (!database_default.data.config) database_default.data.config = { coordinatorEnabled: false };
            if (!database_default.data.config.limiteNovosPorMissaPorParoquia) database_default.data.config.limiteNovosPorMissaPorParoquia = {};
            const configNovos = database_default.data.config.limiteNovosPorMissaPorParoquia[targetParoquia] ?? 4;
            let maxPessoasNovas = 4;
            if (configNovos === "livre") {
              maxPessoasNovas = 999;
            } else if (typeof configNovos === "number") {
              maxPessoasNovas = configNovos;
            } else if (typeof configNovos === "object" && configNovos !== null) {
              maxPessoasNovas = (configNovos.casais ?? 2) * 2 + (configNovos.individuais ?? 0);
            }
            const pesoAdicional = isCasalNovo ? 2 : isIndividualNovo ? 1 : 0;
            if ((isCasalNovo || isIndividualNovo) && configNovos !== "livre") {
              const currentNovosPessoas = slot.novosPessoasCount || 0;
              if (currentNovosPessoas + pesoAdicional > Number(maxPessoasNovas)) continue;
            }
            const temIncompativel = slot.ministros.some((mEsc) => {
              const mEscObj = allMinistros.find((m) => String(m.id) === String(mEsc.id));
              return (ministro.incompatibilidades || []).some((id) => String(id) === String(mEsc.id)) || (mEscObj?.incompatibilidades || []).some((id) => String(id) === mId);
            });
            if (temIncompativel) continue;
            slot.ministros.push({ id: mId, nome: nomeExib, modo });
            slot.ocupacao += peso;
            if (disp.isLiderCand && !slotHasLeader) {
              currentSimulationLeaderCount[mId] = (currentSimulationLeaderCount[mId] || 0) + 1;
              slot.preferredLeaderId = mId;
              slotHasLeader = true;
            }
            registrarEscalacaoNoDia(slot.data, mId, nomeExib);
            if (isCasalNovo) {
              slot.casaisNovosCount = (slot.casaisNovosCount || 0) + 1;
              slot.novosCount = (slot.novosCount || 0) + 1;
              slot.novosPessoasCount = (slot.novosPessoasCount || 0) + peso;
            }
            if (isIndividualNovo) {
              slot.individuaisNovosCount = (slot.individuaisNovosCount || 0) + 1;
              slot.novosCount = (slot.novosCount || 0) + 1;
              slot.novosPessoasCount = (slot.novosPessoasCount || 0) + peso;
            }
            contagemMinistro[mId] += 1;
            alocouAlguem = true;
          }
        }
        return alocouAlguem;
      };
      await database_default.read(true);
      const targetParoquia = String(paroquia).trim();
      const targetMonthStr = mes && ano ? `${ano}-${String(mes).padStart(2, "0")}` : null;
      const anoNum = Number(ano);
      const mesNum = Number(mes);
      if (!targetMonthStr) {
        return res.status(400).json({ error: "M\xEAs e ano s\xE3o obrigat\xF3rios." });
      }
      if (qMaxEsc !== void 0 && qMaxEsc !== "") {
        if (!database_default.data.config.limiteEscalacaoPorParoquia) database_default.data.config.limiteEscalacaoPorParoquia = {};
        database_default.data.config.limiteEscalacaoPorParoquia[targetParoquia] = qMaxEsc === "libre" || qMaxEsc === "99" || String(qMaxEsc) === "99" ? 99 : Number(qMaxEsc);
      }
      if (qLimNovos !== void 0 && qLimNovos !== "") {
        if (!database_default.data.config.limiteNovosPorMissaPorParoquia) database_default.data.config.limiteNovosPorMissaPorParoquia = {};
        database_default.data.config.limiteNovosPorMissaPorParoquia[targetParoquia] = qLimNovos === "livre" ? "livre" : Number(qLimNovos);
      }
      const allMinistros = database_default.data.ministros || [];
      const allDisponibilidades = database_default.data.disponibilidades || [];
      const todasMissas = database_default.data.missasTemporarias || [];
      const missasDaParoquia = todasMissas.filter((m) => {
        const mPar = m.paroquia && m.paroquia !== "undefined" ? String(m.paroquia).trim() : "";
        if (targetParoquia) {
          return mPar.toLowerCase() === targetParoquia.toLowerCase();
        }
        return mPar === "";
      });
      const MISSAS_PADRAO = [
        { id: "padrao-sab-17", nome: "Missa de S\xE1bado", frequencia: "semanal", diaSemana: "6", horario: "17:00", quantidade: 6, tipo: "padrao" },
        { id: "padrao-dom-07", nome: "Missa de Domingo", frequencia: "semanal", diaSemana: "0", horario: "07:30", quantidade: 5, tipo: "padrao" },
        { id: "padrao-dom-10", nome: "Missa de Domingo", frequencia: "semanal", diaSemana: "0", horario: "10:00", quantidade: 8, tipo: "padrao" },
        { id: "padrao-dom-19", nome: "Missa de Domingo", frequencia: "semanal", diaSemana: "0", horario: "19:00", quantidade: 8, tipo: "padrao" }
      ];
      const missas = [];
      MISSAS_PADRAO.forEach((mp) => {
        const override = missasDaParoquia.find(
          (m) => (m.tipo === "padrao" || m.tipo === "fixa" || !m.tipo && m.frequencia === "semanal") && m.horario === mp.horario && String(m.diaSemana) === String(mp.diaSemana) && !m.data
          // Não é uma sobrescrita de data única
        );
        if (override) {
          if (!override.deletada) {
            missas.push({ ...mp, ...override, paroquia: targetParoquia || override.paroquia || "Padr\xE3o" });
          }
        } else {
          missas.push({ ...mp, paroquia: targetParoquia || "Padr\xE3o" });
        }
      });
      missasDaParoquia.forEach((m) => {
        if (m.deletada) return;
        const isDefaultOverride = MISSAS_PADRAO.some(
          (mp) => m.horario === mp.horario && String(m.diaSemana) === String(mp.diaSemana) && (m.tipo === "padrao" || m.tipo === "fixa" || !m.tipo && m.frequencia === "semanal") && !m.data
        );
        if (!isDefaultOverride) {
          missas.push(m);
        }
      });
      console.log(`[POST /api/escala/gerar] Missas encontradas para a par\xF3quia ${targetParoquia}: ${missas.length}`);
      missas.forEach((m) => {
        console.log(` - Missa: ${m.nome} | Hor\xE1rio: ${m.horario} | Frequ\xEAncia: ${m.frequencia} | Qtd: ${m.quantidade}`);
      });
      const ministros = allMinistros.filter((m) => {
        const mParoquia = (m.paroquia || "").trim();
        if (mParoquia !== targetParoquia || !m.aprovado) return false;
        if (m.tipo === "individual" && m.afastado) return false;
        if (m.tipo === "casal" && m.afastado && m.afastadoConjuge) return false;
        return true;
      });
      console.log(`[POST /api/escala/gerar] Ministros ativos encontrados para ${targetParoquia}: ${ministros.length}`);
      if (ministros.length < 10) {
        console.log(`[POST /api/escala/gerar] Nomes dos ministros: ${ministros.map((m) => m.nome).join(", ")}`);
      }
      const daysInMonth = new Date(anoNum, mesNum, 0).getDate();
      const lastDayObj = new Date(anoNum, mesNum - 1, daysInMonth);
      const isLastDaySaturday = lastDayObj.getDay() === 6;
      let nextAno = anoNum;
      let nextMes = mesNum + 1;
      if (nextMes > 12) {
        nextMes = 1;
        nextAno += 1;
      }
      const nextDataStr = `${nextAno}-${String(nextMes).padStart(2, "0")}-01`;
      const disponibilidades = allDisponibilidades.filter((d) => {
        const isTargetMonth = d.data.startsWith(targetMonthStr);
        let isNextSundayMatch = false;
        if (includeNextSunday && isLastDaySaturday && d.data === nextDataStr) {
          isNextSundayMatch = true;
        }
        if (!isTargetMonth && !isNextSundayMatch) return false;
        if (d.paroquia) {
          if (String(d.paroquia).trim() !== targetParoquia) return false;
        } else {
          const ministro = ministros.find((m) => String(m.id) === String(d.ministro_id));
          if (!ministro) return false;
        }
        return true;
      });
      console.log(`[POST /api/escala/gerar] Disponibilidades encontradas para ${targetMonthStr} ${includeNextSunday && isLastDaySaturday ? `+ ${nextDataStr}` : ""}: ${disponibilidades.length}`);
      const alexandreDisp = disponibilidades.filter((d) => String(d.ministro_id) === "1");
      const mauricioDisp = disponibilidades.filter((d) => String(d.ministro_id) === "38");
      console.log(`[POST /api/escala/gerar] Disponibilidades Alexandre (ID 1): ${alexandreDisp.length}`);
      console.log(`[POST /api/escala/gerar] Disponibilidades Maur\xEDcio (ID 38): ${mauricioDisp.length}`);
      const slots = {};
      const normalizeMassName = (name) => {
        if (!name) return "";
        return name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
      };
      const normalizeHorario = (h) => {
        if (!h) return "00:00";
        const parts = h.trim().split(/[:h]/);
        if (parts.length === 0) return "00:00";
        let HH = parts[0].padStart(2, "0");
        let MM = (parts[1] || "00").padStart(2, "0");
        if (parseInt(HH) > 23) HH = "23";
        if (parseInt(MM) > 59) MM = "59";
        return `${HH}:${MM}`;
      };
      const datesToProcess = [];
      for (let dia = 1; dia <= daysInMonth; dia++) {
        const dataStr = `${anoNum}-${String(mesNum).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
        const dateObj = new Date(anoNum, mesNum - 1, dia);
        const diaSemana = dateObj.getDay();
        const semanaDoMes = Math.ceil(dia / 7);
        datesToProcess.push({ dataStr, anoNum, mesNum, dia, semanaDoMes, diaSemana });
      }
      if (includeNextSunday && isLastDaySaturday) {
        const dateObj = new Date(nextAno, nextMes - 1, 1);
        const diaSemana = dateObj.getDay();
        const semanaDoMes = 1;
        datesToProcess.push({ dataStr: nextDataStr, anoNum: nextAno, mesNum: nextMes, dia: 1, semanaDoMes, diaSemana });
        console.log(`[GERAR ESCALA] Incluindo Domingo do dia 1\xBA (${nextDataStr}) do m\xEAs seguinte devido ao t\xE9rmino em s\xE1bado.`);
      }
      datesToProcess.forEach(({ dataStr, anoNum: aNum, mesNum: mNum, dia, semanaDoMes, diaSemana }) => {
        missas.forEach((m) => {
          if (m.datasInativas && m.datasInativas.some((d) => String(d).trim() === dataStr)) {
            console.log(`[GERAR] Missa ${m.nome} em ${dataStr} ignorada por datasInativas`);
            return;
          }
          let isMatch = false;
          if ((m.frequencia === "temporaria" || m.tipo === "unica") && m.data === dataStr) isMatch = true;
          else if (m.frequencia === "diaria" && diaSemana !== 0 && diaSemana !== 6) isMatch = true;
          else if (m.frequencia === "semanal" && parseInt(m.diaSemana) === diaSemana) isMatch = true;
          else if (m.frequencia === "mensal-data" && parseInt(m.diaMes) === dia) isMatch = true;
          else if (m.frequencia === "mensal" && parseInt(m.diaSemana) === diaSemana && semanaDoMes === parseInt(m.diaMes || "1", 10)) isMatch = true;
          else if (m.frequencia === "mensal-1" && semanaDoMes === 1 && parseInt(m.diaSemana) === diaSemana) isMatch = true;
          else if (m.frequencia === "mensal-2" && semanaDoMes === 2 && parseInt(m.diaSemana) === diaSemana) isMatch = true;
          else if (m.frequencia === "mensal-3" && semanaDoMes === 3 && parseInt(m.diaSemana) === diaSemana) isMatch = true;
          else if (m.frequencia === "mensal-4" && semanaDoMes === 4 && parseInt(m.diaSemana) === diaSemana) isMatch = true;
          else if (m.frequencia === "quinzenal" && parseInt(m.diaSemana) === diaSemana && (semanaDoMes === 1 || semanaDoMes === 3 || semanaDoMes === 5)) isMatch = true;
          if (isMatch && Number(m.quantidade) > 0) {
            const normalizedName = normalizeMassName(m.nome);
            const normHorario = normalizeHorario(m.horario);
            const chave = `${dataStr}|${normHorario}|${normalizedName}`;
            if (!slots[chave] || m.frequencia === "temporaria" || m.tipo === "unica") {
              slots[chave] = {
                data: dataStr,
                horario: normHorario,
                origHorario: m.horario,
                nome: m.nome,
                // Nome original para exibição
                normalizedNome: normalizedName,
                quantidade: Number(m.quantidade) || 0,
                // Vagas definidas pela coordenação
                ocupacao: 0,
                novosIndividuais: 0,
                novosCasais: 0,
                isTemporaria: m.frequencia === "temporaria" || m.tipo === "unica",
                ministros: [],
                candidatos: []
              };
            }
          }
        });
      });
      let mappedCount = 0;
      disponibilidades.forEach((d) => {
        const cleanData = String(d.data || "").trim();
        const cleanHorario = normalizeHorario(d.horario);
        const normalizedDispName = normalizeMassName(d.nomeMissa);
        const chave = `${cleanData}|${cleanHorario}|${normalizedDispName}`;
        if (slots[chave]) {
          slots[chave].candidatos.push(d);
          mappedCount++;
        } else {
          const slotsNoMesmoHorario = Object.keys(slots).filter((k) => k.startsWith(`${cleanData}|${cleanHorario}|`));
          if (slotsNoMesmoHorario.length > 0) {
            let bestKey = slotsNoMesmoHorario.find((k) => slots[k].normalizedNome === normalizedDispName);
            if (!bestKey) {
              bestKey = slotsNoMesmoHorario.find((k) => {
                const sn = slots[k].normalizedNome;
                return sn.includes(normalizedDispName) || normalizedDispName.includes(sn);
              });
            }
            if (!bestKey && slotsNoMesmoHorario.length === 1) {
              bestKey = slotsNoMesmoHorario[0];
            }
            if (bestKey) {
              slots[bestKey].candidatos.push(d);
              mappedCount++;
            } else {
              console.log(`[AVISO] N\xE3o foi poss\xEDvel mapear disponibilidade: ${cleanData} ${cleanHorario} "${normalizedDispName}" (Conflito entre ${slotsNoMesmoHorario.length} slots)`);
            }
          }
        }
      });
      console.log(`[POST /api/escala/gerar] Disponibilidades mapeadas para slots: ${mappedCount}`);
      const liderancasHistoricas = {};
      try {
        const escalaParoquia = database_default.data.escalaGerada?.[targetParoquia] || {};
        Object.keys(escalaParoquia).forEach((dataKey) => {
          if (dataKey.startsWith(targetMonthStr)) return;
          const timesObj = escalaParoquia[dataKey] || {};
          Object.keys(timesObj).forEach((timeKey) => {
            const mInfo = timesObj[timeKey];
            if (mInfo && mInfo.lider) {
              const lNome = mInfo.lider.trim();
              if (lNome) {
                liderancasHistoricas[lNome] = (liderancasHistoricas[lNome] || 0) + 1;
              }
            }
          });
        });
        console.log(`[POST /api/escala/gerar] Carregadas ${Object.keys(liderancasHistoricas).length} lideran\xE7as hist\xF3ricas de outros meses para ${targetParoquia}`);
      } catch (err) {
        console.error("Erro ao carregar lideran\xE7as hist\xF3ricas:", err);
      }
      const historicalLiderMap = {};
      const currentSimulationLeaderCount = {};
      ministros.forEach((m) => {
        let maxCount = 0;
        const nEle = m.nomeExibicao || m.nome;
        const nEla = m.nomeExibicaoConjuge || m.nomeConjuge;
        if (nEle && liderancasHistoricas[nEle]) maxCount = Math.max(maxCount, liderancasHistoricas[nEle]);
        if (nEla && liderancasHistoricas[nEla]) maxCount = Math.max(maxCount, liderancasHistoricas[nEla]);
        historicalLiderMap[String(m.id)] = maxCount;
        currentSimulationLeaderCount[String(m.id)] = 0;
      });
      const contagemMinistro = {};
      const dispCount = {};
      const randomTieBreaker = {};
      ministros.forEach((m) => {
        contagemMinistro[String(m.id)] = 0;
        dispCount[String(m.id)] = 0;
        randomTieBreaker[String(m.id)] = Math.random();
      });
      Object.values(slots).forEach((slot) => {
        slot.candidatos.forEach((d) => {
          dispCount[String(d.ministro_id)] = (dispCount[String(d.ministro_id)] || 0) + 1;
        });
      });
      const candidateSlotRandom = {};
      Object.keys(slots).forEach((chave) => {
        candidateSlotRandom[chave] = {};
        const slot = slots[chave];
        slot.candidatos.forEach((d) => {
          candidateSlotRandom[chave][String(d.ministro_id)] = Math.random();
        });
        for (let i = slot.candidatos.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [slot.candidatos[i], slot.candidatos[j]] = [slot.candidatos[j], slot.candidatos[i]];
        }
      });
      const chavesSlots = Object.keys(slots);
      const idsEscaladosNoDia = {};
      const nomesEscaladosNoDia = {};
      const idsEscaladosNaSemana = {};
      const getWeekKey = (dateStr) => {
        const parts = dateStr.split("-");
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        const dayOfWeek = d.getDay();
        if (dayOfWeek === 6 || dayOfWeek === 0) {
          const sunday = new Date(d);
          if (dayOfWeek === 6) sunday.setDate(d.getDate() + 1);
          const y = sunday.getFullYear();
          const m = String(sunday.getMonth() + 1).padStart(2, "0");
          const dy = String(sunday.getDate()).padStart(2, "0");
          return `weekend-${y}-${m}-${dy}`;
        }
        return `weekday-${dateStr}`;
      };
      const getAdjacentDateStrings = (dateStr) => {
        const parts = dateStr.split("-");
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const baseDate = new Date(Date.UTC(year, month, day));
        const dayOfWeek = new Date(year, month, day).getDay();
        const formatDateUTC = (d) => {
          const y = d.getUTCFullYear();
          const m = String(d.getUTCMonth() + 1).padStart(2, "0");
          const dayVal = String(d.getUTCDate()).padStart(2, "0");
          return `${y}-${m}-${dayVal}`;
        };
        let prevStr = "";
        let nextStr = "";
        if (dayOfWeek === 0) {
          const prevDate = new Date(baseDate);
          prevDate.setUTCDate(baseDate.getUTCDate() - 1);
          prevStr = formatDateUTC(prevDate);
        } else if (dayOfWeek === 6) {
          const nextDate = new Date(baseDate);
          nextDate.setUTCDate(baseDate.getUTCDate() + 1);
          nextStr = formatDateUTC(nextDate);
        }
        return {
          prevStr,
          nextStr
        };
      };
      const isJaEscaladoNoDia = (data, mId, nomeExibicao) => {
        const normName = normalizeMassName(nomeExibicao);
        const dayIds = idsEscaladosNoDia[data];
        const dayNames = nomesEscaladosNoDia[data];
        if (dayIds?.has(String(mId))) return true;
        if (dayNames?.has(normName)) return true;
        const parts = normName.split(/\s+e\s+/);
        if (dayNames && parts.length > 1) {
          for (const p of parts) {
            if (dayNames.has(p)) return true;
          }
        }
        return false;
      };
      const isJaEscaladoNaSemana = (data, mId) => {
        const weekKey = getWeekKey(data);
        const weekSet = idsEscaladosNaSemana[weekKey];
        return weekSet && weekSet.has(String(mId));
      };
      const registrarEscalacaoNoDia = (data, mId, nomeExibicao) => {
        if (!idsEscaladosNoDia[data]) idsEscaladosNoDia[data] = /* @__PURE__ */ new Set();
        if (!nomesEscaladosNoDia[data]) nomesEscaladosNoDia[data] = /* @__PURE__ */ new Set();
        idsEscaladosNoDia[data].add(String(mId));
        const normName = normalizeMassName(nomeExibicao);
        nomesEscaladosNoDia[data].add(normName);
        const parts = normName.split(/\s+e\s+/);
        if (parts.length > 1) {
          parts.forEach((p) => nomesEscaladosNoDia[data].add(p.trim()));
        }
        const weekKey = getWeekKey(data);
        if (!idsEscaladosNaSemana[weekKey]) idsEscaladosNaSemana[weekKey] = /* @__PURE__ */ new Set();
        idsEscaladosNaSemana[weekKey].add(String(mId));
      };
      if (keepExisting && database_default.data.escalaGerada && database_default.data.escalaGerada[targetParoquia]) {
        const extEscala = database_default.data.escalaGerada[targetParoquia];
        let preservedCount = 0;
        Object.keys(extEscala).forEach((dt) => {
          if (targetMonthStr && dt.startsWith(targetMonthStr)) {
            const diarias = extEscala[dt];
            Object.keys(diarias).forEach((horario) => {
              const prevSlot = diarias[horario];
              const sn = normalizeMassName(prevSlot.nome || "");
              const slotKey = `${dt}|${normalizeHorario(horario)}|${sn}`;
              let targetSlotKey = slots[slotKey] ? slotKey : null;
              if (!targetSlotKey) {
                const normH = normalizeHorario(horario);
                const matchingKey = Object.keys(slots).find((k) => {
                  const s = slots[k];
                  return s.data === dt && normalizeHorario(s.horario) === normH;
                });
                if (matchingKey) {
                  targetSlotKey = matchingKey;
                }
              }
              const slot = targetSlotKey ? slots[targetSlotKey] : null;
              if (slot && prevSlot.ministros && Array.isArray(prevSlot.ministros)) {
                prevSlot.ministros.forEach((pmNome) => {
                  const matchedMin = allMinistros.find((min) => {
                    const mParoquia = (min.paroquia || "").trim();
                    if (mParoquia !== targetParoquia) return false;
                    const mainNameRaw = min.nome;
                    if (normalizeMassName(mainNameRaw) === normalizeMassName(pmNome)) return true;
                    if (min.tipo === "casal") {
                      const casalNome = `${min.nome} e ${min.nomeConjuge}`;
                      if (normalizeMassName(casalNome) === normalizeMassName(pmNome)) return true;
                    }
                    return false;
                  });
                  if (matchedMin) {
                    const mId = String(matchedMin.id);
                    if (contagemMinistro[mId] !== void 0) {
                      let peso = 1;
                      let modo = "individual";
                      if (matchedMin.tipo === "casal") {
                        const mNameNorm = normalize(pmNome);
                        const isEleksandraOnly = mNameNorm === normalize(matchedMin.nomeExibicaoConjuge) || mNameNorm === normalize(matchedMin.nomeConjuge);
                        const isRodrigoOnly = mNameNorm === normalize(matchedMin.nomeExibicao) || mNameNorm === normalize(matchedMin.nome);
                        if (isEleksandraOnly) {
                          peso = 1;
                          modo = "ela";
                        } else if (isRodrigoOnly) {
                          peso = 1;
                          modo = "ele";
                        } else {
                          peso = 2;
                          modo = "casal";
                        }
                      }
                      if (slot.ocupacao + peso <= slot.quantidade) {
                        slot.ministros.push({
                          id: mId,
                          nome: pmNome,
                          modo,
                          telefone: matchedMin.telefone || ""
                        });
                        registrarEscalacaoNoDia(dt, mId, pmNome);
                        contagemMinistro[mId]++;
                        slot.ocupacao += peso;
                        preservedCount++;
                        const isNovoTitular = String(matchedMin.tempoMinisterio || "novo").trim().toLowerCase() === "novo";
                        const isNovoConjuge = String(matchedMin.tempoMinisterioConjuge || "novo").trim().toLowerCase() === "novo";
                        const isCasalCandidato = peso === 2 || modo === "casal" || !modo && matchedMin.tipo === "casal";
                        const isCasalNovo = isCasalCandidato && (isNovoTitular || isNovoConjuge);
                        const isIndividualNovo = !isCasalCandidato && (modo === "ela" ? isNovoConjuge : isNovoTitular);
                        if (isCasalNovo) {
                          slot.casaisNovosCount = (slot.casaisNovosCount || 0) + 1;
                          slot.novosCount = (slot.novosCount || 0) + 1;
                          slot.novosPessoasCount = (slot.novosPessoasCount || 0) + peso;
                        } else if (isIndividualNovo) {
                          slot.individuaisNovosCount = (slot.individuaisNovosCount || 0) + 1;
                          slot.novosCount = (slot.novosCount || 0) + 1;
                          slot.novosPessoasCount = (slot.novosPessoasCount || 0) + peso;
                        }
                      }
                    }
                  }
                });
              }
            });
          }
        });
        console.log(`[POST /api/escala/gerar] keepExisting ativado. Foram preservados ${preservedCount} assentos de ministros j\xE1 escalados.`);
      }
      for (let i = chavesSlots.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chavesSlots[i], chavesSlots[j]] = [chavesSlots[j], chavesSlots[i]];
      }
      const slotRandom = {};
      chavesSlots.forEach((k) => {
        slotRandom[k] = Math.random() * 0.15;
      });
      const getSlotCandidatosTotalPeso = (slot) => {
        let totalPeso = 0;
        slot.candidatos.forEach((d) => {
          const m = ministros.find((min) => String(min.id) === String(d.ministro_id));
          const normModo = normalizeModo(d.modo);
          let p = 1;
          if (normModo === "casal" || !d.modo && m?.tipo === "casal") p = 2;
          totalPeso += p;
        });
        return totalPeso;
      };
      const chavesSemSobra = [];
      const chavesComSobra = [];
      chavesSlots.forEach((chave) => {
        const slot = slots[chave];
        const totalPeso = getSlotCandidatosTotalPeso(slot);
        if (totalPeso <= slot.quantidade) {
          chavesSemSobra.push(chave);
        } else {
          chavesComSobra.push(chave);
        }
      });
      console.log(`[POST /api/escala/gerar] Slots categorizados: Sem Sobra (Grupo 1): ${chavesSemSobra.length}, Com Sobra (Grupo 2): ${chavesComSobra.length}`);
      const limitConfig = database_default.data.config?.limiteEscalacaoPorParoquia?.[targetParoquia] ?? 3;
      console.log(`[POST /api/escala/gerar] Limite configurado de escala\xE7\xF5es por ministro: ${limitConfig}`);
      const initialLimit = Math.min(3, limitConfig);
      const chavesParaLider = [...chavesSlots].filter((chave) => {
        const slot = slots[chave];
        if (slot.ocupacao >= slot.quantidade) return false;
        const slotJaTemLider = slot.ministros.some((mEsc) => {
          const mObj = ministros.find((m) => String(m.id) === String(mEsc.id));
          if (!mObj) return false;
          const normM = normalizeModo(mEsc.modo);
          if (normM === "ela") return !!mObj.isLiderConjuge || mObj.role === "coordenacao" || mObj.role === "vice_coordenacao";
          if (normM === "ele") return !!mObj.isLider || mObj.role === "coordenacao" || mObj.role === "vice_coordenacao";
          return !!(mObj.isLider || mObj.isLiderConjuge || mObj.role === "coordenacao" || mObj.role === "vice_coordenacao");
        });
        return !slotJaTemLider;
      });
      chavesParaLider.sort((a, b) => {
        const getLiderCandCount = (slotKey) => {
          const slot = slots[slotKey];
          return slot.candidatos.filter((d) => {
            const m = ministros.find((min) => String(min.id) === String(d.ministro_id));
            const normModo = normalizeModo(d.modo);
            if (normModo === "ela") return !!m?.isLiderConjuge || m?.role === "coordenacao" || m?.role === "vice_coordenacao";
            if (normModo === "ele") return !!m?.isLider || m?.role === "coordenacao" || m?.role === "vice_coordenacao";
            return !!(m?.isLider || m?.isLiderConjuge || m?.role === "coordenacao" || m?.role === "vice_coordenacao");
          }).length;
        };
        const countA = getLiderCandCount(a);
        const countB = getLiderCandCount(b);
        if (countA !== countB) return countA - countB;
        const slotA = slots[a];
        const slotB = slots[b];
        if (slotA.data !== slotB.data) {
          return slotA.data.localeCompare(slotB.data);
        }
        return (slotRandom[a] || 0) - (slotRandom[b] || 0);
      });
      for (const chave of chavesParaLider) {
        const slot = slots[chave];
        if (slot.ocupacao >= slot.quantidade) continue;
        const slotJaTemLider = slot.ministros.some((mEsc) => {
          const mObj = ministros.find((m) => String(m.id) === String(mEsc.id));
          if (!mObj) return false;
          const normM = normalizeModo(mEsc.modo);
          if (normM === "ela") return !!mObj.isLiderConjuge || mObj.role === "coordenacao" || mObj.role === "vice_coordenacao";
          if (normM === "ele") return !!mObj.isLider || mObj.role === "coordenacao" || mObj.role === "vice_coordenacao";
          return !!(mObj.isLider || mObj.isLiderConjuge || mObj.role === "coordenacao" || mObj.role === "vice_coordenacao");
        });
        if (slotJaTemLider) continue;
        const lideresDisponiveis = slot.candidatos.map((d) => {
          const m = ministros.find((min) => String(min.id) === String(d.ministro_id));
          const normModo = normalizeModo(d.modo);
          let p = 1;
          if (normModo === "casal" || !d.modo && m?.tipo === "casal") p = 2;
          const isLiderCand = normModo === "ela" ? !!m?.isLiderConjuge || m?.role === "coordenacao" || m?.role === "vice_coordenacao" : normModo === "ele" ? !!m?.isLider || m?.role === "coordenacao" || m?.role === "vice_coordenacao" : !!(m?.isLider || m?.isLiderConjuge || m?.role === "coordenacao" || m?.role === "vice_coordenacao");
          return { ...d, modo: normModo, peso: p, isLiderCand };
        }).filter((d) => d.isLiderCand);
        if (lideresDisponiveis.length === 0) continue;
        lideresDisponiveis.sort((a, b) => {
          const mIdA = String(a.ministro_id);
          const mIdB = String(b.ministro_id);
          const mObjA = ministros.find((m) => String(m.id) === mIdA);
          const mObjB = ministros.find((m) => String(m.id) === mIdB);
          const lCountA = currentSimulationLeaderCount[mIdA] || 0;
          const lCountB = currentSimulationLeaderCount[mIdB] || 0;
          if (lCountA !== lCountB) return lCountA - lCountB;
          const countA = contagemMinistro[mIdA] || 0;
          const countB = contagemMinistro[mIdB] || 0;
          if (countA !== countB) return countA - countB;
          if (slot.quantidade % 2 === 0 && a.peso !== b.peso) {
            return b.peso - a.peso;
          }
          const randA = candidateSlotRandom[chave]?.[mIdA] ?? Math.random();
          const randB = candidateSlotRandom[chave]?.[mIdB] ?? Math.random();
          if (Math.abs(randA - randB) > 1e-4) {
            return randA - randB;
          }
          const dispA = dispCount[mIdA] || 0;
          const dispB = dispCount[mIdB] || 0;
          if (dispA !== dispB) return dispA - dispB;
          const isCoordA = mObjA?.role === "coordenacao" || mObjA?.role === "vice_coordenacao";
          const isCoordB = mObjB?.role === "coordenacao" || mObjB?.role === "vice_coordenacao";
          if (isCoordA !== isCoordB) {
            return isCoordA ? -1 : 1;
          }
          return (randomTieBreaker[mIdA] || 0) - (randomTieBreaker[mIdB] || 0);
        });
        for (const disp of lideresDisponiveis) {
          const mId = String(disp.ministro_id);
          const ministro = ministros.find((m) => String(m.id) === mId);
          if (!ministro) continue;
          if (limitConfig !== 99 && (contagemMinistro[mId] || 0) >= limitConfig) continue;
          const modo = normalizeModo(disp.modo);
          const peso = disp.peso;
          let nomeExib = ministro.nomeExibicao || ministro.nome;
          if (peso === 2) {
            nomeExib = `${ministro.nomeExibicao || ministro.nome} e ${ministro.nomeExibicaoConjuge || ministro.nomeConjuge}`;
          } else if (modo === "ela") {
            nomeExib = ministro.nomeExibicaoConjuge || ministro.nomeConjuge;
          } else if (modo === "ele") {
            nomeExib = ministro.nomeExibicao || ministro.nome;
          }
          if (slot.ocupacao + peso > slot.quantidade) continue;
          const isNovoTitular = String(ministro.tempoMinisterio || "novo").trim().toLowerCase() === "novo";
          const isNovoConjuge = String(ministro.tempoMinisterioConjuge || "novo").trim().toLowerCase() === "novo";
          const isCasalCandidato = peso === 2 || modo === "casal" || !modo && ministro.tipo === "casal";
          const isCasalNovo = isCasalCandidato && (isNovoTitular || isNovoConjuge);
          const isIndividualNovo = !isCasalCandidato && (modo === "ela" ? isNovoConjuge : isNovoTitular);
          const pesoAdicional = isCasalNovo ? 2 : isIndividualNovo ? 1 : 0;
          const configNovos = database_default.data.config?.limiteNovosPorMissaPorParoquia?.[targetParoquia] ?? 4;
          let maxPessoasNovas = 4;
          if (configNovos === "livre") {
            maxPessoasNovas = 999;
          } else if (typeof configNovos === "number") {
            maxPessoasNovas = configNovos;
          } else if (typeof configNovos === "object" && configNovos !== null) {
            maxPessoasNovas = (configNovos.casais ?? 2) * 2 + (configNovos.individuais ?? 0);
          }
          if ((slot.novosPessoasCount || 0) + pesoAdicional > maxPessoasNovas) continue;
          if (isJaEscaladoNoDia(slot.data, mId, nomeExib)) continue;
          const { prevStr, nextStr } = getAdjacentDateStrings(slot.data);
          if (prevStr && isJaEscaladoNoDia(prevStr, mId, nomeExib) || nextStr && isJaEscaladoNoDia(nextStr, mId, nomeExib)) continue;
          if (isJaEscaladoNaSemana(slot.data, mId)) continue;
          const temIncompativel = slot.ministros.some((mEsc) => {
            const mEscObj = allMinistros.find((m) => String(m.id) === String(mEsc.id));
            return (ministro.incompatibilidades || []).some((id) => String(id) === String(mEsc.id)) || (mEscObj?.incompatibilidades || []).some((id) => String(id) === mId);
          });
          if (temIncompativel) continue;
          slot.ministros.push({ id: mId, nome: nomeExib, modo });
          slot.ocupacao += peso;
          currentSimulationLeaderCount[mId] = (currentSimulationLeaderCount[mId] || 0) + 1;
          slot.preferredLeaderId = mId;
          registrarEscalacaoNoDia(slot.data, mId, nomeExib);
          contagemMinistro[mId] += 1;
          if (isCasalNovo) {
            slot.casaisNovosCount = (slot.casaisNovosCount || 0) + 1;
            slot.novosCount = (slot.novosCount || 0) + 1;
            slot.novosPessoasCount = (slot.novosPessoasCount || 0) + peso;
          } else if (isIndividualNovo) {
            slot.individuaisNovosCount = (slot.individuaisNovosCount || 0) + 1;
            slot.novosCount = (slot.novosCount || 0) + 1;
            slot.novosPessoasCount = (slot.novosPessoasCount || 0) + peso;
          }
          break;
        }
      }
      console.log(`[POST /api/escala/gerar] === INICIANDO AGENDAMENTO GRUPO 1: Sem Sobra/Exatos (Total: ${chavesSemSobra.length}) ===`);
      if (limitConfig === 99) {
        tentarPreencher(99, true, false, false, false, chavesSemSobra);
      } else {
        for (let l = 1; l <= initialLimit; l++) {
          tentarPreencher(l, false, false, false, false, chavesSemSobra);
        }
        for (let l = initialLimit + 1; l <= limitConfig; l++) {
          tentarPreencher(l, false, false, false, false, chavesSemSobra);
        }
        for (let l = 1; l <= limitConfig; l++) {
          tentarPreencher(l, false, true, false, false, chavesSemSobra);
        }
      }
      console.log(`[POST /api/escala/gerar] Conclu\xEDdo agendamento para o Grupo 1`);
      console.log(`[POST /api/escala/gerar] === INICIANDO AGENDAMENTO GRUPO 2: Com Sobra/Ministros a mais (Total: ${chavesComSobra.length}) ===`);
      if (limitConfig === 99) {
        tentarPreencher(99, true, false, false, false, chavesComSobra);
      } else {
        for (let l = 1; l <= initialLimit; l++) {
          tentarPreencher(l, false, false, false, false, chavesComSobra);
        }
        for (let l = initialLimit + 1; l <= limitConfig; l++) {
          tentarPreencher(l, false, false, false, false, chavesComSobra);
        }
      }
      if (limitConfig !== 99) {
        for (let l = 1; l <= initialLimit; l++) {
          tentarPreencher(l, false, true, false, false, chavesComSobra);
        }
        for (let l = initialLimit + 1; l <= limitConfig; l++) {
          tentarPreencher(l, false, true, false, false, chavesComSobra);
        }
      }
      if (limitConfig === 99) {
        tentarPreencher(99, true, true, false, false, chavesComSobra);
      } else {
        tentarPreencher(limitConfig, false, true, false, false, chavesComSobra);
      }
      const ministrosComDisp = new Set(disponibilidades.map((d) => String(d.ministro_id)));
      const ministrosEscalados = /* @__PURE__ */ new Set();
      Object.values(slots).forEach((slot) => {
        slot.ministros.forEach((m) => ministrosEscalados.add(String(m.id)));
      });
      const naoEscalados = Array.from(ministrosComDisp).filter((id) => !ministrosEscalados.has(id));
      if (naoEscalados.length > 0) {
        const nomesNaoEscalados = naoEscalados.map((id) => {
          const m = allMinistros.find((m2) => String(m2.id) === id);
          return m ? m.nome : id;
        });
        console.log(`[POST /api/escala/gerar] Ministros com disponibilidade mas N\xC3O escalados em NENHUMA missa: ${nomesNaoEscalados.join(", ")}`);
      } else {
        console.log(`[POST /api/escala/gerar] Todos os ministros com disponibilidade foram escalados em pelo menos uma missa.`);
      }
      const missasIncompletas = [];
      Object.values(slots).forEach((slot) => {
        if (slot.ocupacao < slot.quantidade) {
          const dataFormatada = slot.data.split("-").reverse().join("/");
          const diasSemanaMap = ["Domingo", "Segunda-feira", "Ter\xE7a-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "S\xE1bado"];
          const diaSemanaNome = diasSemanaMap[(/* @__PURE__ */ new Date(slot.data + "T00:00:00")).getDay()];
          missasIncompletas.push(`${diaSemanaNome} (${dataFormatada}) \xE0s ${slot.horario} - Faltando ${slot.quantidade - slot.ocupacao} vaga(s)`);
        }
      });
      const escalaFinal = {};
      const currentMonthDesignatedCount = {};
      const slotsArray = Object.values(slots).sort((a, b) => {
        if (a.data !== b.data) return a.data.localeCompare(b.data);
        return a.horario.localeCompare(b.horario);
      });
      slotsArray.forEach((slot) => {
        if (!escalaFinal[slot.data]) escalaFinal[slot.data] = {};
        if (!escalaFinal[slot.data][slot.horario]) {
          escalaFinal[slot.data][slot.horario] = {
            ministros: [],
            nome: slot.nome,
            limiteManual: slot.quantidade,
            lider: ""
          };
        }
        slot.ministros.sort((a, b) => {
          const nameA = typeof a === "string" ? a : a?.nome || "";
          const nameB = typeof b === "string" ? b : b?.nome || "";
          return nameA.localeCompare(nameB, "pt-BR", { sensitivity: "base" });
        });
        const candidatosLider = [];
        slot.ministros.forEach((m) => {
          const mId = typeof m === "object" && m !== null ? m.id : void 0;
          const mName = typeof m === "string" ? m : m?.nome;
          const mObj = allMinistros.find((min) => {
            if (mId && String(min.id) === String(mId)) return true;
            if (!mName) return false;
            if (min.nome === mName || min.nomeExibicao === mName) return true;
            if (min.tipo === "casal") {
              const c1 = (min.nomeExibicao || min.nome) + " e " + (min.nomeExibicaoConjuge || min.nomeConjuge);
              const c2 = min.nome + " e " + min.nomeConjuge;
              if (mName === c1 || mName === c2) return true;
              const p = mName.split(/\s+e\s+/).map((s) => s.trim());
              if (p.length === 2) {
                const match1 = (p[0] === min.nome || p[0] === min.nomeExibicao) && (p[1] === min.nomeConjuge || p[1] === min.nomeExibicaoConjuge);
                const match2 = (p[1] === min.nome || p[1] === min.nomeExibicao) && (p[0] === min.nomeConjuge || p[0] === min.nomeExibicaoConjuge);
                if (match1 || match2) return true;
              }
            }
            return false;
          });
          if (mObj) {
            const mModoNorm = typeof m === "object" && m !== null ? normalizeModo(m.modo) : void 0;
            const isCoord = mObj.role === "coordenacao" || mObj.role === "vice_coordenacao";
            const isCasal = mObj.tipo === "casal" || Boolean(mObj.nomeConjuge || mObj.nomeExibicaoConjuge);
            const nomeEle = mObj.nomeExibicao || mObj.nome || "";
            const nomeEla = mObj.nomeExibicaoConjuge || mObj.nomeConjuge || "";
            const slotKey = `${slot.data}|${slot.horario}|${slot.normalizedNome}`;
            const randomVal = candidateSlotRandom[slotKey]?.[String(mObj.id)] ?? (randomTieBreaker[String(mObj.id)] || Math.random());
            if (isCoord) {
              if (mModoNorm === "ela" && nomeEla) {
                candidatosLider.push({ nome: nomeEla, isCoord: true, mId: String(mObj.id), count: currentMonthDesignatedCount[nomeEla] || 0, randomVal });
              } else if (mModoNorm === "ele" && nomeEle) {
                candidatosLider.push({ nome: nomeEle, isCoord: true, mId: String(mObj.id), count: currentMonthDesignatedCount[nomeEle] || 0, randomVal });
              } else if (isCasal && nomeEle && nomeEla) {
                candidatosLider.push({ nome: nomeEle, isCoord: true, mId: String(mObj.id), count: currentMonthDesignatedCount[nomeEle] || 0, randomVal });
                candidatosLider.push({ nome: nomeEla, isCoord: true, mId: String(mObj.id), count: currentMonthDesignatedCount[nomeEla] || 0, randomVal });
              } else if (nomeEle) {
                candidatosLider.push({ nome: nomeEle, isCoord: true, mId: String(mObj.id), count: currentMonthDesignatedCount[nomeEle] || 0, randomVal });
              }
            } else if (isCasal) {
              if (mModoNorm === "ela" && mObj.isLiderConjuge && nomeEla) {
                candidatosLider.push({ nome: nomeEla, isCoord: false, mId: String(mObj.id), count: currentMonthDesignatedCount[nomeEla] || 0, randomVal });
              } else if (mModoNorm === "ele" && mObj.isLider && nomeEle) {
                candidatosLider.push({ nome: nomeEle, isCoord: false, mId: String(mObj.id), count: currentMonthDesignatedCount[nomeEle] || 0, randomVal });
              } else if (mModoNorm !== "ela" && mModoNorm !== "ele") {
                if (mObj.isLider && mObj.isLiderConjuge && nomeEle && nomeEla) {
                  candidatosLider.push({ nome: nomeEle, isCoord: false, mId: String(mObj.id), count: currentMonthDesignatedCount[nomeEle] || 0, randomVal });
                  candidatosLider.push({ nome: nomeEla, isCoord: false, mId: String(mObj.id), count: currentMonthDesignatedCount[nomeEla] || 0, randomVal });
                } else if (mObj.isLider && nomeEle) {
                  candidatosLider.push({ nome: nomeEle, isCoord: false, mId: String(mObj.id), count: currentMonthDesignatedCount[nomeEle] || 0, randomVal });
                } else if (mObj.isLiderConjuge && nomeEla) {
                  candidatosLider.push({ nome: nomeEla, isCoord: false, mId: String(mObj.id), count: currentMonthDesignatedCount[nomeEla] || 0, randomVal });
                }
              }
            } else if (mObj.isLider && nomeEle) {
              candidatosLider.push({ nome: nomeEle, isCoord: false, mId: String(mObj.id), count: currentMonthDesignatedCount[nomeEle] || 0, randomVal });
            }
          }
        });
        let designatedLeader = slot.lider || "";
        if (!designatedLeader && candidatosLider.length > 0) {
          if (slot.preferredLeaderId) {
            const pref = candidatosLider.find((c) => String(c.mId) === String(slot.preferredLeaderId));
            if (pref) {
              designatedLeader = pref.nome;
            }
          }
          if (!designatedLeader) {
            candidatosLider.sort((a, b) => {
              if (a.count !== b.count) return a.count - b.count;
              if (a.isCoord !== b.isCoord) return a.isCoord ? -1 : 1;
              return a.randomVal - b.randomVal;
            });
            designatedLeader = candidatosLider[0].nome;
          }
        }
        if (!designatedLeader) {
          designatedLeader = "";
        }
        if (designatedLeader) {
          currentMonthDesignatedCount[designatedLeader] = (currentMonthDesignatedCount[designatedLeader] || 0) + 1;
          liderancasHistoricas[designatedLeader] = (liderancasHistoricas[designatedLeader] || 0) + 1;
        }
        slot.ministros.forEach((m) => {
          const mName = typeof m === "string" ? m : m.nome;
          escalaFinal[slot.data][slot.horario].ministros.push(mName);
        });
        const normDesig = designatedLeader ? designatedLeader.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\*/g, "") : "";
        escalaFinal[slot.data][slot.horario].ministros.sort((a, b) => {
          const normA = (a || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\*/g, "");
          const normB = (b || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\*/g, "");
          const isALider = normDesig && (normA === normDesig || normA.split(/\s+e\s+/).includes(normDesig));
          const isBLider = normDesig && (normB === normDesig || normB.split(/\s+e\s+/).includes(normDesig));
          if (isALider && !isBLider) return -1;
          if (!isALider && isBLider) return 1;
          return a.localeCompare(b, "pt-BR", { sensitivity: "base" });
        });
        escalaFinal[slot.data][slot.horario].lider = designatedLeader;
      });
      if (!database_default.data.escalaGerada) database_default.data.escalaGerada = {};
      const existingEscala = database_default.data.escalaGerada[targetParoquia] || {};
      const hoje = /* @__PURE__ */ new Date();
      const mesAtualStr = hoje.toISOString().substring(0, 7);
      const novaEscalaMesclada = {};
      let keysRemoved = 0;
      Object.keys(existingEscala).forEach((data) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return;
        const dataMes = data.substring(0, 7);
        const isTargetMonth = targetMonthStr && dataMes === targetMonthStr;
        if (dataMes >= mesAtualStr && !isTargetMonth) {
          novaEscalaMesclada[data] = existingEscala[data];
        } else if (isTargetMonth) {
          keysRemoved++;
        }
      });
      console.log(`[POST /api/escala/gerar] Limpeza conclu\xEDda: ${keysRemoved} chaves antigas do m\xEAs ${targetMonthStr} removidas.`);
      Object.assign(novaEscalaMesclada, escalaFinal);
      console.log(`[POST /api/escala/gerar] Adicionadas ${Object.keys(escalaFinal).length} chaves novas.`);
      database_default.data.escalaGerada[targetParoquia] = novaEscalaMesclada;
      await database_default.write();
      try {
        const fs2 = await import("fs");
        const debugInfo = {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          targetParoquia,
          targetMonthStr,
          totalMinutosAtivos: ministros.length,
          ministrosAtivos: ministros.map((m) => ({ id: m.id, nome: m.nome, tipo: m.tipo, tempo: m.tempoMinisterio, afastado: m.afastado })),
          totalDisponibilidades: disponibilidades.length,
          disponibilidades: disponibilidades.map((d) => ({ ministro_id: d.ministro_id, data: d.data, horario: d.horario, nomeMissa: d.nomeMissa })),
          escalaFinal
        };
        fs2.writeFileSync("generator_debug.json", JSON.stringify(debugInfo, null, 2));
        console.log("[DEBUG] generator_debug.json escrito com sucesso.");
      } catch (debugErr) {
        console.error("Erro ao escrever log do gerador:", debugErr);
      }
      if (missasIncompletas.length > 0) {
        console.log(`[DEBUG] Escala gerada com avisos (incompleta) para o m\xEAs ${targetMonthStr}.`);
        return res.status(206).json({
          escala: novaEscalaMesclada,
          warning: "INCOMPLETE_SCHEDULE",
          message: "A escala foi gerada, mas algumas missas n\xE3o possuem ministros suficientes.",
          details: missasIncompletas,
          naoEscalados: naoEscalados.map((id) => {
            const m = allMinistros.find((min) => String(min.id) === String(id));
            if (!m) return id;
            if (m.tipo === "casal") {
              return `Casal: ${m.nomeExibicao || m.nome} e ${m.nomeExibicaoConjuge || m.nomeConjuge}`;
            }
            return m.nomeExibicao || m.nome;
          })
        });
      }
      console.log(`[DEBUG] Escala gerada com sucesso para o m\xEAs ${targetMonthStr}.`);
      res.json({
        escala: novaEscalaMesclada,
        naoEscalados: naoEscalados.map((id) => {
          const m = allMinistros.find((min) => String(min.id) === String(id));
          if (!m) return id;
          if (m.tipo === "casal") {
            return `Casal: ${m.nomeExibicao || m.nome} e ${m.nomeExibicaoConjuge || m.nomeConjuge}`;
          }
          return m.nomeExibicao || m.nome;
        })
      });
    } catch (error) {
      console.error("Erro ao gerar escala (nova vers\xE3o):", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.post("/api/escala/lider", async (req, res) => {
    const { paroquia: rawParoquia, data, horario, lider } = req.body;
    const paroquia = String(rawParoquia || "").trim();
    if (!paroquia || !data || !horario || lider === void 0) {
      return res.status(400).json({ error: "Par\xE2metros paroquia, data, horario e lider s\xE3o obrigat\xF3rios." });
    }
    try {
      await database_default.read();
      if (!database_default.data.escalaGerada) database_default.data.escalaGerada = {};
      const parNorm = normalize(paroquia);
      let targetP = Object.keys(database_default.data.escalaGerada).find((p) => p.toLowerCase() === paroquia.toLowerCase() || normalize(p) === parNorm);
      if (!targetP) {
        targetP = paroquia;
        database_default.data.escalaGerada[targetP] = {};
      }
      if (!database_default.data.escalaGerada[targetP][data]) {
        return res.status(404).json({ error: "Data n\xE3o encontrada na escala." });
      }
      if (!database_default.data.escalaGerada[targetP][data][horario]) {
        return res.status(404).json({ error: "Hor\xE1rio n\xE3o encontrado na escala." });
      }
      const currentSlot = database_default.data.escalaGerada[targetP][data][horario];
      if (Array.isArray(currentSlot)) {
        database_default.data.escalaGerada[targetP][data][horario] = {
          ministros: currentSlot,
          lider: String(lider).trim()
        };
      } else {
        database_default.data.escalaGerada[targetP][data][horario].lider = String(lider).trim();
      }
      await database_default.write();
      console.log(`[POST /api/escala/lider] L\xEDder atualizado para ${paroquia} (${data} \xE0s ${horario}): ${lider}`);
      res.json({ success: true, lider: String(lider).trim() });
    } catch (error) {
      console.error("Erro ao atualizar l\xEDder da escala:", error);
      res.status(500).json({ error: "Erro ao atualizar l\xEDder da escala." });
    }
  });
  app2.post("/api/escala/adicionar-ministro", async (req, res) => {
    const { paroquia: rawParoquia, data, horario, ministroNome } = req.body;
    const paroquia = String(rawParoquia || "").trim();
    if (!paroquia || !data || !horario || !ministroNome) {
      return res.status(400).json({ error: "Par\xF3quia, data, horario e ministroNome s\xE3o obrigat\xF3rios." });
    }
    try {
      await database_default.read();
      if (!database_default.data.escalaGerada) database_default.data.escalaGerada = {};
      const parNorm = normalize(paroquia);
      let targetP = Object.keys(database_default.data.escalaGerada).find((p) => p.toLowerCase() === paroquia.toLowerCase() || normalize(p) === parNorm);
      if (!targetP) {
        targetP = paroquia;
        database_default.data.escalaGerada[targetP] = {};
      }
      if (!database_default.data.escalaGerada[targetP][data]) {
        database_default.data.escalaGerada[targetP][data] = {};
      }
      if (!database_default.data.escalaGerada[targetP][data][horario]) {
        database_default.data.escalaGerada[targetP][data][horario] = { ministros: [], limiteManual: 8, nome: "Missa" };
      }
      const currentSlot = database_default.data.escalaGerada[targetP][data][horario];
      if (Array.isArray(currentSlot)) {
        database_default.data.escalaGerada[targetP][data][horario] = {
          ministros: currentSlot,
          limiteManual: 8,
          nome: "Missa"
        };
      }
      const targetSlot = database_default.data.escalaGerada[targetP][data][horario];
      if (!targetSlot.ministros) targetSlot.ministros = [];
      const exists = targetSlot.ministros.some((m) => {
        const mStr = typeof m === "string" ? m : m?.nome || "";
        return mStr.toLowerCase() === String(ministroNome).toLowerCase();
      });
      if (!exists) {
        targetSlot.ministros.push(String(ministroNome).trim());
        await database_default.write();
      }
      console.log(`[POST /api/escala/adicionar-ministro] Ministro ${ministroNome} adicionado para ${paroquia} (${data} \xE0s ${horario})`);
      res.json({ success: true, escala: database_default.data.escalaGerada[targetP] });
    } catch (error) {
      console.error("Erro ao adicionar ministro na escala:", error);
      res.status(500).json({ error: "Erro ao adicionar ministro na escala." });
    }
  });
  app2.get("/api/escala", async (req, res) => {
    const { paroquia, preview } = req.query;
    if (!paroquia) return res.status(400).json({ error: "Par\xF3quia \xE9 obrigat\xF3ria." });
    console.log(`[GET /api/escala] Paroquia: ${paroquia}, Preview: ${preview}`);
    try {
      await database_default.read();
      const targetParoquia = String(paroquia).trim();
      const isPreview = preview === "true";
      const config = database_default.data.config || {
        coordinatorEnabled: false,
        escalaPublicada: false,
        escalaPublicadaPorParoquia: {},
        escalaPublicadaPorMes: {},
        disponibilidadeAberta: false
      };
      const escalaPublicadaPorParoquia = config.escalaPublicadaPorParoquia?.[targetParoquia];
      const escalaPublicadaPorMes = config.escalaPublicadaPorMes && config.escalaPublicadaPorMes[targetParoquia] || {};
      if (!database_default.data.escalaGerada) {
        console.log(`[GET /api/escala] db.data.escalaGerada is empty`);
        return res.json({});
      }
      console.log(`[GET /api/escala] Available paroquias in escalaGerada: ${Object.keys(database_default.data.escalaGerada).join(", ")}`);
      const escalaCompleta = database_default.data.escalaGerada[targetParoquia] || {};
      console.log(`[GET /api/escala] escalaCompleta keys: ${Object.keys(escalaCompleta).length}`);
      const hoje = /* @__PURE__ */ new Date();
      const mesAtualStr = hoje.toISOString().substring(0, 7);
      const escalaFiltrada = /* @__PURE__ */ Object.create(null);
      Object.keys(escalaCompleta).forEach((data) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return;
        const mes = data.substring(0, 7);
        if (isPreview) {
          if (mes >= mesAtualStr) {
            escalaFiltrada[data] = escalaCompleta[data];
          }
        } else {
          let isMesPublicado = !!escalaPublicadaPorMes[mes] || !!escalaPublicadaPorParoquia || !!database_default.data.config.escalaPublicada;
          if (isMesPublicado) {
            escalaFiltrada[data] = escalaCompleta[data];
          }
        }
      });
      Object.keys(escalaFiltrada).forEach((data) => {
        const diaObj = escalaFiltrada[data];
        if (diaObj && typeof diaObj === "object") {
          Object.keys(diaObj).forEach((horario) => {
            const slot = diaObj[horario];
            if (slot && Array.isArray(slot.ministros)) {
              slot.ministros.sort((a, b) => {
                const nameA = typeof a === "string" ? a : a?.nome || "";
                const nameB = typeof b === "string" ? b : b?.nome || "";
                return nameA.localeCompare(nameB, "pt-BR", { sensitivity: "base" });
              });
            }
          });
        }
      });
      console.log(`[GET /api/escala] escalaFiltrada keys (mesAtualStr=${mesAtualStr}): ${Object.keys(escalaFiltrada).length}, isPreview: ${isPreview}, targetParoquia: ${targetParoquia}, !!escalaPublicadaPorParoquia=${!!escalaPublicadaPorParoquia}, config.escalaPublicada=${database_default.data.config.escalaPublicada}`);
      res.json(escalaFiltrada);
    } catch (error) {
      console.error("Erro ao buscar escala:", error);
      res.status(500).json({ error: "Erro interno do servidor.", details: String(error) });
    }
  });
  app2.post("/api/escala/enviar-lembretes-fim-de-semana", async (req, res) => {
    const { paroquia } = req.body;
    if (!paroquia) {
      return res.status(400).json({ error: "Par\xF3quia \xE9 obrigat\xF3ria." });
    }
    try {
      await database_default.read();
      const targetParoquia = String(paroquia).trim();
      if (!database_default.data.escalaGerada || !database_default.data.escalaGerada[targetParoquia]) {
        return res.json({ sentCount: 0, message: "Nenhuma escala gerada encontrada para esta par\xF3quia." });
      }
      const today = /* @__PURE__ */ new Date();
      const day = today.getDay();
      const friday = new Date(today);
      const saturday = new Date(today);
      const sunday = new Date(today);
      if (day === 0) {
        friday.setDate(today.getDate() - 2);
        saturday.setDate(today.getDate() - 1);
      } else if (day === 5) {
        saturday.setDate(today.getDate() + 1);
        sunday.setDate(today.getDate() + 2);
      } else if (day === 6) {
        friday.setDate(today.getDate() - 1);
        sunday.setDate(today.getDate() + 1);
      } else {
        friday.setDate(today.getDate() + (5 - day));
        saturday.setDate(today.getDate() + (6 - day));
        sunday.setDate(today.getDate() + (7 - day));
      }
      const formatDate = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dy = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${dy}`;
      };
      const weekendDates = [formatDate(friday), formatDate(saturday), formatDate(sunday)];
      console.log(`[Manual Weekend Reminder] Finding schedules for dates: ${weekendDates.join(", ")}`);
      let sentCount = 0;
      let dbUpdated = false;
      if (!database_default.data.mensagens) database_default.data.mensagens = [];
      for (const data of weekendDates) {
        const slotsNoDia = database_default.data.escalaGerada[targetParoquia][data];
        if (!slotsNoDia) continue;
        for (const horario of Object.keys(slotsNoDia)) {
          const missa = slotsNoDia[horario];
          if (!missa || !missa.ministros) continue;
          for (const escMin of missa.ministros) {
            const matchResult = findMinistroByNomeOrId(escMin, targetParoquia);
            if (!matchResult || matchResult.targetPhones.length === 0) continue;
            const { ministro, targetPhones } = matchResult;
            const nomeEscala = typeof escMin === "object" && escMin !== null ? escMin.nome || "" : String(escMin);
            const dateBr = data.split("-").reverse().join("/");
            const isEleLider = Boolean(ministro.isLider || ministro.role === "coordenacao" || ministro.role === "vice_coordenacao" || ministro.role === "admin");
            const isElaLider = Boolean(ministro.isLiderConjuge || ministro.role === "coordenacao" || ministro.role === "vice_coordenacao" || ministro.role === "admin");
            const rawLider = typeof missa.lider === "object" && missa.lider !== null ? missa.lider.nome || "" : String(missa.lider || "");
            const isLiderValid = rawLider && rawLider !== "N\xE3o definido" && rawLider !== "L\xEDder da Missa" && rawLider !== "Coordena\xE7\xE3o";
            let isLider = false;
            if (isLiderValid) {
              if (typeof missa.lider === "object" && missa.lider !== null && missa.lider.id && String(missa.lider.id) === String(ministro.id)) {
                isLider = isEleLider || isElaLider;
              } else {
                const normL = normalize(rawLider);
                if (normL === normalize(nomeEscala)) {
                  isLider = isEleLider || isElaLider;
                } else if (normL === normalize(ministro.nome || "") || normL === normalize(ministro.nomeExibicao || "")) {
                  isLider = isEleLider;
                } else if (normL === normalize(ministro.nomeConjuge || "") || normL === normalize(ministro.nomeExibicaoConjuge || "")) {
                  isLider = isElaLider;
                }
              }
            }
            const msgTexto = isLider ? `Ol\xE1, ${nomeEscala}! Lembrete de L\xEDder: Voc\xEA \xE9 o L\xCDDER da missa das ${horario} (${dateBr} - ${missa.nome || "Missa"}). Lembre-se de chegar com anteced\xEAncia para conferir alfaias e a equipe. Contamos com a sua presen\xE7a! Am\xE9m.` : `Ol\xE1, ${nomeEscala}! Lembrete Di\xE1rio: voc\xEA est\xE1 escalado em breve (${dateBr}) na missa de ${horario} (${missa.nome || "Missa"}). Obrigado e nos vemos na missa! Am\xE9m.`;
            for (const phone of targetPhones) {
              const jaNotificado = database_default.data.mensagens.some(
                (msg) => msg.type === "private" && String(msg.destinatario_telefone).replace(/\D/g, "") === phone && msg.texto.includes(dateBr) && msg.texto.includes(horario)
              );
              if (!jaNotificado) {
                database_default.data.mensagens.push({
                  id: Date.now() + Math.floor(Math.random() * 1e3),
                  nome: "Coordena\xE7\xE3o Paroquial",
                  telefone: "00000000000",
                  destinatario_telefone: phone,
                  texto: msgTexto,
                  paroquia: targetParoquia,
                  type: "private",
                  data: (/* @__PURE__ */ new Date()).toISOString()
                });
                sentCount++;
                dbUpdated = true;
                sendPushNotificationToUser(phone, isLider ? "Lembrete de L\xEDder \u2B50" : "Lembrete de Escala \u{1F4C5}", msgTexto, "/", targetParoquia);
              }
            }
          }
        }
      }
      if (dbUpdated) {
        await database_default.write();
      }
      res.json({ sentCount, message: `Lembretes enviados com sucesso para ${sentCount} ministros.` });
    } catch (error) {
      console.error("Erro ao enviar lembretes manuais de fim de semana:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.get("/api/fix-escala-june", async (req, res) => {
    try {
      await database_default.read();
      if (database_default.data.escalaGerada) {
        const paroquias = Object.keys(database_default.data.escalaGerada);
        let fixedCount = 0;
        paroquias.forEach((par) => {
          const escala = database_default.data.escalaGerada[par];
          if (escala["2026-06-06"] && escala["2026-06-06"]["17:00"]) {
            console.log(`[FIX] Fixing Saturday for paroquia ${par}`);
            escala["2026-06-06"]["17:00"].ministros = escala["2026-06-06"]["17:00"].ministros.map((m) => {
              if (m.includes("Valter") || m.includes("S\xF4nia")) return "S\xF4nia";
              return m;
            });
            escala["2026-06-06"]["17:00"].ministros = Array.from(new Set(escala["2026-06-06"]["17:00"].ministros));
            fixedCount++;
          }
          if (escala["2026-06-07"] && escala["2026-06-07"]["10:00"]) {
            console.log(`[FIX] Fixing Sunday for paroquia ${par}`);
            escala["2026-06-07"]["10:00"].ministros = escala["2026-06-07"]["10:00"].ministros.map((m) => {
              if (m.toLowerCase() === "s\xF4nia") return "Cristiane";
              return m;
            });
            fixedCount++;
          }
        });
        await database_default.write();
        res.send(`Fixed in ${fixedCount} locations across ${paroquias.length} paroquias`);
      } else {
        res.send("No data");
      }
    } catch (e) {
      console.error(e);
      res.status(500).send("Error");
    }
  });
  app2.get("/api/trocas", async (req, res) => {
    let { paroquia, ministroId } = req.query;
    if (!paroquia || paroquia === "undefined" || paroquia === "null") {
      return res.status(403).json({ error: "Par\xF3quia n\xE3o informada ou inv\xE1lida." });
    }
    try {
      await database_default.read();
      let trocas = database_default.data.trocas || [];
      const seenIds = /* @__PURE__ */ new Set();
      const uniqueTrocas = [];
      let hasDuplicates = false;
      for (const t of trocas) {
        if (t && t.id) {
          if (!seenIds.has(t.id)) {
            seenIds.add(t.id);
            uniqueTrocas.push(t);
          } else {
            hasDuplicates = true;
          }
        }
      }
      if (hasDuplicates) {
        database_default.data.trocas = uniqueTrocas;
        await database_default.write();
        trocas = uniqueTrocas;
      }
      const targetParoquia = normalize(String(paroquia));
      trocas = trocas.filter((t) => t && t.paroquia && normalize(t.paroquia) === targetParoquia);
      if (ministroId) {
        const mId = Number(ministroId);
        trocas = trocas.filter((t) => t.solicitanteId === mId || t.destinatarioId === mId);
      }
      res.json(trocas);
    } catch (error) {
      console.error("Erro ao buscar trocas:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.post("/api/trocas", async (req, res) => {
    const {
      solicitanteId,
      solicitanteNome,
      solicitanteTelefone,
      paroquia,
      missaOrigemData,
      missaOrigemHorario,
      missaOrigemMissa,
      tipo,
      destinatarioId,
      destinatarioNome,
      destinatarioTelefone,
      missaDestinoData,
      missaDestinoHorario,
      missaDestinoMissa,
      solicitanteSubMembro,
      destinatarioSubMembro,
      segundoDestinatarioId,
      segundoDestinatarioNome,
      segundoDestinatarioTelefone,
      iniciadoPelaCoordenacao
    } = req.body;
    if (!solicitanteId || !paroquia || !missaOrigemData || !missaOrigemHorario || !tipo || !destinatarioId) {
      return res.status(400).json({ error: "Todos os campos obrigat\xF3rios devem ser preenchidos." });
    }
    if (segundoDestinatarioId) {
      if (String(destinatarioId) === String(segundoDestinatarioId) || destinatarioNome && segundoDestinatarioNome && String(destinatarioNome).trim().toLowerCase() === String(segundoDestinatarioNome).trim().toLowerCase()) {
        return res.status(400).json({ error: "N\xE3o \xE9 poss\xEDvel selecionar o mesmo ministro para ambos os slots." });
      }
    }
    try {
      await database_default.read();
      if (!database_default.data.trocas) database_default.data.trocas = [];
      const novaTroca = {
        id: "t_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        paroquia: String(paroquia),
        solicitanteId: Number(solicitanteId),
        solicitanteNome: String(solicitanteNome),
        solicitanteTelefone: String(solicitanteTelefone),
        missaOrigemData: String(missaOrigemData),
        missaOrigemHorario: String(missaOrigemHorario),
        missaOrigemMissa: String(missaOrigemMissa),
        tipo,
        destinatarioId: Number(destinatarioId),
        destinatarioNome: String(destinatarioNome),
        destinatarioTelefone: String(destinatarioTelefone),
        missaDestinoData: missaDestinoData ? String(missaDestinoData) : void 0,
        missaDestinoHorario: missaDestinoHorario ? String(missaDestinoHorario) : void 0,
        missaDestinoMissa: missaDestinoMissa ? String(missaDestinoMissa) : void 0,
        status: "pendente_destinatario",
        dataSolicitacao: (/* @__PURE__ */ new Date()).toISOString(),
        solicitanteSubMembro: solicitanteSubMembro || "ambos",
        destinatarioSubMembro: destinatarioSubMembro || "ambos",
        segundoDestinatarioId: segundoDestinatarioId ? Number(segundoDestinatarioId) : void 0,
        segundoDestinatarioNome: segundoDestinatarioNome ? String(segundoDestinatarioNome) : void 0,
        segundoDestinatarioTelefone: segundoDestinatarioTelefone ? String(segundoDestinatarioTelefone) : void 0
      };
      database_default.data.trocas.push(novaTroca);
      await database_default.write();
      if (!database_default.data.mensagens) database_default.data.mensagens = [];
      const msgTexto = `\u26A0\uFE0F [Solicita\xE7\xE3o de Troca] O ministro ${solicitanteNome} solicitou troca para a missa do dia ${missaOrigemData.split("-").reverse().join("/")} \xE0s ${missaOrigemHorario} com o ministro ${destinatarioNome}.`;
      database_default.data.mensagens.push({
        id: Date.now() + Math.floor(Math.random() * 1e3),
        nome: "Sistema",
        telefone: "0000000000",
        destinatario_telefone: destinatarioTelefone || null,
        texto: msgTexto,
        data: (/* @__PURE__ */ new Date()).toISOString(),
        paroquia: String(paroquia),
        type: "private",
        lida: false
      });
      await database_default.write();
      if (destinatarioTelefone) {
        sendPushNotificationToUser(destinatarioTelefone, "Solicita\xE7\xE3o de Troca \u{1F504}", `O ministro ${solicitanteNome} solicitou troca com voc\xEA para o dia ${missaOrigemData.split("-").reverse().join("/")}.`, "/", paroquia);
      }
      res.status(201).json(novaTroca);
    } catch (error) {
      console.error("Erro ao solicitar troca:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.post("/api/trocas/:id/responder-ministro", async (req, res) => {
    const { id } = req.params;
    const { resposta } = req.body;
    if (!resposta || resposta !== "aceitar" && resposta !== "rejeitar") {
      return res.status(400).json({ error: "Resposta inv\xE1lida." });
    }
    try {
      await database_default.read();
      const trocas = database_default.data.trocas || [];
      const troca = trocas.find((t) => t.id === id);
      if (!troca) return res.status(404).json({ error: "Troca n\xE3o encontrada." });
      if (troca.status !== "pendente_destinatario") {
        return res.status(400).json({ error: "Essa troca n\xE3o est\xE1 pendente de resposta do ministro destinat\xE1rio." });
      }
      let msgTexto = "";
      if (resposta === "aceitar") {
        troca.status = "pendente_coordenacao";
        msgTexto = `O ministro ${troca.destinatarioNome} ACEITOU a solicita\xE7\xE3o de troca do dia ${troca.missaOrigemData.split("-").reverse().join("/")} \xE0s ${troca.missaOrigemHorario}! Agora aguarda aprova\xE7\xE3o da coordena\xE7\xE3o.`;
      } else {
        troca.status = "rejeitado_destinatario";
        msgTexto = `O ministro ${troca.destinatarioNome} recusou a solicita\xE7\xE3o de troca do dia ${troca.missaOrigemData.split("-").reverse().join("/")} \xE0s ${troca.missaOrigemHorario}.`;
      }
      if (!database_default.data.mensagens) database_default.data.mensagens = [];
      database_default.data.mensagens.push({
        id: Date.now() + Math.floor(Math.random() * 1e3),
        nome: "Sistema",
        telefone: "0000000000",
        destinatario_telefone: troca.solicitanteTelefone || null,
        texto: msgTexto,
        data: (/* @__PURE__ */ new Date()).toISOString(),
        paroquia: String(troca.paroquia),
        type: "private",
        lida: false
      });
      const paroquiaObj = database_default.data.paroquias?.find((p) => p.nome === troca.paroquia);
      const coordTelefone = paroquiaObj?.telefoneCoordenador;
      if (resposta === "aceitar" && coordTelefone) {
        database_default.data.mensagens.push({
          id: Date.now() + Math.floor(Math.random() * 1001),
          nome: "Sistema",
          telefone: "0000000000",
          destinatario_telefone: coordTelefone,
          texto: `\u26A0\uFE0F Nova troca aguardando aprova\xE7\xE3o: O ministro ${troca.destinatarioNome} aceitou a troca com ${troca.solicitanteNome} para o dia ${troca.missaOrigemData.split("-").reverse().join("/")} \xE0s ${troca.missaOrigemHorario}.`,
          data: (/* @__PURE__ */ new Date()).toISOString(),
          paroquia: String(troca.paroquia),
          type: "private",
          lida: false
        });
      }
      await database_default.write();
      if (troca.solicitanteTelefone) {
        sendPushNotificationToUser(troca.solicitanteTelefone, resposta === "aceitar" ? "Troca Aceita! \u2705" : "Troca Recusada \u274C", msgTexto, "/", troca.paroquia);
      }
      if (resposta === "aceitar" && coordTelefone) {
        sendPushNotificationToUser(coordTelefone, "Troca Aguardando Aprova\xE7\xE3o \u26A0\uFE0F", `O ministro ${troca.destinatarioNome} aceitou a troca com ${troca.solicitanteNome}.`, "/", troca.paroquia);
      }
      res.json(troca);
    } catch (error) {
      console.error("Erro ao responder como ministro:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  const isMinisterEligibleLeader = (min, isConjuge = false) => {
    if (!min) return false;
    if (min.role === "coordenacao" || min.role === "vice_coordenacao" || min.role === "admin") return true;
    if (isConjuge) return Boolean(min.isLiderConjuge);
    return Boolean(min.isLider);
  };
  const isMinisterMatchingLeaderName = (minOrName, currentLeaderStr) => {
    if (!currentLeaderStr || !minOrName) return false;
    const normLid = normalize(currentLeaderStr);
    if (!normLid) return false;
    if (typeof minOrName === "string") {
      const normM = normalize(minOrName);
      if (normM === normLid) return true;
      if (normM.includes(normLid) || normLid.includes(normM)) return true;
      const parts = normM.split(/\s+(?:e|&|\/)\s+/).map((p) => normalize(p)).filter(Boolean);
      return parts.some((p) => p === normLid || normLid.includes(p) || p.includes(normLid));
    }
    const n1 = normalize(minOrName.nome || "");
    const n2 = normalize(minOrName.nomeExibicao || minOrName.nome || "");
    const n3 = normalize(minOrName.nomeConjuge || "");
    const n4 = normalize(minOrName.nomeExibicaoConjuge || minOrName.nomeConjuge || "");
    const combined = normalize(`${n2} e ${n4}`);
    return normLid === n1 || normLid === n2 || normLid === n3 || normLid === n4 || normLid === combined || normLid.includes(n2) || normLid.includes(n1) || n2.includes(normLid) || n1.includes(normLid);
  };
  const syncSlotLeaderOnSwap = (slot, removedMinister, incomingMinister, allMinisters, paroquia) => {
    if (!slot || !slot.ministros || !Array.isArray(slot.ministros)) return;
    const currentLeader = String(slot.lider || "").trim();
    const wasRemovedMinisterLeader = isMinisterMatchingLeaderName(removedMinister, currentLeader);
    const isCurrentLeaderStillInSlot = slot.ministros.some(
      (mName) => isMinisterMatchingLeaderName(mName, currentLeader)
    );
    if (wasRemovedMinisterLeader || !isCurrentLeaderStillInSlot || !currentLeader) {
      let newLeaderName = "";
      const incomingMinObj = typeof incomingMinister === "object" && incomingMinister !== null ? incomingMinister : allMinisters.find(
        (m) => (!paroquia || !m.paroquia || normalize(m.paroquia) === normalize(paroquia)) && (normalize(m.nome || "") === normalize(String(incomingMinister)) || normalize(m.nomeExibicao || "") === normalize(String(incomingMinister)) || normalize(m.nomeConjuge || "") === normalize(String(incomingMinister)) || normalize(m.nomeExibicaoConjuge || "") === normalize(String(incomingMinister)) || normalize(`${m.nomeExibicao || m.nome} e ${m.nomeExibicaoConjuge || m.nomeConjuge}`) === normalize(String(incomingMinister)) || normalize(String(incomingMinister)).includes(normalize(m.nomeExibicao || m.nome || "")))
      );
      if (incomingMinObj) {
        const isEligible = isMinisterEligibleLeader(incomingMinObj);
        const isEligibleConjuge = isMinisterEligibleLeader(incomingMinObj, true);
        if (isEligible || isEligibleConjuge) {
          if (incomingMinObj.tipo === "casal") {
            if (isEligible && isEligibleConjuge) {
              newLeaderName = `${incomingMinObj.nomeExibicao || incomingMinObj.nome} e ${incomingMinObj.nomeExibicaoConjuge || incomingMinObj.nomeConjuge}`;
            } else if (isEligible) {
              newLeaderName = incomingMinObj.nomeExibicao || incomingMinObj.nome;
            } else {
              newLeaderName = incomingMinObj.nomeExibicaoConjuge || incomingMinObj.nomeConjuge;
            }
          } else {
            newLeaderName = incomingMinObj.nomeExibicao || incomingMinObj.nome;
          }
        }
      }
      if (!newLeaderName) {
        for (const mName of slot.ministros) {
          const normM = normalize(mName);
          const match = allMinisters.find(
            (m) => (!paroquia || !m.paroquia || normalize(m.paroquia) === normalize(paroquia)) && (normalize(m.nome || "") === normM || normalize(m.nomeExibicao || "") === normM || normalize(m.nomeConjuge || "") === normM || normalize(m.nomeExibicaoConjuge || "") === normM || normalize(`${m.nomeExibicao || m.nome} e ${m.nomeExibicaoConjuge || m.nomeConjuge}`) === normM || normM.includes(normalize(m.nomeExibicao || m.nome || "")))
          );
          if (match && (isMinisterEligibleLeader(match) || isMinisterEligibleLeader(match, true))) {
            if (match.tipo === "casal") {
              if (isMinisterEligibleLeader(match) && isMinisterEligibleLeader(match, true)) {
                newLeaderName = `${match.nomeExibicao || match.nome} e ${match.nomeExibicaoConjuge || match.nomeConjuge}`;
              } else if (isMinisterEligibleLeader(match)) {
                newLeaderName = match.nomeExibicao || match.nome;
              } else {
                newLeaderName = match.nomeExibicaoConjuge || match.nomeConjuge;
              }
            } else {
              newLeaderName = match.nomeExibicao || match.nome;
            }
            break;
          }
        }
      }
      if (newLeaderName) {
        slot.lider = newLeaderName;
      } else {
        slot.lider = "";
      }
    }
    if (slot.lider && Array.isArray(slot.ministros) && slot.ministros.length > 0) {
      const leaderNorm = normalize(slot.lider);
      slot.ministros.sort((a, b) => {
        const normA = normalize(a);
        const normB = normalize(b);
        const isALeader = normA === leaderNorm || normA.includes(leaderNorm) || leaderNorm.includes(normA);
        const isBLeader = normB === leaderNorm || normB.includes(leaderNorm) || leaderNorm.includes(normB);
        if (isALeader && !isBLeader) return -1;
        if (!isALeader && isBLeader) return 1;
        return a.localeCompare(b, "pt-BR", { sensitivity: "base" });
      });
    }
  };
  app2.post("/api/trocas/:id/responder-coordenador", async (req, res) => {
    const { id } = req.params;
    const { resposta } = req.body;
    if (!resposta || resposta !== "aprovar" && resposta !== "rejeitar") {
      return res.status(400).json({ error: "Resposta inv\xE1lida." });
    }
    try {
      await database_default.read();
      const trocas = database_default.data.trocas || [];
      const troca = trocas.find((t) => t.id === id);
      if (!troca) return res.status(404).json({ error: "Troca n\xE3o encontrada." });
      if (troca.status !== "pendente_coordenacao" && troca.status !== "pendente_destinatario") {
        return res.status(400).json({ error: "Essa troca n\xE3o est\xE1 pendente de aprova\xE7\xE3o." });
      }
      if (resposta === "rejeitar") {
        troca.status = "rejeitado_coordenacao";
        const msgTexto = `\u274C [Troca Recusada] A coordena\xE7\xE3o n\xE3o aprovou a sua solicita\xE7\xE3o de troca para a missa do dia ${troca.missaOrigemData.split("-").reverse().join("/")} \xE0s ${troca.missaOrigemHorario}.`;
        if (!database_default.data.mensagens) database_default.data.mensagens = [];
        database_default.data.mensagens.push({
          id: Date.now() + Math.floor(Math.random() * 1e3),
          nome: "Sistema",
          telefone: "0000000000",
          destinatario_telefone: troca.solicitanteTelefone || null,
          texto: msgTexto,
          data: (/* @__PURE__ */ new Date()).toISOString(),
          paroquia: String(troca.paroquia),
          type: "private",
          lida: false
        });
        await database_default.write();
        return res.json(troca);
      }
      troca.status = "aprovado";
      const { paroquia, missaOrigemData, missaOrigemHorario, solicitanteId, destinatarioId } = troca;
      if (database_default.data.escalaGerada && database_default.data.escalaGerada[paroquia]) {
        const paroquiaEscala = database_default.data.escalaGerada[paroquia];
        if (paroquiaEscala[missaOrigemData] && paroquiaEscala[missaOrigemData][missaOrigemHorario]) {
          const slot = paroquiaEscala[missaOrigemData][missaOrigemHorario];
          if (!slot.ministros) slot.ministros = [];
          const slotMinistros = slot.ministros;
          const solMin = database_default.data.ministros.find((m) => Number(m.id) === Number(solicitanteId));
          const destMin = database_default.data.ministros.find((m) => Number(m.id) === Number(destinatarioId));
          if (solMin) {
            const solName1 = normalize(solMin.nome);
            const solName2 = normalize(solMin.nomeExibicao || solMin.nome);
            const solName3 = normalize(solMin.nomeConjuge || "");
            const solName4 = normalize(solMin.nomeExibicaoConjuge || "");
            const combinedSol = normalize(`${solMin.nomeExibicao || solMin.nome} e ${solMin.nomeExibicaoConjuge || solMin.nomeConjuge}`);
            const matchIndex = slotMinistros.findIndex((mName) => {
              const nmName = normalize(mName);
              return nmName === solName1 || nmName === solName2 || nmName === solName3 || nmName === solName4 || nmName === combinedSol || nmName.includes(solName2) || nmName.includes(solName1);
            });
            let destDisplayName = destMin ? destMin.nomeExibicao || destMin.nome : "";
            const tAny = troca;
            if (destMin && destMin.tipo === "casal" && (!tAny.destinatarioSubMembro || tAny.destinatarioSubMembro === "ambos")) {
              destDisplayName = `${destMin.nomeExibicao || destMin.nome} e ${destMin.nomeExibicaoConjuge || destMin.nomeConjuge}`;
            } else if (destMin && destMin.tipo === "casal" && tAny.destinatarioSubMembro === "marido") {
              destDisplayName = destMin.nomeExibicao || destMin.nome;
            } else if (destMin && destMin.tipo === "casal" && tAny.destinatarioSubMembro === "esposa") {
              destDisplayName = destMin.nomeExibicaoConjuge || destMin.nomeConjuge;
            }
            const subMembro = tAny.solicitanteSubMembro || "ambos";
            if (solMin.tipo === "casal" && subMembro !== "ambos" && matchIndex !== -1) {
              const maridoName = solMin.nomeExibicao || solMin.nome;
              const esposaName = solMin.nomeExibicaoConjuge || solMin.nomeConjuge;
              const originalStr = slotMinistros[matchIndex];
              if (subMembro === "marido") {
                const hasEsposa = originalStr && (normalize(originalStr).includes(normalize(esposaName)) || solMin.nomeConjuge && normalize(originalStr).includes(normalize(solMin.nomeConjuge)) || solMin.nomeExibicaoConjuge && normalize(originalStr).includes(normalize(solMin.nomeExibicaoConjuge)));
                if (hasEsposa) {
                  if (destDisplayName) {
                    slotMinistros.splice(matchIndex, 1, destDisplayName, esposaName);
                  } else {
                    slotMinistros[matchIndex] = esposaName;
                  }
                } else {
                  if (destDisplayName) {
                    slotMinistros[matchIndex] = destDisplayName;
                  } else {
                    slotMinistros.splice(matchIndex, 1);
                  }
                }
              } else if (subMembro === "esposa") {
                const hasMarido = originalStr && (normalize(originalStr).includes(normalize(maridoName)) || solMin.nome && normalize(originalStr).includes(normalize(solMin.nome)) || solMin.nomeExibicao && normalize(originalStr).includes(normalize(solMin.nomeExibicao)));
                if (hasMarido) {
                  if (destDisplayName) {
                    slotMinistros.splice(matchIndex, 1, maridoName, destDisplayName);
                  } else {
                    slotMinistros[matchIndex] = maridoName;
                  }
                } else {
                  if (destDisplayName) {
                    slotMinistros[matchIndex] = destDisplayName;
                  } else {
                    slotMinistros.splice(matchIndex, 1);
                  }
                }
              }
            } else {
              if (tAny.segundoDestinatarioNome && matchIndex !== -1) {
                slotMinistros.splice(matchIndex, 1, destDisplayName, tAny.segundoDestinatarioNome);
              } else {
                if (matchIndex !== -1) {
                  slotMinistros[matchIndex] = destDisplayName;
                } else {
                  slotMinistros.push(destDisplayName);
                }
              }
            }
          }
        }
        if (troca.tipo === "direta" && troca.missaDestinoData && troca.missaDestinoHorario) {
          const destData = troca.missaDestinoData;
          const destHorario = troca.missaDestinoHorario;
          if (paroquiaEscala[destData] && paroquiaEscala[destData][destHorario]) {
            const slotDest = paroquiaEscala[destData][destHorario];
            if (!slotDest.ministros) slotDest.ministros = [];
            const slotMinistrosDest = slotDest.ministros;
            const solMin = database_default.data.ministros.find((m) => Number(m.id) === Number(solicitanteId));
            const destMin = database_default.data.ministros.find((m) => Number(m.id) === Number(destinatarioId));
            if (destMin) {
              const destName1 = normalize(destMin.nome);
              const destName2 = normalize(destMin.nomeExibicao || destMin.nome);
              const destName3 = normalize(destMin.nomeConjuge || "");
              const destName4 = normalize(destMin.nomeExibicaoConjuge || "");
              const combinedDest = normalize(`${destMin.nomeExibicao || destMin.nome} e ${destMin.nomeExibicaoConjuge || destMin.nomeConjuge}`);
              const matchIndexDest = slotMinistrosDest.findIndex((mName) => {
                const nmName = normalize(mName);
                return nmName === destName1 || nmName === destName2 || nmName === destName3 || nmName === destName4 || nmName === combinedDest || nmName.includes(destName2) || nmName.includes(destName1);
              });
              const tAny = troca;
              let solDisplayName = solMin ? solMin.nomeExibicao || solMin.nome : "";
              if (solMin && solMin.tipo === "casal" && (!tAny.solicitanteSubMembro || tAny.solicitanteSubMembro === "ambos")) {
                solDisplayName = `${solMin.nomeExibicao || solMin.nome} e ${solMin.nomeExibicaoConjuge || solMin.nomeConjuge}`;
              } else if (solMin && solMin.tipo === "casal" && tAny.solicitanteSubMembro === "marido") {
                solDisplayName = solMin.nomeExibicao || solMin.nome;
              } else if (solMin && solMin.tipo === "casal" && tAny.solicitanteSubMembro === "esposa") {
                solDisplayName = solMin.nomeExibicaoConjuge || solMin.nomeConjuge;
              }
              const destSubMembro = tAny.destinatarioSubMembro || "ambos";
              if (destMin.tipo === "casal" && destSubMembro !== "ambos" && matchIndexDest !== -1) {
                const maridoName = destMin.nomeExibicao || destMin.nome;
                const esposaName = destMin.nomeExibicaoConjuge || destMin.nomeConjuge;
                const originalStr = slotMinistrosDest[matchIndexDest];
                if (destSubMembro === "marido") {
                  const hasEsposa = originalStr && (normalize(originalStr).includes(normalize(esposaName)) || destMin.nomeConjuge && normalize(originalStr).includes(normalize(destMin.nomeConjuge)) || destMin.nomeExibicaoConjuge && normalize(originalStr).includes(normalize(destMin.nomeExibicaoConjuge)));
                  if (hasEsposa) {
                    if (solDisplayName) {
                      slotMinistrosDest.splice(matchIndexDest, 1, solDisplayName, esposaName);
                    } else {
                      slotMinistrosDest[matchIndexDest] = esposaName;
                    }
                  } else {
                    if (solDisplayName) {
                      slotMinistrosDest[matchIndexDest] = solDisplayName;
                    } else {
                      slotMinistrosDest.splice(matchIndexDest, 1);
                    }
                  }
                } else if (destSubMembro === "esposa") {
                  const hasMarido = originalStr && (normalize(originalStr).includes(normalize(maridoName)) || destMin.nome && normalize(originalStr).includes(normalize(destMin.nome)) || destMin.nomeExibicao && normalize(originalStr).includes(normalize(destMin.nomeExibicao)));
                  if (hasMarido) {
                    if (solDisplayName) {
                      slotMinistrosDest.splice(matchIndexDest, 1, maridoName, solDisplayName);
                    } else {
                      slotMinistrosDest[matchIndexDest] = maridoName;
                    }
                  } else {
                    if (solDisplayName) {
                      slotMinistrosDest[matchIndexDest] = solDisplayName;
                    } else {
                      slotMinistrosDest.splice(matchIndexDest, 1);
                    }
                  }
                }
              } else {
                if (matchIndexDest !== -1) {
                  slotMinistrosDest[matchIndexDest] = solDisplayName;
                } else {
                  slotMinistrosDest.push(solDisplayName);
                }
              }
            }
          }
        }
        const solMinObj = database_default.data.ministros.find((m) => Number(m.id) === Number(solicitanteId));
        const destMinObj = database_default.data.ministros.find((m) => Number(m.id) === Number(destinatarioId));
        if (paroquiaEscala[missaOrigemData] && paroquiaEscala[missaOrigemData][missaOrigemHorario]) {
          const slotOrigem = paroquiaEscala[missaOrigemData][missaOrigemHorario];
          syncSlotLeaderOnSwap(slotOrigem, solMinObj || troca.solicitanteNome, destMinObj || troca.destinatarioNome, database_default.data.ministros, paroquia);
          if (database_default.data.relatoriosLider && Array.isArray(database_default.data.relatoriosLider)) {
            const rep = database_default.data.relatoriosLider.find(
              (r) => normalize(r.paroquia) === normalize(paroquia) && r.data === missaOrigemData && r.horario === missaOrigemHorario
            );
            if (rep && slotOrigem.lider) {
              rep.liderNome = slotOrigem.lider;
            }
          }
        }
        if (troca.tipo === "direta" && troca.missaDestinoData && troca.missaDestinoHorario) {
          const destData = troca.missaDestinoData;
          const destHorario = troca.missaDestinoHorario;
          if (paroquiaEscala[destData] && paroquiaEscala[destData][destHorario]) {
            const slotDest = paroquiaEscala[destData][destHorario];
            syncSlotLeaderOnSwap(slotDest, destMinObj || troca.destinatarioNome, solMinObj || troca.solicitanteNome, database_default.data.ministros, paroquia);
            if (database_default.data.relatoriosLider && Array.isArray(database_default.data.relatoriosLider)) {
              const rep = database_default.data.relatoriosLider.find(
                (r) => normalize(r.paroquia) === normalize(paroquia) && r.data === destData && r.horario === destHorario
              );
              if (rep && slotDest.lider) {
                rep.liderNome = slotDest.lider;
              }
            }
          }
        }
      }
      await database_default.write();
      if (!database_default.data.mensagens) database_default.data.mensagens = [];
      database_default.data.mensagens.push({
        id: Date.now() + Math.floor(Math.random() * 1e3),
        nome: "Sistema",
        telefone: "0000000000",
        destinatario_telefone: troca.solicitanteTelefone || null,
        texto: `\u2705 [Troca Aprovada] A coordena\xE7\xE3o aprovou a sua troca para a missa do dia ${troca.missaOrigemData.split("-").reverse().join("/")} \xE0s ${troca.missaOrigemHorario}. O ministro ${troca.destinatarioNome} agora est\xE1 escalado em seu lugar!`,
        data: (/* @__PURE__ */ new Date()).toISOString(),
        paroquia: String(troca.paroquia),
        type: "private",
        lida: false
      });
      if (troca.destinatarioTelefone) {
        database_default.data.mensagens.push({
          id: Date.now() + Math.floor(Math.random() * 1001),
          nome: "Sistema",
          telefone: "0000000000",
          destinatario_telefone: troca.destinatarioTelefone,
          texto: `\u2705 [Troca Aprovada] A coordena\xE7\xE3o aprovou a troca para a missa do dia ${troca.missaOrigemData.split("-").reverse().join("/")} \xE0s ${troca.missaOrigemHorario}. Voc\xEA agora est\xE1 escalado no lugar de ${troca.solicitanteNome}!`,
          data: (/* @__PURE__ */ new Date()).toISOString(),
          paroquia: String(troca.paroquia),
          type: "private",
          lida: false
        });
      }
      await database_default.write();
      if (troca.solicitanteTelefone) {
        sendPushNotificationToUser(troca.solicitanteTelefone, "Troca Aprovada! \u2705", `A coordena\xE7\xE3o aprovou a sua troca com ${troca.destinatarioNome}.`, "/", troca.paroquia);
      }
      if (troca.destinatarioTelefone) {
        sendPushNotificationToUser(troca.destinatarioTelefone, "Troca Aprovada! \u2705", `A coordena\xE7\xE3o aprovou a sua troca com ${troca.solicitanteNome}.`, "/", troca.paroquia);
      }
      res.json(troca);
    } catch (error) {
      console.error("Erro ao responder como coordenador:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.post("/api/trocas/rapida", async (req, res) => {
    const { paroquia: rawParoquia, slotA, slotB } = req.body;
    const paroquia = String(rawParoquia).trim();
    if (!paroquia || !slotA || !slotB) {
      return res.status(400).json({ error: "Par\xE2metros paroquia, slotA e slotB s\xE3o obrigat\xF3rios." });
    }
    try {
      await database_default.read();
      if (!database_default.data.escalaGerada) database_default.data.escalaGerada = {};
      const parNorm = normalize(paroquia);
      let parEscala = database_default.data.escalaGerada[paroquia] || database_default.data.escalaGerada[parNorm];
      if (!parEscala) {
        return res.status(404).json({ error: `Escala n\xE3o encontrada para a par\xF3quia "${paroquia}".` });
      }
      const sA = parEscala[slotA.date]?.[slotA.time];
      if (!sA) {
        return res.status(404).json({ error: "Hor\xE1rio A n\xE3o encontrado na escala." });
      }
      const getMemberName = (slot) => {
        if (slot.tipo === "casal") {
          if (slot.member === "c1") return slot.conjuge1 || slot.ministerName?.split(/\s+e\s+/i)[0]?.trim() || slot.name?.split(/\s+e\s+/i)[0]?.trim();
          if (slot.member === "c2") return slot.conjuge2 || slot.ministerName?.split(/\s+e\s+/i)[1]?.trim() || slot.name?.split(/\s+e\s+/i)[1]?.trim();
          if (slot.member === "both") {
            const c1 = slot.conjuge1 || slot.ministerName?.split(/\s+e\s+/i)[0]?.trim() || slot.name?.split(/\s+e\s+/i)[0]?.trim();
            const c2 = slot.conjuge2 || slot.ministerName?.split(/\s+e\s+/i)[1]?.trim() || slot.name?.split(/\s+e\s+/i)[1]?.trim();
            if (c1 && c2 && c1 !== c2) return `${c1} e ${c2}`;
            return c1 || c2 || (slot.isMinister ? slot.name : slot.ministerName);
          }
        }
        return slot.isMinister ? slot.name : slot.ministerName;
      };
      const getReplacementStrings = (fullString, slot, incomingSlot) => {
        const nameToRemove = getMemberName(slot);
        const nameToInsert = getMemberName(incomingSlot);
        if (slot.tipo === "casal" && slot.member !== "both") {
          const spouse1 = normalize(slot.conjuge1);
          const spouse2 = normalize(slot.conjuge2);
          const parts = fullString.split(/\s+e\s+/i);
          let remaining = "";
          if (parts.length === 2) {
            if (normalize(parts[0]) === normalize(nameToRemove)) remaining = parts[1];
            else if (normalize(parts[1]) === normalize(nameToRemove)) remaining = parts[0];
          }
          if (!remaining) {
            remaining = normalize(nameToRemove) === spouse1 ? slot.conjuge2 : slot.conjuge1;
          }
          if (incomingSlot.tipo === "casal" && incomingSlot.member !== "both") {
            return [remaining, nameToInsert];
          }
          return [remaining, nameToInsert];
        }
        return [nameToInsert];
      };
      if (slotB.isMinister) {
        const nameToInsert = getMemberName(slotB);
        const nameToRemove = getMemberName(slotA);
        if (sA.ministros && Array.isArray(sA.ministros)) {
          const idx = sA.ministros.findIndex((m) => normalize(m) === normalize(slotA.ministerName));
          if (idx !== -1) {
            const newEntries = getReplacementStrings(sA.ministros[idx], slotA, slotB);
            sA.ministros.splice(idx, 1, ...newEntries);
          } else {
            const fallbackIdx = sA.ministros.findIndex((m) => normalize(m).includes(normalize(nameToRemove)));
            if (fallbackIdx !== -1) {
              const newEntries = getReplacementStrings(sA.ministros[fallbackIdx], slotA, slotB);
              sA.ministros.splice(fallbackIdx, 1, ...newEntries);
            } else {
              sA.ministros[0] = nameToInsert;
            }
          }
        } else {
          sA.ministros = [nameToInsert];
        }
        syncSlotLeaderOnSwap(sA, nameToRemove, nameToInsert, database_default.data.ministros, paroquia);
        if (database_default.data.relatoriosLider && Array.isArray(database_default.data.relatoriosLider)) {
          const rep = database_default.data.relatoriosLider.find(
            (r) => normalize(r.paroquia) === normalize(paroquia) && r.data === slotA.date && r.horario === slotA.time
          );
          if (rep && sA.lider) {
            rep.liderNome = sA.lider;
          }
        }
        if (!database_default.data.trocas) database_default.data.trocas = [];
        database_default.data.trocas.push({
          id: Date.now().toString(),
          paroquia,
          solicitanteId: 0,
          solicitanteNome: "Coordena\xE7\xE3o (Troca R\xE1pida)",
          solicitanteTelefone: "",
          missaOrigemData: slotA.date,
          missaOrigemHorario: slotA.time,
          missaOrigemMissa: sA.nome || "Missa",
          tipo: "direta",
          destinatarioId: 0,
          destinatarioNome: "Coordena\xE7\xE3o",
          destinatarioTelefone: "",
          missaDestinoData: "",
          missaDestinoHorario: "",
          missaDestinoMissa: `Substitui\xE7\xE3o: ${nameToRemove} por ${nameToInsert} (N\xE3o escalado)`,
          status: "aprovado",
          dataSolicitacao: (/* @__PURE__ */ new Date()).toISOString(),
          confirmadoSolicitante: true,
          confirmadoDestinatario: true
        });
        await database_default.write();
        return res.json({ success: true, slotA: sA });
      }
      const sB = parEscala[slotB.date]?.[slotB.time];
      if (!sB) {
        return res.status(404).json({ error: "Hor\xE1rio B n\xE3o encontrado na escala." });
      }
      if (sA.ministros && Array.isArray(sA.ministros)) {
        const idxA = sA.ministros.findIndex((m) => normalize(m) === normalize(slotA.ministerName));
        if (idxA !== -1) {
          const newEntriesA = getReplacementStrings(sA.ministros[idxA], slotA, slotB);
          sA.ministros.splice(idxA, 1, ...newEntriesA);
        }
      }
      if (sB.ministros && Array.isArray(sB.ministros)) {
        const idxB = sB.ministros.findIndex((m) => normalize(m) === normalize(slotB.ministerName));
        if (idxB !== -1) {
          const newEntriesB = getReplacementStrings(sB.ministros[idxB], slotB, slotA);
          sB.ministros.splice(idxB, 1, ...newEntriesB);
        }
      }
      syncSlotLeaderOnSwap(sA, slotA.ministerName, slotB.ministerName, database_default.data.ministros, paroquia);
      syncSlotLeaderOnSwap(sB, slotB.ministerName, slotA.ministerName, database_default.data.ministros, paroquia);
      if (database_default.data.relatoriosLider && Array.isArray(database_default.data.relatoriosLider)) {
        const repA = database_default.data.relatoriosLider.find(
          (r) => normalize(r.paroquia) === normalize(paroquia) && r.data === slotA.date && r.horario === slotA.time
        );
        if (repA && sA.lider) repA.liderNome = sA.lider;
        const repB = database_default.data.relatoriosLider.find(
          (r) => normalize(r.paroquia) === normalize(paroquia) && r.data === slotB.date && r.horario === slotB.time
        );
        if (repB && sB.lider) repB.liderNome = sB.lider;
      }
      if (!database_default.data.trocas) database_default.data.trocas = [];
      const newTrocaId = Date.now().toString();
      database_default.data.trocas.push({
        id: newTrocaId,
        paroquia,
        solicitanteId: 0,
        solicitanteNome: "Coordena\xE7\xE3o (Troca R\xE1pida)",
        solicitanteTelefone: "",
        missaOrigemData: slotA.date,
        missaOrigemHorario: slotA.time,
        missaOrigemMissa: sA.nome || "Missa",
        tipo: "direta",
        destinatarioId: 0,
        destinatarioNome: "Coordena\xE7\xE3o",
        destinatarioTelefone: "",
        missaDestinoData: slotB.date,
        missaDestinoHorario: slotB.time,
        missaDestinoMissa: sB.nome || "Missa",
        status: "aprovado",
        dataSolicitacao: (/* @__PURE__ */ new Date()).toISOString(),
        confirmadoSolicitante: true,
        confirmadoDestinatario: true
      });
      await database_default.write();
      res.json({ success: true, slotA: sA, slotB: sB });
    } catch (error) {
      console.error("Erro em troca r\xE1pida:", error);
      res.status(500).json({ error: "Erro interno ao processar troca r\xE1pida." });
    }
  });
  app2.post("/api/trocas/:id/confirmar-leitura", async (req, res) => {
    const { id } = req.params;
    const { ministroId } = req.body;
    if (!ministroId) return res.status(400).json({ error: "Ministro ID \xE9 requerido." });
    try {
      await database_default.read();
      const trocas = database_default.data.trocas || [];
      const troca = trocas.find((t) => t.id === id);
      if (!troca) return res.status(404).json({ error: "Troca n\xE3o encontrada." });
      const mId = Number(ministroId);
      if (troca.solicitanteId === mId) {
        troca.confirmadoSolicitante = true;
      }
      if (troca.destinatarioId === mId) {
        troca.confirmadoDestinatario = true;
      }
      await database_default.write();
      res.json(troca);
    } catch (error) {
      console.error("Erro ao confirmar leitura:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.get("/api/debug-db", async (req, res) => {
    try {
      await database_default.read();
      let logContent = "";
      try {
        logContent = __require("fs").readFileSync("src/msg.log", "utf8");
      } catch (e) {
        logContent = "Log file not found or empty";
      }
      res.json({ mensagens: database_default.data.mensagens, logs: logContent });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/mensagens", async (req, res) => {
    const { paroquia, type } = req.query;
    try {
      await database_default.read();
      if (!database_default.data.mensagens) return res.json([]);
      const agora = /* @__PURE__ */ new Date();
      const parseMsgDate = (dateStr) => {
        if (!dateStr) return /* @__PURE__ */ new Date(0);
        const match = String(dateStr).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
        if (match) {
          const day = parseInt(match[1], 10);
          const month = parseInt(match[2], 10) - 1;
          const year = parseInt(match[3], 10);
          const hours = match[4] ? parseInt(match[4], 10) : 0;
          const minutes = match[5] ? parseInt(match[5], 10) : 0;
          const seconds = match[6] ? parseInt(match[6], 10) : 0;
          return new Date(year, month, day, hours, minutes, seconds);
        }
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d;
        return /* @__PURE__ */ new Date(0);
      };
      const isOlderThan3Days = (dateStr) => {
        const msgDate = parseMsgDate(dateStr);
        if (isNaN(msgDate.getTime()) || msgDate.getTime() === 0) return true;
        const diffTime = agora.getTime() - msgDate.getTime();
        const diffDays = diffTime / (1e3 * 60 * 60 * 24);
        return diffDays > 3;
      };
      const cleanQueryTel = req.query.telefone ? String(req.query.telefone).replace(/\D/g, "") : "";
      let ministerPhoneNumbers = [];
      if (cleanQueryTel) {
        ministerPhoneNumbers.push(cleanQueryTel);
        if (database_default.data.ministros) {
          const matchingMinister = database_default.data.ministros.find((m) => {
            const mTel1 = m.telefone ? String(m.telefone).replace(/\D/g, "") : "";
            const mTel2 = m.telefoneConjuge ? String(m.telefoneConjuge).replace(/\D/g, "") : "";
            return mTel1 === cleanQueryTel || mTel2 === cleanQueryTel;
          });
          if (matchingMinister) {
            const mTel1 = matchingMinister.telefone ? String(matchingMinister.telefone).replace(/\D/g, "") : "";
            const mTel2 = matchingMinister.telefoneConjuge ? String(matchingMinister.telefoneConjuge).replace(/\D/g, "") : "";
            if (mTel1 && !ministerPhoneNumbers.includes(mTel1)) ministerPhoneNumbers.push(mTel1);
            if (mTel2 && !ministerPhoneNumbers.includes(mTel2)) ministerPhoneNumbers.push(mTel2);
          }
        }
      }
      const isCoordOrAdmin = database_default.data.ministros?.some((m) => {
        const mTel1 = m.telefone ? String(m.telefone).replace(/\D/g, "") : "";
        const mTel2 = m.telefoneConjuge ? String(m.telefoneConjuge).replace(/\D/g, "") : "";
        const matches = mTel1 && mTel1 === cleanQueryTel || mTel2 && mTel2 === cleanQueryTel;
        return matches && (m.role === "coordenacao" || m.role === "admin" || m.role === "vice_coordenacao");
      }) || (cleanQueryTel === "000000000" || cleanQueryTel === "00000000000");
      const activeMessages = database_default.data.mensagens.filter((msg) => {
        if (isOlderThan3Days(msg.data)) return false;
        if (paroquia && msg.paroquia !== paroquia) return false;
        const cleanMsgTel = msg.destinatario_telefone ? String(msg.destinatario_telefone).replace(/\D/g, "") : "";
        const isReminder = msg.texto && (msg.texto.includes("Lembrete de Escala") || msg.texto.includes("Lembrete de L\xEDder") || msg.texto.includes("Lembrete Di\xE1rio") || msg.texto.includes("Lembrete Pr\xF3ximo") || msg.texto.includes("voc\xEA est\xE1 escalado") || msg.texto.includes("Voc\xEA \xE9 o L\xCDDER"));
        if (isReminder || msg.type === "private") {
          if (!cleanMsgTel || !cleanQueryTel || !ministerPhoneNumbers.includes(cleanMsgTel)) {
            return false;
          }
        }
        if (type) {
          const requestedType = String(type);
          const msgType = msg.type || "broadcast";
          if (requestedType === "broadcast") {
            if (msgType === "broadcast") {
              if (isReminder) return false;
              return true;
            } else if (msgType === "private" || isReminder) {
              return cleanMsgTel && ministerPhoneNumbers.includes(cleanMsgTel);
            } else {
              return false;
            }
          } else if (requestedType === "private") {
            return cleanMsgTel && ministerPhoneNumbers.includes(cleanMsgTel);
          } else if (requestedType === "direct") {
            if (msgType !== "direct") return false;
            if (isCoordOrAdmin) {
              return true;
            }
            const senderTel = msg.telefone ? String(msg.telefone).replace(/\D/g, "") : "";
            return senderTel && ministerPhoneNumbers.includes(senderTel) || cleanMsgTel && ministerPhoneNumbers.includes(cleanMsgTel);
          } else {
            if (msgType !== requestedType) return false;
          }
        }
        return true;
      });
      const validMessages = database_default.data.mensagens.filter((msg) => !isOlderThan3Days(msg.data));
      if (validMessages.length !== database_default.data.mensagens.length) {
        database_default.data.mensagens = validMessages;
        await database_default.write();
      }
      res.json(activeMessages);
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.delete("/api/mensagens/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await database_default.read();
      if (!database_default.data.mensagens) return res.status(404).json({ error: "Nenhuma mensagem encontrada." });
      const initialLength = database_default.data.mensagens.length;
      database_default.data.mensagens = database_default.data.mensagens.filter((msg) => String(msg.id) !== id);
      if (database_default.data.mensagens.length === initialLength) {
        return res.status(404).json({ error: "Mensagem n\xE3o encontrada." });
      }
      await database_default.write();
      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao excluir mensagem:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.patch("/api/mensagens/:id/read", async (req, res) => {
    const { id } = req.params;
    try {
      await database_default.read();
      if (!database_default.data.mensagens) return res.status(404).json({ error: "Nenhuma mensagem encontrada." });
      const msg = database_default.data.mensagens.find((m) => String(m.id) === id);
      if (!msg) return res.status(404).json({ error: "Mensagem n\xE3o encontrada." });
      msg.lida = true;
      await database_default.write();
      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao marcar mensagem como lida:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.get("/api/eventos", async (req, res) => {
    const { paroquia } = req.query;
    try {
      await database_default.read();
      if (!database_default.data.eventos) database_default.data.eventos = [];
      let eventos = database_default.data.eventos;
      if (paroquia && paroquia !== "todas") {
        const normTarget = normalize(String(paroquia));
        eventos = eventos.filter((e) => !e.paroquia || e.paroquia === "todas" || normalize(e.paroquia) === normTarget);
      }
      res.json(eventos);
    } catch (e) {
      console.error("Erro ao buscar eventos:", e);
      res.status(500).json({ error: "Erro ao buscar eventos." });
    }
  });
  app2.post("/api/eventos", async (req, res) => {
    const { titulo, data, horario, tipo, descricao, paroquia, criadoPor, destinatario, alvoId, alvoNome, alvoIds, alvoNomes, criadoPorAdmin } = req.body;
    if (!titulo || !data) {
      return res.status(400).json({ error: "T\xEDtulo e data s\xE3o obrigat\xF3rios." });
    }
    try {
      await database_default.read();
      if (!database_default.data.eventos) database_default.data.eventos = [];
      const novoEvento = {
        id: "evt_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        titulo: String(titulo).trim(),
        data: String(data).trim(),
        horario: horario ? String(horario).trim() : void 0,
        tipo: tipo || "reuniao",
        descricao: descricao ? String(descricao).trim() : void 0,
        paroquia: paroquia ? String(paroquia).trim() : void 0,
        criadoPor: criadoPor ? String(criadoPor).trim() : void 0,
        criadoPorAdmin: criadoPorAdmin === true,
        destinatario: destinatario || "todos",
        alvoId: alvoId || "",
        alvoNome: alvoNome || "",
        alvoIds: Array.isArray(alvoIds) ? alvoIds : [],
        alvoNomes: Array.isArray(alvoNomes) ? alvoNomes : [],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      database_default.data.eventos.push(novoEvento);
      await database_default.write();
      res.json(novoEvento);
    } catch (e) {
      console.error("Erro ao salvar evento:", e);
      res.status(500).json({ error: "Erro ao salvar evento." });
    }
  });
  app2.delete("/api/eventos/:id", async (req, res) => {
    const { id } = req.params;
    const { isAdmin } = req.query;
    try {
      await database_default.read();
      if (!database_default.data.eventos) database_default.data.eventos = [];
      const index = database_default.data.eventos.findIndex((e) => String(e.id) === String(id));
      if (index === -1) {
        return res.status(404).json({ error: "Evento n\xE3o encontrado." });
      }
      const event = database_default.data.eventos[index];
      if (event.criadoPorAdmin && isAdmin !== "true") {
        return res.status(403).json({ error: "Apenas administradores do sistema podem excluir este agendamento." });
      }
      database_default.data.eventos.splice(index, 1);
      await database_default.write();
      res.json({ success: true });
    } catch (e) {
      console.error("Erro ao deletar evento:", e);
      res.status(500).json({ error: "Erro ao deletar evento." });
    }
  });
  const parseBirthday = (dateString) => {
    if (!dateString) return null;
    const cleanDate = dateString.trim();
    const yyyyMatch = cleanDate.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (yyyyMatch) {
      return { month: parseInt(yyyyMatch[2], 10), day: parseInt(yyyyMatch[3], 10) };
    }
    const ddmmyyyyMatch = cleanDate.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
    if (ddmmyyyyMatch) {
      return { month: parseInt(ddmmyyyyMatch[2], 10), day: parseInt(ddmmyyyyMatch[1], 10) };
    }
    const ddmmMatch = cleanDate.match(/^(\d{1,2})[-/](\d{1,2})$/);
    if (ddmmMatch) {
      const p1 = parseInt(ddmmMatch[1], 10);
      const p2 = parseInt(ddmmMatch[2], 10);
      if (p2 <= 12) return { month: p2, day: p1 };
      if (p1 <= 12) return { month: p1, day: p2 };
    }
    const monthMatch = cleanDate.match(/[-/.](\d{1,2})[-/.]/);
    if (monthMatch) {
      const m = parseInt(monthMatch[1], 10);
      if (m >= 1 && m <= 12) {
        const parts = cleanDate.split(/[-/.]/);
        const dayPart = parts.find((p) => parseInt(p, 10) !== m && parseInt(p, 10) <= 31);
        return { month: m, day: dayPart ? parseInt(dayPart, 10) : 1 };
      }
    }
    return null;
  };
  app2.get("/api/stats", async (req, res) => {
    let { paroquia } = req.query;
    if (paroquia === "undefined" || paroquia === "null") paroquia = void 0;
    try {
      await database_default.read();
      const agora = /* @__PURE__ */ new Date();
      const mesAtual = agora.getMonth() + 1;
      const mesFiltro = req.query.mes ? parseInt(req.query.mes) : void 0;
      const anoFiltro = req.query.ano ? parseInt(req.query.ano) : void 0;
      const uniqueMinistersMap = /* @__PURE__ */ new Map();
      (database_default.data.ministros || []).forEach((m) => {
        if (m.aprovado === false || m.role === "admin") return;
        if (paroquia && m.paroquia) {
          const mP = normalize(m.paroquia);
          const qP = normalize(paroquia);
          if (mP !== qP) return;
        }
        const cleanPhone = m.telefone ? m.telefone.replace(/\D/g, "") : "";
        const nameKey = m.nome.toLowerCase().trim();
        let found = false;
        if (cleanPhone) {
          if (uniqueMinistersMap.has("p_" + cleanPhone)) found = true;
        }
        if (!found && uniqueMinistersMap.has("n_" + nameKey)) found = true;
        if (!found) {
          if (cleanPhone) uniqueMinistersMap.set("p_" + cleanPhone, m);
          uniqueMinistersMap.set("n_" + nameKey, m);
        }
      });
      const ministrosFiltrados = Array.from(new Set(uniqueMinistersMap.values()));
      const totalMinistros = ministrosFiltrados.reduce((acc, m) => acc + (m.tipo === "casal" ? 2 : 1), 0);
      const idsMinistrosParoquia = new Set(ministrosFiltrados.map((m) => String(m.id)));
      let disponibilidadesParoquia = database_default.data.disponibilidades.filter((d) => idsMinistrosParoquia.has(String(d.ministro_id)));
      if (mesFiltro && anoFiltro) {
        disponibilidadesParoquia = disponibilidadesParoquia.filter((d) => {
          if (!d.data) return false;
          const [y, m] = d.data.split("-").map(Number);
          return m === mesFiltro && y === anoFiltro;
        });
      }
      const totalDisponibilidades = new Set(disponibilidadesParoquia.map((d) => String(d.ministro_id))).size;
      const mesParaFiltroAniversario = mesFiltro || mesAtual;
      const aniversariantesList = ministrosFiltrados.flatMap((m) => {
        const results = [];
        const b1 = parseBirthday(m.dataNascimento);
        if (b1 && b1.month === mesParaFiltroAniversario) {
          results.push({ nome: m.nome, dia: b1.day, tipo: "Ministro", telefone: m.telefone });
        }
        const b2 = parseBirthday(m.dataNascimentoConjuge);
        if (b2 && b2.month === mesParaFiltroAniversario) {
          results.push({ nome: m.nomeConjuge || "Ministro", dia: b2.day, tipo: "Ministro", telefone: m.telefoneConjuge || m.telefone });
        }
        return results;
      }).flat().sort((a, b) => a.dia - b.dia);
      const pendingApprovals = ministrosFiltrados.filter((m) => m.aprovado === false).length;
      let lowStockCount = 0;
      if (database_default.data.estoque) {
        let stockItems = database_default.data.estoque;
        if (paroquia) {
          const qP = normalize(paroquia);
          stockItems = stockItems.filter((i) => normalize(i?.paroquia) === qP);
        }
        lowStockCount = stockItems.filter((item) => {
          if (!item) return false;
          const tipo = item.nivelMinimoTipo || "embalagem";
          const threshold = item.nivelMinimo ?? (tipo === "unidade" ? 100 : 2);
          const current = tipo === "unidade" ? item.quantidade : item.quantidadeEmbalagens;
          return current <= threshold;
        }).length;
      }
      const mesCalc = mesFiltro || mesAtual;
      const anoCalc = anoFiltro || agora.getFullYear();
      const currentMonthStr = `${anoCalc}-${String(mesCalc).padStart(2, "0")}`;
      let totalFaltasMes = 0;
      if (database_default.data.faltas) {
        const qP = paroquia ? normalize(paroquia) : void 0;
        totalFaltasMes = database_default.data.faltas.filter((f) => {
          if (!f || !f.data) return false;
          if (qP && f.paroquia && normalize(f.paroquia) !== qP) return false;
          return f.data.startsWith(currentMonthStr);
        }).length;
      }
      let totalEscaladosMes = 0;
      if (database_default.data.escalaGerada) {
        const targetP = paroquia ? String(paroquia).trim() : "Par\xF3quia Santa Rita de C\xE1ssia";
        const parEscala = database_default.data.escalaGerada[targetP] || database_default.data.escalaGerada[normalize(targetP)] || {};
        Object.keys(parEscala).forEach((date) => {
          if (date.startsWith(currentMonthStr)) {
            const slots = parEscala[date] || {};
            if (typeof slots === "object") {
              Object.keys(slots).forEach((h) => {
                const missa = slots[h];
                if (missa && Array.isArray(missa.ministros)) {
                  totalEscaladosMes += missa.ministros.length;
                }
              });
            }
          }
        });
      }
      let pontualidade = 100;
      if (totalFaltasMes > 0) {
        if (totalEscaladosMes > 0) {
          pontualidade = Math.max(0, Math.min(100, Math.round((totalEscaladosMes - totalFaltasMes) / totalEscaladosMes * 100)));
        } else {
          pontualidade = Math.max(0, 100 - totalFaltasMes * 5);
        }
      }
      res.json({
        totalMinistros,
        totalDisponibilidades,
        totalAniversariantes: aniversariantesList.length,
        pendingApprovals,
        aniversariantesList,
        lowStockCount,
        totalFaltasMes,
        totalEscaladosMes,
        pontualidade
      });
    } catch (error) {
      console.error("Erro ao buscar estat\xEDsticas:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });
  app2.get("/api/ministro/pontualidade", async (req, res) => {
    const { telefone, paroquia, nome, id } = req.query;
    try {
      await database_default.read();
      const agora = /* @__PURE__ */ new Date();
      const currentMonthStr = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
      const targetParoquia = paroquia ? String(paroquia).trim() : "Par\xF3quia Santa Rita de C\xE1ssia";
      const normPar = normalize(targetParoquia);
      const cleanPhone = telefone ? String(telefone).replace(/\D/g, "") : "";
      const targetId = id ? String(id).trim() : "";
      const targetName = nome ? normalize(String(nome)) : "";
      let targetMinister = (database_default.data.ministros || []).find((m) => {
        if (targetId && String(m.id) === targetId) return true;
        if (cleanPhone && m.telefone && String(m.telefone).replace(/\D/g, "") === cleanPhone) return true;
        const n1 = normalize(m.nome || "");
        const n2 = normalize(m.nomeExibicao || "");
        const n3 = normalize(m.nomeConjuge || "");
        const n4 = normalize(m.nomeExibicaoConjuge || "");
        if (targetName && (n1 === targetName || n2 === targetName || n3 === targetName || n4 === targetName)) return true;
        return false;
      });
      const isLoggedAsConjuge = targetMinister && targetMinister.tipo === "casal" && targetName && (targetName === normalize(targetMinister.nomeConjuge || "") || targetName === normalize(targetMinister.nomeExibicaoConjuge || ""));
      let totalEscalado = 0;
      if (database_default.data.escalaGerada) {
        const parEscala = database_default.data.escalaGerada[targetParoquia] || database_default.data.escalaGerada[normPar] || {};
        Object.keys(parEscala).forEach((date) => {
          if (date.startsWith(currentMonthStr)) {
            const slots = parEscala[date] || {};
            if (typeof slots === "object") {
              Object.keys(slots).forEach((h) => {
                const missa = slots[h];
                if (missa && Array.isArray(missa.ministros)) {
                  const isScheduled = missa.ministros.some((mName) => {
                    const normM = normalize(mName);
                    if (targetName && normM.includes(targetName)) return true;
                    if (targetMinister) {
                      const p1 = normalize(targetMinister.nomeExibicao || targetMinister.nome || "");
                      const p2 = normalize(targetMinister.nomeExibicaoConjuge || targetMinister.nomeConjuge || "");
                      if (p1 && normM.includes(p1)) return true;
                      if (p2 && normM.includes(p2)) return true;
                    }
                    return false;
                  });
                  if (isScheduled) totalEscalado++;
                }
              });
            }
          }
        });
      }
      let totalFaltas = 0;
      if (database_default.data.faltas) {
        database_default.data.faltas.forEach((f) => {
          if (!f || !f.data) return;
          if (!f.data.startsWith(currentMonthStr)) return;
          if (f.paroquia && normalize(f.paroquia) !== normPar) return;
          const fId = f.ministroId ? String(f.ministroId).trim() : "";
          const fNormName = normalize(f.ministroNome || "");
          const matchesId = Boolean(targetId && fId === targetId);
          const matchesPhone = Boolean(cleanPhone && f.telefone && String(f.telefone).replace(/\D/g, "") === cleanPhone);
          const matchesName = Boolean(targetName && fNormName.includes(targetName));
          if (matchesId || matchesPhone || matchesName) {
            if (targetMinister && targetMinister.tipo === "casal") {
              if (f.tipoFalta === "conjuge") {
                if (isLoggedAsConjuge) totalFaltas++;
              } else if (f.tipoFalta === "principal") {
                if (!isLoggedAsConjuge) totalFaltas++;
              } else {
                totalFaltas++;
              }
            } else {
              totalFaltas++;
            }
          }
        });
      }
      let pontualidade = 100;
      if (totalEscalado > 0) {
        pontualidade = Math.max(0, Math.min(100, Math.round((totalEscalado - totalFaltas) / totalEscalado * 100)));
      } else if (totalFaltas > 0) {
        pontualidade = Math.max(0, 100 - totalFaltas * 10);
      }
      res.json({
        success: true,
        pontualidade,
        totalEscalado,
        totalFaltas
      });
    } catch (error) {
      console.error("Erro ao calcular pontualidade do ministro:", error);
      res.status(500).json({ error: "Erro ao calcular pontualidade." });
    }
  });
  const liturgiaCache = /* @__PURE__ */ new Map();
  const LITURGIA_CACHE_TTL = 1e3 * 60 * 60 * 2;
  const cancaoNovaCache = /* @__PURE__ */ new Map();
  app2.get("/api/liturgia-diaria", async (req, res) => {
    try {
      const force = req.query.force === "true";
      const isVigilia = req.query.vigilia === "true";
      const dateKey = (/* @__PURE__ */ new Date()).toISOString().split("T")[0] + (isVigilia ? "-vigilia" : "");
      const nowTime = Date.now();
      const cached = cancaoNovaCache.get(dateKey);
      if (!force && cached && nowTime - cached.timestamp < LITURGIA_CACHE_TTL) {
        return res.json(cached.data);
      }
      const fetch2 = (await import("node-fetch")).default;
      const cheerio2 = await import("cheerio");
      let url = "https://liturgia.cancaonova.com/pb/";
      if (isVigilia) {
        url += "?vigilia=true";
      }
      const response = await fetch2(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      const html = await response.text();
      const $ = cheerio2.load(html);
      const hasVigilia = $(".vigilia-toggle").length > 0 || html.includes("vigilia=true");
      const abas = $(".nav-tabs li a").map((i, el) => {
        return {
          id: $(el).attr("href")?.replace("#", "") || `tab-${i}`,
          titulo: $(el).find("label").text().trim(),
          referencia: $(el).find(".referencia").text().trim()
        };
      }).get();
      const conteudos = $(".tab-content .tab-pane").map((i, el) => {
        const clone = $(el).clone();
        clone.find("iframe, script, style, .sintese, .embeds-audio, .audio-player").remove();
        const paragraphs = clone.find("p").map((j, p) => $(p).text().trim()).get().filter((p) => p.length > 0);
        return {
          id: clone.attr("id") || `tab-${i}`,
          paragrafos: paragraphs.length > 0 ? paragraphs : [clone.text().trim().replace(/\s+/g, " ")]
        };
      }).get();
      const result = abas.map((aba) => {
        const conteudo = conteudos.find((c) => c.id === aba.id);
        return {
          ...aba,
          paragrafos: conteudo ? conteudo.paragrafos : []
        };
      });
      const finalResponse = {
        liturgia: result,
        hasVigilia,
        isVigilia,
        data: (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR")
      };
      cancaoNovaCache.set(dateKey, { data: finalResponse, timestamp: nowTime });
      res.json(finalResponse);
    } catch (error) {
      console.error("[LITURGIA-DIARIA] Erro:", error);
      res.status(500).json({ error: "Falha ao buscar liturgia." });
    }
  });
  app2.get("/api/liturgia", async (req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    try {
      const { date } = req.query;
      const cacheKey = date && typeof date === "string" ? `date_${date}` : "today";
      const cached = liturgiaCache.get(cacheKey);
      const nowTime = Date.now();
      if (cached && nowTime - cached.timestamp < LITURGIA_CACHE_TTL) {
        console.log(`[LITURGIA] Retornando dados em cache para a chave: ${cacheKey}`);
        return res.json(cached.data);
      }
      let now = /* @__PURE__ */ new Date();
      let brTime = new Date(now.getTime() - 3 * 60 * 60 * 1e3);
      let targetDate = brTime;
      if (date && typeof date === "string") {
        const [day2, month2] = date.split("-").map(Number);
        if (!isNaN(day2) && !isNaN(month2)) {
          targetDate = /* @__PURE__ */ new Date();
          targetDate.setDate(day2);
          targetDate.setMonth(month2 - 1);
        }
      } else {
        if (targetDate.getDay() === 6 && targetDate.getHours() >= 17) {
          targetDate = new Date(targetDate.getTime() + 24 * 60 * 60 * 1e3);
        }
      }
      const day = targetDate.getDate().toString().padStart(2, "0");
      const month = (targetDate.getMonth() + 1).toString().padStart(2, "0");
      const year = targetDate.getFullYear();
      const vaticanDateUrl = `https://www.vaticannews.va/pt/palavra-do-dia/${year}/${month}/${day}.html`;
      const vaticanUrl = "https://www.vaticannews.va/pt/palavra-do-dia.html";
      let referencia = "Refer\xEAncia n\xE3o encontrada";
      let texto = "Texto n\xE3o encontrado";
      let papasText = "";
      let successVatican = false;
      const liturgiaTabs = [];
      try {
        const vaticanResponse = await fetch(vaticanDateUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          }
        });
        if (vaticanResponse.ok) {
          const vHtml = await vaticanResponse.text();
          const $ = cheerio.load(vHtml);
          const sections = $("section");
          sections.each((i, el) => {
            const heading = $(el).find("h1, h2, h3, h4").text().trim();
            const headingLower = heading.toLowerCase();
            if (headingLower.includes("leitura do dia")) {
              let currentTab = null;
              $(el).find(".section__content p").each((j, p) => {
                const text = $(p).text().trim();
                if (!text) return;
                const textLower = text.toLowerCase();
                if (textLower === "primeira leitura" || textLower === "1\xAA leitura" || textLower.includes("1\xAA leitura")) {
                  if (currentTab) liturgiaTabs.push(currentTab);
                  currentTab = { id: "tab-1leitura", titulo: "1\xAA Leitura", referencia: "", paragrafos: [] };
                } else if (textLower === "segunda leitura" || textLower === "2\xAA leitura" || textLower.includes("2\xAA leitura")) {
                  if (currentTab) liturgiaTabs.push(currentTab);
                  currentTab = { id: "tab-2leitura", titulo: "2\xAA Leitura", referencia: "", paragrafos: [] };
                } else if (textLower === "salmo" || textLower.includes("salmo responsorial") || textLower.startsWith("salmo")) {
                  if (currentTab) liturgiaTabs.push(currentTab);
                  currentTab = { id: "tab-salmo", titulo: "Salmo Responsorial", referencia: "", paragrafos: [] };
                } else {
                  if (!currentTab) {
                    currentTab = { id: "tab-1leitura", titulo: "1\xAA Leitura", referencia: "", paragrafos: [] };
                  }
                  if (!currentTab.referencia && currentTab.paragrafos.length < 2 && (text.length < 60 || textLower.includes("leitura") || /^\d+/.test(text))) {
                    if (currentTab.referencia) {
                      currentTab.referencia += " " + text;
                    } else {
                      currentTab.referencia = text;
                    }
                  }
                  currentTab.paragrafos.push(text);
                }
              });
              if (currentTab) liturgiaTabs.push(currentTab);
            } else if (headingLower.includes("evangelho")) {
              const pText = [];
              $(el).find(".section__content p").each((j, p) => {
                const t = $(p).text().trim();
                if (t) pText.push(t);
              });
              if (pText.length >= 2 && pText[1].length < 30) {
                referencia = pText[0] + " " + pText[1];
              } else if (pText.length > 0) {
                referencia = $(el).find("h1, h2, h3, h4").text().trim() + " " + pText[0];
              } else {
                referencia = $(el).find("h1, h2, h3, h4").text().trim();
              }
              texto = pText.join("\n\n");
              successVatican = pText.length > 0;
              liturgiaTabs.push({
                id: "tab-evangelho",
                titulo: "Evangelho",
                referencia,
                paragrafos: pText
              });
            } else if (headingLower.includes("palavras dos papas") || headingLower.includes("papa")) {
              let pTextPapas = [];
              $(el).find(".section__content p").each((i2, p) => {
                const t = $(p).text().trim();
                if (t) pTextPapas.push(t);
              });
              papasText = pTextPapas.join("\n\n");
              liturgiaTabs.push({
                id: "tab-papa",
                titulo: "O Pensamento do Papa",
                referencia: "Vatican News",
                paragrafos: pTextPapas
              });
            }
          });
        }
      } catch (err) {
        console.error("Failed to parse Vatican news:", err);
      }
      if (!successVatican) {
        console.log("Utilizando API fallback...");
        const url = `https://liturgia.up.railway.app/${day}-${month}-${year}`;
        let response;
        let retries = 3;
        while (retries > 0) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1e4);
            response = await fetch(url, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
              },
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (response.ok) break;
            throw new Error(`Failed to fetch liturgy: ${response.status}`);
          } catch (err) {
            retries--;
            console.error(`Liturgy fetch attempt ${3 - retries}/3 failed for ${url}:`, err instanceof Error ? err.message : err);
            if (retries > 0) {
              await new Promise((resolve) => setTimeout(resolve, 2e3));
            }
          }
        }
        if (response && response.ok) {
          const text = await response.text();
          try {
            const data = JSON.parse(text);
            if (data && data.evangelho) {
              referencia = data.evangelho.referencia || data.evangelho.titulo || referencia;
              const titulo = data.evangelho.titulo ? data.evangelho.titulo + "\n\n" : "";
              const textoEvangelho = data.evangelho.texto || "";
              texto = titulo + textoEvangelho;
              if (data.primeiraLeitura) {
                liturgiaTabs.push({
                  id: "tab-1leitura",
                  titulo: "1\xAA Leitura",
                  referencia: data.primeiraLeitura.referencia || "",
                  paragrafos: [data.primeiraLeitura.texto || ""]
                });
              }
              if (data.salmo) {
                liturgiaTabs.push({
                  id: "tab-salmo",
                  titulo: "Salmo Responsorial",
                  referencia: data.salmo.referencia || "",
                  paragrafos: [data.salmo.texto || ""]
                });
              }
              if (data.segundaLeitura) {
                liturgiaTabs.push({
                  id: "tab-2leitura",
                  titulo: "2\xAA Leitura",
                  referencia: data.segundaLeitura.referencia || "",
                  paragrafos: [data.segundaLeitura.texto || ""]
                });
              }
              liturgiaTabs.push({
                id: "tab-evangelho",
                titulo: "Evangelho",
                referencia,
                paragrafos: textoEvangelho ? textoEvangelho.split("\n\n") : [texto]
              });
            }
          } catch {
            console.error("Response from liturgy API was not valid JSON:", text);
            referencia = "Indispon\xEDvel";
            texto = "API de liturgia retornou um formato inv\xE1lido.";
          }
        } else {
          referencia = "N\xE3o dispon\xEDvel";
          texto = "N\xE3o foi poss\xEDvel carregar a liturgia hoje.";
        }
      }
      const successResult = {
        evangelho: {
          referencia,
          texto,
          papasText,
          vaticanUrl: successVatican ? vaticanDateUrl : "https://www.vaticannews.va/pt/palavra-do-dia.html"
        },
        liturgia: liturgiaTabs,
        hasVigilia: false,
        isVigilia: targetDate.getDay() === 0 && (/* @__PURE__ */ new Date()).getDay() === 6,
        data: `${day}/${month}/${year}`
      };
      liturgiaCache.set(cacheKey, { data: successResult, timestamp: nowTime });
      res.json(successResult);
    } catch (error) {
      console.error("Erro ao buscar liturgia:", error);
      res.json({
        evangelho: {
          referencia: "Liturgia indispon\xEDvel no momento",
          texto: "N\xE3o foi poss\xEDvel carregar a liturgia di\xE1ria. Por favor, tente novamente mais tarde.",
          vaticanUrl: "https://www.vaticannews.va/pt/palavra-do-dia.html",
          papasText: ""
        }
      });
    }
  });
  app2.post("/api/admin/conceder-excecao", async (req, res) => {
    const { telefone, horas } = req.body;
    if (!telefone || !horas) return res.status(400).json({ error: "Telefone e horas s\xE3o obrigat\xF3rios." });
    try {
      await database_default.read();
      const cleanPhone = (p) => p ? p.replace(/\D/g, "") : "";
      const searchPhone = cleanPhone(telefone);
      const ministro = database_default.data.ministros.find(
        (m) => m.telefone && cleanPhone(m.telefone) === searchPhone || m.telefoneConjuge && cleanPhone(m.telefoneConjuge) === searchPhone
      );
      if (!ministro) return res.status(404).json({ error: "Ministro n\xE3o encontrado." });
      const horasNum = parseFloat(horas);
      if (isNaN(horasNum)) return res.status(400).json({ error: "Quantidade de horas inv\xE1lida." });
      const expiraEm = new Date(Date.now() + horasNum * 60 * 60 * 1e3);
      ministro.excecaoAcessoAte = expiraEm.toISOString();
      ministro.disponibilidadeConfirmada = false;
      await database_default.write();
      res.json({
        message: `Acesso concedido at\xE9 ${expiraEm.toLocaleString("pt-BR")}`,
        ministro
      });
    } catch (error) {
      res.status(500).json({ error: "Erro ao conceder exce\xE7\xE3o." });
    }
  });
  app2.get("/api/admin/pending", async (req, res) => {
    let { paroquia } = req.query;
    if (paroquia === "undefined" || paroquia === "null") paroquia = void 0;
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      await database_default.read();
      let pending = database_default.data.ministros.filter((m) => m.aprovado === false);
      if (paroquia) {
        const qP = normalize(paroquia);
        pending = pending.filter((m) => {
          if (!m.paroquia) return false;
          const mP = normalize(m.paroquia);
          return mP === qP;
        });
      }
      pending.sort((a, b) => a.nome.localeCompare(b.nome));
      res.json(pending);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar usu\xE1rios pendentes." });
    }
  });
  app2.post("/api/admin/approve/:id", async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    try {
      await database_default.read();
      const ministro = database_default.data.ministros.find((m) => m.id === parseInt(id));
      if (!ministro) return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado." });
      ministro.aprovado = true;
      ministro.cadastroCompleto = false;
      if (role) {
        ministro.role = role;
      }
      if (role === "coordenacao" && ministro.paroquia) {
        const paroquia = database_default.data.paroquias.find((p) => p.nome === ministro.paroquia);
        if (paroquia) {
          paroquia.coordenador = ministro.nome;
          paroquia.telefoneCoordenador = ministro.telefone;
        }
      }
      await database_default.write();
      res.json({ message: "Usu\xE1rio aprovado com sucesso!" });
    } catch (error) {
      res.status(500).json({ error: "Erro ao aprovar usu\xE1rio." });
    }
  });
  app2.post("/api/admin/reject/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await database_default.read();
      const index = database_default.data.ministros.findIndex((m) => m.id === parseInt(id));
      if (index === -1) return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado." });
      database_default.data.ministros.splice(index, 1);
      await database_default.write();
      res.json({ message: "Usu\xE1rio rejeitado e removido." });
    } catch (error) {
      res.status(500).json({ error: "Erro ao rejeitar usu\xE1rio." });
    }
  });
  app2.get("/api/admin/coordinators", async (req, res) => {
    const { paroquia } = req.query;
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      await database_default.read();
      let coordinators = database_default.data.ministros.filter((m) => ["coordenacao", "vice_coordenacao"].includes(m.role) && m.aprovado === true);
      if (paroquia) {
        const qP = normalize(paroquia);
        coordinators = coordinators.filter((m) => m.paroquia && normalize(m.paroquia) === qP);
      }
      coordinators.sort((a, b) => a.nome.localeCompare(b.nome));
      res.json(coordinators);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar coordenadores." });
    }
  });
  app2.delete("/api/admin/coordinators/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await database_default.read();
      const index = database_default.data.ministros.findIndex((m) => m.id === parseInt(id));
      if (index === -1) return res.status(404).json({ error: "Coordenador n\xE3o encontrado." });
      database_default.data.ministros.splice(index, 1);
      await database_default.write();
      res.json({ message: "Coordenador exclu\xEDdo com sucesso!" });
    } catch (error) {
      res.status(500).json({ error: "Erro ao excluir coordenador." });
    }
  });
  app2.put("/api/admin/coordinators/:id", async (req, res) => {
    const { id } = req.params;
    const {
      nome,
      nomeExibicao,
      telefone,
      senha,
      tipo,
      nomeConjuge,
      nomeExibicaoConjuge,
      telefoneConjuge,
      senhaConjuge,
      paroquia
    } = req.body;
    try {
      await database_default.read();
      const coord = database_default.data.ministros.find((m) => m.id === parseInt(id));
      if (!coord) {
        return res.status(404).json({ error: "Coordenador n\xE3o encontrado." });
      }
      const cleanName = (s) => s ? s.trim().replace(/\s+&\s+/g, " e ") : s;
      if (nome !== void 0) {
        coord.nome = cleanName(nome);
        if (nomeExibicao === void 0) {
          coord.nomeExibicao = cleanName(nome);
        }
      }
      if (nomeExibicao !== void 0) coord.nomeExibicao = cleanName(nomeExibicao);
      if (telefone !== void 0) coord.telefone = telefone;
      if (senha !== void 0) {
        if (!isComplexPassword(senha)) {
          return res.status(400).json({ error: "A senha do Coordenador deve ter pelo menos 6 caracteres, contendo letras mai\xFAsculas, min\xFAsculas e caracteres especiais." });
        }
        coord.senha = senha;
      }
      if (tipo !== void 0) coord.tipo = tipo;
      if (tipo === "casal") {
        if (nomeConjuge !== void 0) coord.nomeConjuge = cleanName(nomeConjuge);
        if (nomeExibicaoConjuge !== void 0) coord.nomeExibicaoConjuge = cleanName(nomeExibicaoConjuge);
        if (telefoneConjuge !== void 0) coord.telefoneConjuge = telefoneConjuge;
        if (senhaConjuge !== void 0) {
          if (!isComplexPassword(senhaConjuge)) {
            return res.status(400).json({ error: "A senha do c\xF4njuge do Coordenador deve ter pelo menos 6 caracteres, contendo letras mai\xFAsculas, min\xFAsculas e caracteres especiais." });
          }
          coord.senhaConjuge = senhaConjuge;
        }
      } else {
        coord.nomeConjuge = "";
        coord.nomeExibicaoConjuge = "";
        coord.telefoneConjuge = "";
        coord.senhaConjuge = "";
      }
      if (paroquia !== void 0) coord.paroquia = paroquia;
      await database_default.write();
      res.json({ message: "Coordenador atualizado com sucesso!", coordinator: coord });
    } catch (error) {
      console.error("Erro ao atualizar coordenador:", error);
      res.status(500).json({ error: "Erro ao atualizar coordenador." });
    }
  });
  app2.get("/api/admin/ministros", async (req, res) => {
    let { paroquia } = req.query;
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      await database_default.read();
      let ministros = (database_default.data.ministros || []).filter((m) => m.aprovado === true && m.role !== "admin");
      if (paroquia && paroquia !== "undefined" && paroquia !== "null") {
        const qP = normalize(paroquia);
        ministros = ministros.filter((m) => m.paroquia && normalize(m.paroquia) === qP);
      }
      ministros.sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR", { sensitivity: "base" }));
      res.json(ministros);
    } catch (error) {
      console.error("Erro ao buscar ministros (admin):", error);
      res.status(500).json({ error: "Erro ao buscar ministros." });
    }
  });
  app2.get("/api/admin/all-users", async (req, res) => {
    try {
      await database_default.read();
      const allUsers = [...database_default.data.ministros];
      allUsers.sort((a, b) => a.nome.localeCompare(b.nome));
      res.json(allUsers);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar todos os usu\xE1rios." });
    }
  });
  app2.get("/api/admin/backup", async (req, res) => {
    try {
      const adapter2 = database_default.adapter;
      const latestData = await adapter2.read(true);
      if (latestData) {
        database_default.data = latestData;
      }
      const backupData = JSON.stringify(database_default.data, null, 2);
      const fileName = `backup_sistema_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.send(backupData);
    } catch (error) {
      console.error("Erro ao gerar backup:", error);
      res.status(500).json({ error: "Erro ao gerar arquivo de backup." });
    }
  });
  app2.post("/api/admin/restore", async (req, res) => {
    try {
      const backupData = req.body;
      if (!backupData || typeof backupData !== "object") {
        return res.status(400).json({ error: "Dados de backup inv\xE1lidos." });
      }
      if (!backupData.ministros && !backupData.disponibilidades) {
        return res.status(400).json({ error: "O arquivo de backup n\xE3o parece ser v\xE1lido (faltam cole\xE7\xF5es principais)." });
      }
      console.log("Iniciando restaura\xE7\xE3o de backup...");
      logDebug("Iniciando restaura\xE7\xE3o de backup...");
      const defaultDataStructure = {
        ministros: [],
        paroquias: [],
        disponibilidades: [],
        mensagens: [],
        config: { coordinatorEnabled: false, escalaPublicada: false, adminPassword: "999", disponibilidadeAberta: false },
        missasTemporarias: [],
        escalaGerada: {},
        comunhao: [],
        estoque: [],
        estoqueMovimentacoes: [],
        faltas: []
      };
      database_default.data = { ...defaultDataStructure, ...backupData };
      await database_default.write();
      const adapter2 = database_default.adapter;
      if (adapter2.read) {
        await adapter2.read(true);
      }
      await runMigrations(true);
      const stats = {
        ministros: database_default.data.ministros?.length || 0,
        paroquias: database_default.data.paroquias?.length || 0,
        disponibilidades: database_default.data.disponibilidades?.length || 0,
        config: !!database_default.data.config,
        escalaGerada: Object.keys(database_default.data.escalaGerada || {}).length
      };
      console.log("Sistema restaurado com sucesso:", stats);
      logDebug(`Sistema restaurado com sucesso: ${JSON.stringify(stats)}`);
      res.json({
        message: "Sistema restaurado com sucesso!",
        stats
      });
    } catch (error) {
      console.error("Erro ao restaurar backup:", error);
      logDebug(`Erro ao restaurar backup: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ error: "Erro ao restaurar sistema: " + (error instanceof Error ? error.message : String(error)) });
    }
  });
  app2.get("/api/missas-temporarias", async (req, res) => {
    const { paroquia } = req.query;
    const paroquiaStr = paroquia ? String(paroquia).trim() : "";
    logDebug(`[DEBUG] GET /api/missas-temporarias recebido. Par\xF3quia: '${paroquiaStr}'`);
    try {
      await database_default.read();
      const todasMissas = database_default.data.missasTemporarias || [];
      logDebug(`[DEBUG] Total de missas no banco: ${todasMissas.length}`);
      const MISSAS_PADRAO = [
        { id: "padrao-sab-17", nome: "Missa de S\xE1bado", frequencia: "semanal", diaSemana: "6", horario: "17:00", quantidade: 6, tipo: "padrao" },
        { id: "padrao-dom-07", nome: "Missa de Domingo", frequencia: "semanal", diaSemana: "0", horario: "07:30", quantidade: 5, tipo: "padrao" },
        { id: "padrao-dom-10", nome: "Missa de Domingo", frequencia: "semanal", diaSemana: "0", horario: "10:00", quantidade: 8, tipo: "padrao" },
        { id: "padrao-dom-19", nome: "Missa de Domingo", frequencia: "semanal", diaSemana: "0", horario: "19:00", quantidade: 8, tipo: "padrao" }
      ];
      const missasDaParoquia = todasMissas.filter((m) => {
        const mPar = m.paroquia && m.paroquia !== "undefined" ? String(m.paroquia).trim() : "";
        if (paroquiaStr) {
          return mPar.toLowerCase() === paroquiaStr.toLowerCase();
        }
        return mPar === "";
      });
      const missasMescladas = [];
      MISSAS_PADRAO.forEach((mp) => {
        const override = missasDaParoquia.find(
          (m) => (m.tipo === "padrao" || m.tipo === "fixa" || !m.tipo && m.frequencia === "semanal") && m.horario === mp.horario && m.diaSemana === mp.diaSemana && !m.data
          // Não é uma sobrescrita de data única
        );
        if (override) {
          if (!override.deletada) {
            missasMescladas.push({ ...mp, ...override, paroquia: paroquiaStr || override.paroquia || "Padr\xE3o" });
          }
        } else {
          missasMescladas.push({ ...mp, paroquia: paroquiaStr || "Padr\xE3o" });
        }
      });
      missasDaParoquia.forEach((m) => {
        if (m.deletada) return;
        const isDefaultOverride = MISSAS_PADRAO.some(
          (mp) => m.horario === mp.horario && m.diaSemana === mp.diaSemana && (m.tipo === "padrao" || m.tipo === "fixa" || !m.tipo && m.frequencia === "semanal") && !m.data
        );
        if (!isDefaultOverride) {
          missasMescladas.push(m);
        }
      });
      logDebug(`[DEBUG] Missas retornadas ap\xF3s filtro e mesclagem: ${missasMescladas.length}`);
      res.json(missasMescladas);
    } catch (error) {
      logDebug(`[DEBUG] Erro ao buscar missas tempor\xE1rias: ${error}`);
      res.status(500).json({ error: "Erro ao buscar missas tempor\xE1rias." });
    }
  });
  app2.post("/api/missas-temporarias", async (req, res) => {
    try {
      await database_default.read();
      if (!database_default.data.missasTemporarias) {
        database_default.data.missasTemporarias = [];
      }
      const novaMissa = {
        id: Date.now().toString(),
        ...req.body
      };
      database_default.data.missasTemporarias.push(novaMissa);
      await database_default.write();
      res.json(novaMissa);
    } catch (error) {
      res.status(500).json({ error: "Erro ao criar missa tempor\xE1ria." });
    }
  });
  app2.delete("/api/missas-temporarias/fixas", async (req, res) => {
    const { paroquia } = req.query;
    if (!paroquia) return res.status(400).json({ error: "Par\xF3quia \xE9 obrigat\xF3ria." });
    try {
      await database_default.read();
      if (!database_default.data.missasTemporarias) return res.status(404).json({ error: "Nenhuma missa encontrada." });
      database_default.data.missasTemporarias = database_default.data.missasTemporarias.filter((m) => !(m.tipo === "fixa" && m.paroquia === paroquia));
      await database_default.write();
      res.json({ message: "Todas as missas fixas foram exclu\xEDdas com sucesso!" });
    } catch (error) {
      res.status(500).json({ error: "Erro ao excluir missas fixas." });
    }
  });
  app2.delete("/api/missas-temporarias", async (req, res) => {
    const { paroquia } = req.query;
    if (!paroquia) return res.status(400).json({ error: "Par\xF3quia \xE9 obrigat\xF3ria." });
    try {
      await database_default.read();
      if (!database_default.data.missasTemporarias) return res.status(404).json({ error: "Nenhuma missa encontrada." });
      database_default.data.missasTemporarias = database_default.data.missasTemporarias.filter((m) => m.paroquia !== paroquia);
      await database_default.write();
      res.json({ message: "Todas as missas tempor\xE1rias foram exclu\xEDdas com sucesso!" });
    } catch (error) {
      res.status(500).json({ error: "Erro ao excluir todas as missas." });
    }
  });
  app2.delete("/api/missas-temporarias/:id", async (req, res) => {
    const { id } = req.params;
    const { paroquia, nome, horario } = req.query;
    try {
      await database_default.read();
      if (!database_default.data.missasTemporarias) database_default.data.missasTemporarias = [];
      const index = database_default.data.missasTemporarias.findIndex((m) => m.id === id);
      if (index === -1) {
        if (nome && horario && paroquia) {
          const novaMissa = {
            id: Date.now().toString(),
            tipo: "padrao",
            nome: String(nome),
            horario: String(horario),
            paroquia: String(paroquia),
            deletada: true
          };
          database_default.data.missasTemporarias.push(novaMissa);
          await database_default.write();
          return res.json({ message: "Missa padr\xE3o exclu\xEDda com sucesso!" });
        }
        return res.status(404).json({ error: "Missa n\xE3o encontrada." });
      }
      database_default.data.missasTemporarias.splice(index, 1);
      await database_default.write();
      res.json({ message: "Missa exclu\xEDda com sucesso!" });
    } catch (error) {
      res.status(500).json({ error: "Erro ao excluir missa." });
    }
  });
  app2.put("/api/missas-temporarias/:id", async (req, res) => {
    const { id } = req.params;
    const body = req.body;
    let { quantidade } = body;
    if (typeof quantidade === "string") {
      quantidade = parseInt(quantidade);
    }
    logDebug(`[DEBUG] PUT /api/missas-temporarias/${id} recebido. Quantidade: ${quantidade}`);
    try {
      await database_default.read();
      if (!database_default.data.missasTemporarias) database_default.data.missasTemporarias = [];
      const index = database_default.data.missasTemporarias.findIndex((m) => String(m.id) === String(id));
      if (index === -1) {
        logDebug(`[DEBUG] Missa com ID ${id} n\xE3o encontrada. Verificando se \xE9 override necess\xE1rio.`);
        const { nome, horario, paroquia, diaSemana, frequencia } = body;
        if (nome && horario && paroquia) {
          const novaMissa = {
            id: Date.now().toString(),
            tipo: "padrao",
            nome,
            horario,
            diaSemana,
            frequencia,
            quantidade,
            paroquia
          };
          database_default.data.missasTemporarias.push(novaMissa);
          await database_default.write();
          logDebug(`[DEBUG] Override criado para missa: ${id}`);
          return res.json(novaMissa);
        }
        return res.status(404).json({ error: "Missa n\xE3o encontrada e dados insuficientes para criar override." });
      }
      if (typeof quantidade === "number" && !isNaN(quantidade) && quantidade >= 0) {
        database_default.data.missasTemporarias[index] = {
          ...database_default.data.missasTemporarias[index],
          ...body,
          quantidade
          // Garante que a quantidade seja atualizada como número
        };
        await database_default.write();
        logDebug(`[DEBUG] Missa ${id} atualizada com sucesso.`);
        res.json(database_default.data.missasTemporarias[index]);
      } else {
        logDebug(`[DEBUG] Quantidade inv\xE1lida: ${quantidade} (${typeof quantidade})`);
        res.status(400).json({ error: "Quantidade inv\xE1lida." });
      }
    } catch (error) {
      console.error("Erro ao atualizar missa:", error);
      res.status(500).json({ error: "Erro ao atualizar missa." });
    }
  });
  app2.post("/api/missas-temporarias/:id/toggle-data", async (req, res) => {
    const { id } = req.params;
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: "Data \xE9 obrigat\xF3ria." });
    try {
      await database_default.read();
      if (!database_default.data.missasTemporarias) return res.status(404).json({ error: "Nenhuma missa encontrada." });
      const index = database_default.data.missasTemporarias.findIndex((m) => m.id === id);
      if (index === -1) return res.status(404).json({ error: "Missa n\xE3o encontrada." });
      const missa = database_default.data.missasTemporarias[index];
      if (!missa.datasInativas) missa.datasInativas = [];
      const dateIndex = missa.datasInativas.indexOf(data);
      if (dateIndex === -1) {
        missa.datasInativas.push(data);
      } else {
        missa.datasInativas.splice(dateIndex, 1);
      }
      await database_default.write();
      res.json(missa);
    } catch (error) {
      res.status(500).json({ error: "Erro ao alternar data inativa." });
    }
  });
  app2.get("/api/fidelis/integracao", async (req, res) => {
    const { paroquia } = req.query;
    const paroquiaStr = paroquia ? String(paroquia).trim() : "";
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      await database_default.read();
      const allCoordinators = database_default.data.fidelisCoordinators || [];
      const filteredCoordinators = paroquiaStr ? allCoordinators.filter((c) => c.paroquia && c.paroquia.toLowerCase() === paroquiaStr.toLowerCase()) : allCoordinators;
      const todasMissas = database_default.data.missasTemporarias || [];
      const MISSAS_PADRAO = [
        { id: "padrao-sab-17", nome: "Missa de S\xE1bado", frequencia: "semanal", diaSemana: "6", horario: "17:00", quantidade: 6, tipo: "padrao" },
        { id: "padrao-dom-07", nome: "Missa de Domingo", frequencia: "semanal", diaSemana: "0", horario: "07:30", quantidade: 5, tipo: "padrao" },
        { id: "padrao-dom-10", nome: "Missa de Domingo", frequencia: "semanal", diaSemana: "0", horario: "10:00", quantidade: 8, tipo: "padrao" },
        { id: "padrao-dom-19", nome: "Missa de Domingo", frequencia: "semanal", diaSemana: "0", horario: "19:00", quantidade: 8, tipo: "padrao" }
      ];
      const missasDaParoquia = todasMissas.filter((m) => {
        const mPar = m.paroquia && m.paroquia !== "undefined" ? String(m.paroquia).trim() : "";
        if (paroquiaStr) {
          return mPar.toLowerCase() === paroquiaStr.toLowerCase();
        }
        return mPar === "";
      });
      const missasMescladas = [];
      MISSAS_PADRAO.forEach((mp) => {
        const override = missasDaParoquia.find(
          (m) => (m.tipo === "padrao" || m.tipo === "fixa" || !m.tipo && m.frequencia === "semanal") && m.horario === mp.horario && m.diaSemana === mp.diaSemana && !m.data
        );
        if (override) {
          if (!override.deletada) {
            missasMescladas.push({ ...mp, ...override, paroquia: paroquiaStr || override.paroquia || "Padr\xE3o" });
          }
        } else {
          missasMescladas.push({ ...mp, paroquia: paroquiaStr || "Padr\xE3o" });
        }
      });
      missasDaParoquia.forEach((m) => {
        if (m.deletada) return;
        const isDefaultOverride = MISSAS_PADRAO.some(
          (mp) => m.horario === mp.horario && m.diaSemana === mp.diaSemana && (m.tipo === "padrao" || m.tipo === "fixa" || !m.tipo && m.frequencia === "semanal") && !m.data
        );
        if (!isDefaultOverride) {
          missasMescladas.push(m);
        }
      });
      const sanitizedMissas = missasMescladas.map((m) => {
        const { ministros, escala, responsavel, ...rest } = m;
        return rest;
      });
      res.json({
        sucesso: true,
        portal: "Portal do MECE (Portal de Ministros Extraordin\xE1rios da Sagrada Comunh\xE3o)",
        paroquiaFiltro: paroquiaStr || "Todas",
        atualizadoEm: (/* @__PURE__ */ new Date()).toISOString(),
        coordenadores: filteredCoordinators,
        missas: sanitizedMissas
      });
    } catch (error) {
      console.error("Erro na API unificada Fidelis:", error);
      res.status(500).json({ error: "Erro ao gerar dados de integra\xE7\xE3o unificada." });
    }
  });
  app2.get("/api/fidelis/escala-exclusiva", async (req, res) => {
    const { token, paroquia } = req.query;
    const tokenHeader = req.headers["x-fidelis-token"];
    const validToken = "fidelis_exclusivo_2026";
    if (token !== validToken && tokenHeader !== validToken) {
      return res.status(403).json({
        error: "Acesso negado. Token de acesso exclusivo inv\xE1lido ou ausente.",
        mensagem: "Utilize o par\xE2metro ?token=fidelis_exclusivo_2026 ou o header x-fidelis-token."
      });
    }
    const paroquiaStr = paroquia ? String(paroquia).trim() : "";
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      await database_default.read();
      const todasMissas = database_default.data.missasTemporarias || [];
      const MISSAS_PADRAO = [
        { id: "padrao-sab-17", nome: "Missa de S\xE1bado", frequencia: "semanal", diaSemana: "6", horario: "17:00", quantidade: 6, tipo: "padrao" },
        { id: "padrao-dom-07", nome: "Missa de Domingo", frequencia: "semanal", diaSemana: "0", horario: "07:30", quantidade: 5, tipo: "padrao" },
        { id: "padrao-dom-10", nome: "Missa de Domingo", frequencia: "semanal", diaSemana: "0", horario: "10:00", quantidade: 8, tipo: "padrao" },
        { id: "padrao-dom-19", nome: "Missa de Domingo", frequencia: "semanal", diaSemana: "0", horario: "19:00", quantidade: 8, tipo: "padrao" }
      ];
      const missasDaParoquia = todasMissas.filter((m) => {
        const mPar = m.paroquia && m.paroquia !== "undefined" ? String(m.paroquia).trim() : "";
        if (paroquiaStr) {
          return mPar.toLowerCase() === paroquiaStr.toLowerCase();
        }
        return mPar === "";
      });
      const missasMescladas = [];
      MISSAS_PADRAO.forEach((mp) => {
        const override = missasDaParoquia.find(
          (m) => (m.tipo === "padrao" || m.tipo === "fixa" || !m.tipo && m.frequencia === "semanal") && m.horario === mp.horario && m.diaSemana === mp.diaSemana && !m.data
        );
        if (override) {
          if (!override.deletada) {
            missasMescladas.push({ ...mp, ...override, paroquia: paroquiaStr || override.paroquia || "Padr\xE3o" });
          }
        } else {
          missasMescladas.push({ ...mp, paroquia: paroquiaStr || "Padr\xE3o" });
        }
      });
      missasDaParoquia.forEach((m) => {
        if (m.deletada) return;
        const isDefaultOverride = MISSAS_PADRAO.some(
          (mp) => m.horario === mp.horario && m.diaSemana === mp.diaSemana && (m.tipo === "padrao" || m.tipo === "fixa" || !m.tipo && m.frequencia === "semanal") && !m.data
        );
        if (!isDefaultOverride) {
          missasMescladas.push(m);
        }
      });
      const sanitizedMissas = missasMescladas.map((m) => {
        const { ministros, escala, responsavel, ...rest } = m;
        return rest;
      });
      res.json({
        sucesso: true,
        origem: "Portal do MECE - Escala Online Exclusiva para Fidelis",
        tokenAutorizado: true,
        paroquiaFiltro: paroquiaStr || "Todas",
        atualizadoEm: (/* @__PURE__ */ new Date()).toISOString(),
        totalMissas: sanitizedMissas.length,
        escala: sanitizedMissas
      });
    } catch (error) {
      console.error("Erro ao buscar escala exclusiva Fidelis:", error);
      res.status(500).json({ error: "Erro ao buscar escala exclusiva." });
    }
  });
  app2.get("/api/fidelis/missas", async (req, res) => {
    const { paroquia } = req.query;
    const paroquiaStr = paroquia ? String(paroquia).trim() : "";
    try {
      await database_default.read();
      const todasMissas = database_default.data.missasTemporarias || [];
      const MISSAS_PADRAO = [
        { id: "padrao-sab-17", nome: "Missa de S\xE1bado", frequencia: "semanal", diaSemana: "6", horario: "17:00", quantidade: 6, tipo: "padrao" },
        { id: "padrao-dom-07", nome: "Missa de Domingo", frequencia: "semanal", diaSemana: "0", horario: "07:30", quantidade: 5, tipo: "padrao" },
        { id: "padrao-dom-10", nome: "Missa de Domingo", frequencia: "semanal", diaSemana: "0", horario: "10:00", quantidade: 8, tipo: "padrao" },
        { id: "padrao-dom-19", nome: "Missa de Domingo", frequencia: "semanal", diaSemana: "0", horario: "19:00", quantidade: 8, tipo: "padrao" }
      ];
      const missasDaParoquia = todasMissas.filter((m) => {
        const mPar = m.paroquia && m.paroquia !== "undefined" ? String(m.paroquia).trim() : "";
        if (paroquiaStr) {
          return mPar.toLowerCase() === paroquiaStr.toLowerCase();
        }
        return mPar === "";
      });
      const missasMescladas = [];
      MISSAS_PADRAO.forEach((mp) => {
        const override = missasDaParoquia.find(
          (m) => (m.tipo === "padrao" || m.tipo === "fixa" || !m.tipo && m.frequencia === "semanal") && m.horario === mp.horario && m.diaSemana === mp.diaSemana && !m.data
        );
        if (override) {
          if (!override.deletada) {
            missasMescladas.push({ ...mp, ...override, paroquia: paroquiaStr || override.paroquia || "Padr\xE3o" });
          }
        } else {
          missasMescladas.push({ ...mp, paroquia: paroquiaStr || "Padr\xE3o" });
        }
      });
      missasDaParoquia.forEach((m) => {
        if (m.deletada) return;
        const isDefaultOverride = MISSAS_PADRAO.some(
          (mp) => m.horario === mp.horario && m.diaSemana === mp.diaSemana && (m.tipo === "padrao" || m.tipo === "fixa" || !m.tipo && m.frequencia === "semanal") && !m.data
        );
        if (!isDefaultOverride) {
          missasMescladas.push(m);
        }
      });
      const sanitizedMissas = missasMescladas.map((m) => {
        const { ministros, escala, responsavel, ...rest } = m;
        return rest;
      });
      res.json(sanitizedMissas);
    } catch (error) {
      console.error("Erro ao buscar missas Fidelis:", error);
      res.status(500).json({ error: "Erro ao buscar missas." });
    }
  });
  app2.get("/api/fidelis/coordenadores", async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      await database_default.read();
      res.json(database_default.data.fidelisCoordinators || []);
    } catch (error) {
      console.error("Erro ao buscar coordenadores Fidelis:", error);
      res.status(500).json({ error: "Erro ao buscar coordenadores Fidelis." });
    }
  });
  app2.post("/api/fidelis/coordenadores", async (req, res) => {
    try {
      await database_default.read();
      if (!database_default.data.fidelisCoordinators) database_default.data.fidelisCoordinators = [];
      const { nome, telefone, email, paroquia, cargo, tipo, nomeConjuge, telefoneConjuge, senha, status, observacoes } = req.body;
      if (!nome || !telefone || !paroquia) {
        return res.status(400).json({ error: "Nome, telefone e par\xF3quia s\xE3o obrigat\xF3rios." });
      }
      const novoCoordenador = {
        id: "fidelis_coord_" + Date.now(),
        nome: String(nome).trim(),
        telefone: String(telefone).trim(),
        email: email ? String(email).trim() : "",
        paroquia: String(paroquia).trim(),
        cargo: cargo === "vice_coordenador" ? "vice_coordenador" : "coordenador",
        tipo: tipo === "casal" ? "casal" : "individual",
        nomeConjuge: nomeConjuge ? String(nomeConjuge).trim() : "",
        telefoneConjuge: telefoneConjuge ? String(telefoneConjuge).trim() : "",
        senha: senha ? String(senha).trim() : "123456",
        status: status === "inativo" ? "inativo" : "ativo",
        observacoes: observacoes ? String(observacoes).trim() : "",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      database_default.data.fidelisCoordinators.push(novoCoordenador);
      await database_default.write();
      res.status(201).json(novoCoordenador);
    } catch (error) {
      console.error("Erro ao cadastrar coordenador Fidelis:", error);
      res.status(500).json({ error: "Erro ao cadastrar coordenador Fidelis." });
    }
  });
  app2.put("/api/fidelis/coordenadores/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await database_default.read();
      if (!database_default.data.fidelisCoordinators) database_default.data.fidelisCoordinators = [];
      const index = database_default.data.fidelisCoordinators.findIndex((c) => c.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Coordenador Fidelis n\xE3o encontrado." });
      }
      const existing = database_default.data.fidelisCoordinators[index];
      const { nome, telefone, email, paroquia, cargo, tipo, nomeConjuge, telefoneConjuge, senha, status, observacoes } = req.body;
      database_default.data.fidelisCoordinators[index] = {
        ...existing,
        nome: nome !== void 0 ? String(nome).trim() : existing.nome,
        telefone: telefone !== void 0 ? String(telefone).trim() : existing.telefone,
        email: email !== void 0 ? String(email).trim() : existing.email,
        paroquia: paroquia !== void 0 ? String(paroquia).trim() : existing.paroquia,
        cargo: cargo !== void 0 ? cargo === "vice_coordenador" ? "vice_coordenador" : "coordenador" : existing.cargo || "coordenador",
        tipo: tipo !== void 0 ? tipo === "casal" ? "casal" : "individual" : existing.tipo || "individual",
        nomeConjuge: nomeConjuge !== void 0 ? String(nomeConjuge).trim() : existing.nomeConjuge,
        telefoneConjuge: telefoneConjuge !== void 0 ? String(telefoneConjuge).trim() : existing.telefoneConjuge,
        senha: senha !== void 0 ? String(senha).trim() : existing.senha,
        status: status !== void 0 ? status === "inativo" ? "inativo" : "ativo" : existing.status,
        observacoes: observacoes !== void 0 ? String(observacoes).trim() : existing.observacoes
      };
      await database_default.write();
      res.json(database_default.data.fidelisCoordinators[index]);
    } catch (error) {
      console.error("Erro ao atualizar coordenador Fidelis:", error);
      res.status(500).json({ error: "Erro ao atualizar coordenador Fidelis." });
    }
  });
  app2.delete("/api/fidelis/coordenadores/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await database_default.read();
      if (!database_default.data.fidelisCoordinators) database_default.data.fidelisCoordinators = [];
      const initialLen = database_default.data.fidelisCoordinators.length;
      database_default.data.fidelisCoordinators = database_default.data.fidelisCoordinators.filter((c) => c.id !== id);
      if (database_default.data.fidelisCoordinators.length === initialLen) {
        return res.status(404).json({ error: "Coordenador Fidelis n\xE3o encontrado." });
      }
      await database_default.write();
      res.json({ message: "Coordenador Fidelis exclu\xEDdo com sucesso." });
    } catch (error) {
      console.error("Erro ao excluir coordenador Fidelis:", error);
      res.status(500).json({ error: "Erro ao excluir coordenador Fidelis." });
    }
  });
  app2.get("/api/paroquias", async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      await database_default.read();
      if (!database_default.data.paroquias || database_default.data.paroquias.length === 0) {
        database_default.data.paroquias = [
          {
            id: "1772280333795",
            nome: "Par\xF3quia Santa Rita de C\xE1ssia",
            cnpj: "",
            cidade: "Bauru",
            estado: "SP",
            coordenador: "Alexandre",
            telefoneCoordenador: "14997865806"
          },
          {
            id: "1772281505207",
            nome: "Par\xF3quia S\xE3o Crist\xF3v\xE3o",
            cnpj: "",
            cidade: "Bauru",
            estado: "SP",
            coordenador: "Josu\xE9",
            telefoneCoordenador: "14999999999"
          },
          {
            id: "1774922106968",
            nome: "Par\xF3quia Nossa Senhora das Gra\xE7as",
            cnpj: "",
            cidade: "Bauru",
            estado: "SP",
            coordenador: "Fernanda e Celiomar",
            telefoneCoordenador: "14 99113-3422"
          }
        ];
        await database_default.write();
      }
      const count = database_default.data.paroquias?.length || 0;
      logDebug(`[DEBUG /api/paroquias] Par\xF3quias solicitadas. Count: ${count}`);
      res.json(database_default.data.paroquias || []);
    } catch (error) {
      console.error("Erro ao buscar par\xF3quias:", error);
      res.status(500).json({ error: "Erro ao buscar par\xF3quias." });
    }
  });
  app2.post("/api/paroquias", async (req, res) => {
    try {
      await database_default.read();
      if (!database_default.data.paroquias) database_default.data.paroquias = [];
      const novaParoquia = {
        id: Date.now().toString(),
        ...req.body
      };
      database_default.data.paroquias.push(novaParoquia);
      const { coordenador, telefoneCoordenador, nome } = req.body;
      if (coordenador && telefoneCoordenador && nome) {
        if (!database_default.data.ministros) database_default.data.ministros = [];
        const clean = (num) => num ? num.replace(/\D/g, "") : "";
        const cleanTel = clean(telefoneCoordenador);
        const existing = database_default.data.ministros.find((m) => clean(m.telefone) === cleanTel || m.telefoneConjuge && clean(m.telefoneConjuge) === cleanTel);
        if (existing) {
          if (existing.role !== "admin") existing.role = "coordenacao";
          existing.aprovado = true;
          existing.paroquia = nome;
          if (coordenador) {
            existing.nome = coordenador;
            existing.nomeExibicao = coordenador;
          }
        } else {
          const novoId = database_default.data.ministros.length > 0 ? Math.max(...database_default.data.ministros.map((m) => m.id)) + 1 : 1;
          database_default.data.ministros.push({
            id: novoId,
            nome: coordenador,
            nomeExibicao: coordenador,
            telefone: telefoneCoordenador,
            paroquia: nome,
            senha: "123456",
            // senha padrão para acesso inicial
            tipo: "individual",
            role: "coordenacao",
            acessoCoordenacao: "casal",
            aprovado: true,
            cadastroCompleto: false,
            incompatibilidades: []
          });
        }
      }
      await database_default.write();
      res.json(novaParoquia);
    } catch (error) {
      res.status(500).json({ error: "Erro ao criar par\xF3quia." });
    }
  });
  app2.put("/api/paroquias/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await database_default.read();
      if (!database_default.data.paroquias) return res.status(404).json({ error: "Nenhuma par\xF3quia encontrada." });
      const index = database_default.data.paroquias.findIndex((p) => p.id === id);
      if (index === -1) return res.status(404).json({ error: "Par\xF3quia n\xE3o encontrada." });
      const antigaParoquia = database_default.data.paroquias[index];
      database_default.data.paroquias[index] = { ...antigaParoquia, ...req.body };
      const { coordenador, telefoneCoordenador, nome } = req.body;
      const paroquiaNome = nome || antigaParoquia.nome;
      if (coordenador && telefoneCoordenador) {
        if (!database_default.data.ministros) database_default.data.ministros = [];
        const clean = (num) => num ? num.replace(/\D/g, "") : "";
        const cleanTel = clean(telefoneCoordenador);
        const existing = database_default.data.ministros.find((m) => clean(m.telefone) === cleanTel || m.telefoneConjuge && clean(m.telefoneConjuge) === cleanTel);
        if (existing) {
          if (existing.role !== "admin") existing.role = "coordenacao";
          existing.aprovado = true;
          existing.paroquia = paroquiaNome;
          if (coordenador) {
            existing.nome = coordenador;
            existing.nomeExibicao = coordenador;
          }
        } else {
          const novoId = database_default.data.ministros.length > 0 ? Math.max(...database_default.data.ministros.map((m) => m.id)) + 1 : 1;
          database_default.data.ministros.push({
            id: novoId,
            nome: coordenador,
            nomeExibicao: coordenador,
            telefone: telefoneCoordenador,
            paroquia: paroquiaNome,
            senha: "123456",
            // senha padrão para acesso inicial
            tipo: "individual",
            role: "coordenacao",
            acessoCoordenacao: "casal",
            aprovado: true,
            cadastroCompleto: false,
            incompatibilidades: []
          });
        }
      }
      await database_default.write();
      res.json(database_default.data.paroquias[index]);
    } catch (error) {
      res.status(500).json({ error: "Erro ao atualizar par\xF3quia." });
    }
  });
  app2.delete("/api/paroquias/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await database_default.read();
      if (!database_default.data.paroquias) return res.status(404).json({ error: "Nenhuma par\xF3quia encontrada." });
      const index = database_default.data.paroquias.findIndex((p) => p.id === id);
      if (index === -1) return res.status(404).json({ error: "Par\xF3quia n\xE3o encontrada." });
      database_default.data.paroquias.splice(index, 1);
      await database_default.write();
      res.json({ message: "Par\xF3quia exclu\xEDda com sucesso!" });
    } catch (error) {
      res.status(500).json({ error: "Erro ao excluir par\xF3quia." });
    }
  });
  app2.get("/api/testers", async (req, res) => {
    try {
      const { paroquia } = req.query;
      await database_default.read();
      let testers = database_default.data.testers || [];
      if (paroquia) {
        testers = testers.filter((t) => t.paroquia === paroquia);
      }
      res.json(testers);
    } catch (err) {
      res.status(500).json({ error: "Erro ao buscar testadores: " + err });
    }
  });
  app2.post("/api/testers", async (req, res) => {
    try {
      const tester = req.body;
      await database_default.read();
      if (!database_default.data.testers) database_default.data.testers = [];
      if (!tester.id) {
        tester.id = Math.random().toString(36).substring(2, 9);
      }
      tester.dataAdicao = (/* @__PURE__ */ new Date()).toISOString();
      database_default.data.testers.push(tester);
      await database_default.write();
      res.json({ success: true, tester });
    } catch (err) {
      res.status(500).json({ error: "Erro ao adicionar testador: " + err });
    }
  });
  app2.post("/api/testers/remove", async (req, res) => {
    try {
      const { id } = req.body;
      await database_default.read();
      if (database_default.data.testers) {
        database_default.data.testers = database_default.data.testers.filter((t) => t.id !== id);
        await database_default.write();
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Erro ao remover testador: " + err });
    }
  });
  app2.post("/api/testers/toggle-confirm", async (req, res) => {
    try {
      const { id } = req.body;
      await database_default.read();
      if (database_default.data.testers) {
        const tester = database_default.data.testers.find((t) => t.id === id);
        if (tester) {
          tester.confirmado = !tester.confirmado;
          await database_default.write();
          return res.json({ success: true, tester });
        }
      }
      res.status(404).json({ error: "Testador n\xE3o encontrado" });
    } catch (err) {
      res.status(500).json({ error: "Erro ao atualizar testador: " + err });
    }
  });
  app2.post("/api/admin/fix-escala-santa-rita", async (req, res) => {
    try {
      const paroquia = "Par\xF3quia Santa Rita de C\xE1ssia";
      if (!database_default.data || !database_default.data.escalaGerada || !database_default.data.escalaGerada[paroquia]) {
        return res.status(404).json({ error: "No data found" });
      }
      const paroquiaEscala = database_default.data.escalaGerada[paroquia];
      let changed = false;
      Object.keys(paroquiaEscala).forEach((date) => {
        Object.keys(paroquiaEscala[date]).forEach((horario) => {
          const slot = paroquiaEscala[date][horario];
          if (slot.ministros && Array.isArray(slot.ministros)) {
            const newMinistros = [];
            let slotChanged = false;
            slot.ministros.forEach((m) => {
              if (m === "Cl\xE1udio e Shyrlei" || m === "Claudio e Shyrlei") {
                newMinistros.push("Cl\xE1udio");
                newMinistros.push("Shyrlei");
                slotChanged = true;
              } else {
                newMinistros.push(m);
              }
            });
            if (slotChanged) {
              slot.ministros = newMinistros;
              changed = true;
            }
          }
        });
      });
      if (changed) {
        await database_default.write();
        return res.json({ status: "ok", message: "Corre\xE7\xF5es aplicadas com sucesso." });
      } else {
        return res.json({ status: "ok", message: "Nenhuma entrada incorreta encontrada." });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
  app2.use((err, req, res, next) => {
    console.error("[GLOBAL SERVER ERROR]", err);
    res.status(500).json({
      error: "Erro interno do servidor",
      message: err.message || String(err)
    });
  });
  app2.all("/api/*", (req, res) => {
    const errorMsg = `[404 API NOT FOUND] ${req.method} ${req.originalUrl || req.path}`;
    console.warn(errorMsg);
    try {
      fs.appendFileSync("debug.log", `${(/* @__PURE__ */ new Date()).toISOString()} - ${errorMsg}
`);
    } catch (e) {
    }
    res.status(404).json({
      error: "Endpoint da API n\xE3o encontrado",
      method: req.method,
      path: req.originalUrl || req.path
    });
  });
  const distPath = path.join(process.cwd(), "dist");
  const hasDist = fs.existsSync(path.join(distPath, "index.html"));
  if (hasDist) {
    logDebug(`[SERVER] Servindo arquivos est\xE1ticos de: ${distPath}`);
    app2.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        }
      }
    }));
    app2.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else if (process.env.NODE_ENV !== "production") {
    logDebug("[SERVER] Iniciando Vite em modo middleware...");
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app2.use(vite.middlewares);
      logDebug("[SERVER] Vite configurado.");
    } catch (e) {
      console.error("[SERVER] Falha ao iniciar Vite middleware:", e);
    }
  } else {
    app2.get("*", (req, res) => {
      res.status(404).send("Page not found");
    });
  }
  isReady = true;
  while (waitingRequests.length > 0) {
    const nextFn = waitingRequests.shift();
    if (nextFn) nextFn();
  }
  console.log(`[SERVER] Inicializa\xE7\xE3o 100% conclu\xEDda. Todas as rotas e Vite ativos.`);
  logDebug(`[SERVER] Inicializa\xE7\xE3o 100% conclu\xEDda. Todas as rotas e Vite ativos.`);
  console.log("[BACKGROUND LEMBRETE] Starting background reminder scheduler...");
  const startupReminderTimer = setTimeout(async () => {
    await triggerAllBackgroundReminders();
  }, 5e3);
  startupReminderTimer.unref();
  const reminderInterval = setInterval(async () => {
    await triggerAllBackgroundReminders();
  }, 1e3 * 60 * 15);
  reminderInterval.unref();
  const autofixTimer = setTimeout(async () => {
    try {
      console.log("[AUTO-FIX] Checking for incorrect couple entries...");
      const paroquia = "Par\xF3quia Santa Rita de C\xE1ssia";
      if (database_default.data && database_default.data.escalaGerada && database_default.data.escalaGerada[paroquia]) {
        const paroquiaEscala = database_default.data.escalaGerada[paroquia];
        let changed = false;
        Object.keys(paroquiaEscala).forEach((date) => {
          Object.keys(paroquiaEscala[date]).forEach((horario) => {
            const slot = paroquiaEscala[date][horario];
            if (slot.ministros && Array.isArray(slot.ministros)) {
              const newMinistros = [];
              let slotChanged = false;
              slot.ministros.forEach((m) => {
                if (m === "Cl\xE1udio e Shyrlei" || m === "Claudio e Shyrlei") {
                  newMinistros.push("Cl\xE1udio");
                  newMinistros.push("Shyrlei");
                  slotChanged = true;
                } else {
                  newMinistros.push(m);
                }
              });
              if (slotChanged) {
                slot.ministros = newMinistros;
                changed = true;
              }
            }
          });
        });
        if (changed) {
          await database_default.write();
          console.log("[AUTO-FIX] Specific entry fixed and saved.");
        }
      }
    } catch (err) {
      console.error("[AUTO-FIX] Error:", err);
    }
  }, 1e4);
  autofixTimer.unref();
}
startServer();
export {
  getBrazilDate
};
//# sourceMappingURL=server.js.map
