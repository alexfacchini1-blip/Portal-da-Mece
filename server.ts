import 'dotenv/config';
import fs from 'fs';
fs.appendFileSync('debug.log', `${new Date().toISOString()} - [BOOT] server.ts starting...\n`);
import * as cheerio from 'cheerio';
import express from 'express';
import db, { setupDatabase } from './src/database';
import path from 'path';
import { fileURLToPath } from 'url';
import webpush from 'web-push';

const logDebug = (msg: string) => {
  const logLine = `${new Date().toISOString()} - ${msg}\n`;
  console.log(logLine.trim());
  // File logging is disabled or could be done asynchronously in production to avoid blocking.
};


const getEaster = (year: number) => {
  const f = Math.floor,
    G = year % 19,
    C = f(year / 100),
    H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
    I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
    J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
    L = I - J,
    month = 3 + f((L + 40) / 44),
    day = L + 28 - 31 * f(month / 4);
  return new Date(year, month - 1, day);
};

const getHolyWeekDates = (year: number) => {
  const easter = getEaster(year);
  const formatDate = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
  };

  const domingoRamos = new Date(easter);
  domingoRamos.setDate(easter.getDate() - 7);

  const quintaSanta = new Date(easter);
  quintaSanta.setDate(easter.getDate() - 3);

  const sextaSanta = new Date(easter);
  sextaSanta.setDate(easter.getDate() - 2);

  const sabadoSanto = new Date(easter);
  sabadoSanto.setDate(easter.getDate() - 1);

  return {
    domingoRamos: formatDate(domingoRamos),
    quintaSanta: formatDate(quintaSanta),
    sextaSanta: formatDate(sextaSanta),
    sabadoSanto: formatDate(sabadoSanto),
    domingoPascoa: formatDate(easter),
  };
};

const normalize = (str: string | null | undefined) => {
  if (!str) return '';
  return String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

const normalizeModo = (modo?: string | null) => {
  const m = normalize(modo);
  if (m === 'casal' || m === 'ambos') return 'casal';
  if (m === 'ela' || m === 'esposa' || m === 'conjuge') return 'ela';
  if (m === 'ele' || m === 'marido' || m === 'esposo' || m === 'titular') return 'ele';
  return 'individual';
};

interface MinistroMatchResult {
  ministro: any;
  targetPhones: string[];
  matchedName: string;
}

const findMinistroByNomeOrId = (escMin: any, paroquia: string): MinistroMatchResult | null => {
  if (!escMin) return null;
  if (!db.data || !db.data.ministros) return null;
  
  const targetParoquia = String(paroquia || '').trim();
  const paroquiaMinisters = db.data.ministros.filter(m => 
    !targetParoquia || String(m.paroquia || '').trim() === targetParoquia
  );

  const getTelPrimary = (m: any) => m.telefone ? String(m.telefone).replace(/\D/g, '') : '';
  const getTelConjuge = (m: any) => m.telefoneConjuge ? String(m.telefoneConjuge).replace(/\D/g, '') : '';

  // 1. Direct ID match if escMin is an object with id
  if (typeof escMin === 'object' && escMin !== null) {
    if (escMin.id) {
      const min = paroquiaMinisters.find(m => String(m.id) === String(escMin.id));
      if (min) {
        const pTel = getTelPrimary(min);
        const cTel = getTelConjuge(min);
        const phones = min.tipo === 'casal' ? [pTel, cTel].filter(Boolean) : [pTel].filter(Boolean);
        return { ministro: min, targetPhones: phones, matchedName: min.nome };
      }
    }
    escMin = escMin.nome; // Fallback to name inside object
  }

  if (typeof escMin !== 'string') return null;

  const rawName = String(escMin).trim();
  if (!rawName) return null;

  const normSearch = normalize(rawName).replace(/[&/]/g, ' e ').replace(/\s+/g, ' ').trim();
  if (!normSearch || normSearch === 'nao definido' || normSearch === 'lider da missa' || normSearch === 'coordenacao') {
    return null;
  }

  const isCoupleSearch = normSearch.includes(' e ');

  const matchSingle = (nameA: string, nameB: string): boolean => {
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
    const searchParts = normSearch.split(' e ').map(p => p.trim()).filter(Boolean);
    if (searchParts.length < 2) return null;
    
    // Look for a registered couple minister where both husband and wife match the two parts
    for (const m of paroquiaMinisters) {
      const isCasal = m.tipo === 'casal' || !!m.nomeConjuge;
      if (!isCasal) continue;

      const eleNames = [m.nome, m.nomeExibicao].filter(Boolean).map(normalize);
      const elaNames = [m.nomeConjuge, m.nomeExibicaoConjuge].filter(Boolean).map(normalize);

      const part1MatchesEle = eleNames.some(n => matchSingle(n, searchParts[0]));
      const part2MatchesEla = elaNames.some(n => matchSingle(n, searchParts[1]));

      const part1MatchesEla = elaNames.some(n => matchSingle(n, searchParts[0]));
      const part2MatchesEle = eleNames.some(n => matchSingle(n, searchParts[1]));

      if ((part1MatchesEle && part2MatchesEla) || (part1MatchesEla && part2MatchesEle)) {
        const pTel = getTelPrimary(m);
        const cTel = getTelConjuge(m);
        return {
          ministro: m,
          targetPhones: [pTel, cTel].filter(Boolean),
          matchedName: `${m.nomeExibicao || m.nome} & ${m.nomeExibicaoConjuge || m.nomeConjuge}`
        };
      }
    }
    // Never fall back to a single minister if search was for a couple!
    return null;
  }

  // Single minister search (no " e ")
  for (const m of paroquiaMinisters) {
    const eleNames = [m.nome, m.nomeExibicao].filter(Boolean).map(normalize);
    const elaNames = [m.nomeConjuge, m.nomeExibicaoConjuge].filter(Boolean).map(normalize);

    const matchEle = eleNames.some(n => matchSingle(n, normSearch));
    if (matchEle) {
      const pTel = getTelPrimary(m);
      return {
        ministro: m,
        targetPhones: pTel ? [pTel] : [],
        matchedName: m.nomeExibicao || m.nome
      };
    }

    const matchEla = elaNames.some(n => matchSingle(n, normSearch));
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

const isComplexPassword = (password: string | null | undefined): boolean => {
  if (!password) return false;
  if (password.length < 6) return false;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUppercase && hasLowercase && hasSpecial;
};

function matchPhones(tel1: string | null | undefined, tel2: string | null | undefined): boolean {
  if (!tel1 || !tel2) return false;
  const clean1 = String(tel1).replace(/\D/g, '');
  const clean2 = String(tel2).replace(/\D/g, '');
  if (!clean1 || !clean2) return false;
  if (clean1 === clean2) return true;
  
  // Brazil DDD numbers can be compared by their ending characters.
  // Standard phone has at least 8 digits. Check if either ends with the other.
  const minLen = Math.min(clean1.length, clean2.length);
  if (minLen >= 8) {
    return clean1.endsWith(clean2) || clean2.endsWith(clean1);
  }
  return false;
}

async function initVapidKeys() {
  try {
    if (!db.data.config) {
      db.data.config = { coordinatorEnabled: false, escalaPublicada: false, disponibilidadeAberta: false };
    }
    const anyConfig = db.data.config as any;
    if (!anyConfig.vapidKeys) {
      const keys = webpush.generateVAPIDKeys();
      anyConfig.vapidKeys = keys;
      await db.write();
    }
    webpush.setVapidDetails(
      'mailto:alex.facchini1@gmail.com',
      anyConfig.vapidKeys.publicKey,
      anyConfig.vapidKeys.privateKey
    );
    console.log('[PUSH] VAPID keys set successfully.');
  } catch (err) {
    console.error('[PUSH] Failed to init VAPID keys:', err);
  }
}

async function sendPushNotificationToUser(telefone: string, title: string, body: string, url: string = '/', paroquia?: string) {
  try {
    await db.read();
    if (!db.data || !db.data.ministros) return;

    const matchingMinisters = db.data.ministros.filter(m => {
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
      const subs = (ministro as any).pushSubscriptions || [];
      if (subs.length === 0) continue;

      console.log(`[PUSH] Sending notification to ${ministro.nome} (${subs.length} total subscription(s) on profile)`);
      const payload = JSON.stringify({ title, body, url });

      const activeSubs: any[] = [];
      const cleanTargetPhone = String(telefone).replace(/\D/g, '');

      for (const sub of subs) {
        let isLegacy = true;
        let subPhone = '';
        let actualSub = sub;

        if (sub && typeof sub === 'object' && 'subscription' in sub) {
          isLegacy = false;
          subPhone = sub.telefone ? String(sub.telefone).replace(/\D/g, '') : '';
          actualSub = sub.subscription;
        }

        if (isLegacy) {
          const mPrimary = ministro.telefone ? String(ministro.telefone).replace(/\D/g, '') : '';
          const mConj = (ministro as any).telefoneConjuge ? String((ministro as any).telefoneConjuge).replace(/\D/g, '') : '';
          if (mPrimary !== cleanTargetPhone && mConj !== cleanTargetPhone) {
            console.log(`[PUSH] Skipping legacy subscription on ${ministro.nome} because profile phones do not match target phone (${cleanTargetPhone})`);
            activeSubs.push(sub);
            continue;
          }
        }

        // If the subscription has an associated phone number and it is NOT the one we are sending to, skip it!
        // (But keep it in activeSubs so it is not deleted from the database)
        if (!isLegacy && subPhone && subPhone !== cleanTargetPhone) {
          console.log(`[PUSH] Skipping subscription on ${ministro.nome} because subscription phone (${subPhone}) does not match target phone (${cleanTargetPhone})`);
          activeSubs.push(sub);
          continue;
        }

        try {
          // Set TTL to 4 hours (14400 seconds) so old messages don't pop up long after they are relevant
          await webpush.sendNotification(actualSub, payload, { TTL: 14400 });
          activeSubs.push(sub);
        } catch (error: any) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`[PUSH] Subscription for ${ministro.nome} expired (${error.statusCode} ${error.message || 'Gone'}), removing from database.`);
            dbUpdated = true;
          } else {
            console.error(`[PUSH] Failed to send push to sub of ${ministro.nome}:`, error.statusCode || error, error.message);
            activeSubs.push(sub);
          }
        }
      }

      if (activeSubs.length !== subs.length) {
        (ministro as any).pushSubscriptions = activeSubs;
        dbUpdated = true;
      }
    }

    if (dbUpdated) {
      await db.write();
    }
  } catch (err) {
    console.error('[PUSH] Error in sendPushNotificationToUser:', err);
  }
}

async function sendPushNotificationToParoquia(paroquia: string, title: string, body: string, url: string = '/') {
  try {
    await db.read();
    if (!db.data || !db.data.ministros) return;

    const targetParoquia = String(paroquia).trim().toLowerCase();
    const matchingMinisters = db.data.ministros.filter(m => String(m.paroquia).trim().toLowerCase() === targetParoquia);

    let dbUpdated = false;

    for (const ministro of matchingMinisters) {
      const subs = (ministro as any).pushSubscriptions || [];
      if (subs.length === 0) continue;

      const payload = JSON.stringify({ title, body, url });
      const activeSubs: any[] = [];

      for (const sub of subs) {
        let actualSub = sub;
        if (sub && typeof sub === 'object' && 'subscription' in sub) {
          actualSub = sub.subscription;
        }

        try {
          // Set TTL to 4 hours (14400 seconds)
          await webpush.sendNotification(actualSub, payload, { TTL: 14400 });
          activeSubs.push(sub);
        } catch (error: any) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`[PUSH] Subscription for ${ministro.nome} expired (${error.statusCode} ${error.message || 'Gone'}), removing from database.`);
            dbUpdated = true;
          } else {
            console.error(`[PUSH] Failed to send push to sub of ${ministro.nome}:`, error.statusCode || error, error.message);
            activeSubs.push(sub);
          }
        }
      }

      if (activeSubs.length !== subs.length) {
        (ministro as any).pushSubscriptions = activeSubs;
        dbUpdated = true;
      }
    }

    if (dbUpdated) {
      await db.write();
    }
  } catch (err) {
    console.error('[PUSH] Error in sendPushNotificationToParoquia:', err);
  }
}

async function runMigrations(skipRead: boolean = false) {
  try {
    if (!skipRead) {
      await db.read();
    }
    let changed = false;
    if (db.data) {
      // 1. Parish Name Migration - Normalize to "Paróquia Santa Rita de Cássia"
      if (db.data.ministros) {
        db.data.ministros.forEach(m => {
          if (m.paroquia === 'Santa Rita de Cássia - Bauru/SP' || m.paroquia === 'Santa Rita de Cássia') {
            m.paroquia = 'Paróquia Santa Rita de Cássia';
            changed = true;
          }
        });
      }
      
      // 1.5. Migrate parish status
      if (db.data.paroquias) {
        db.data.paroquias.forEach(p => {
          if (p.status === undefined) {
            p.status = p.bloqueada ? 'bloqueado' : 'ativo';
            delete p.bloqueada;
            changed = true;
          }
        });
      }

      if (db.data.paroquias) {
        const targetName = 'Paróquia Santa Rita de Cássia';
        const oldNames = ['Santa Rita de Cássia - Bauru/SP', 'Santa Rita de Cássia'];
        
        let targetExists = db.data.paroquias.some(p => p.nome === targetName);
        
        db.data.paroquias.forEach(p => {
          if (oldNames.includes(p.nome)) {
            if (!targetExists) {
              p.nome = targetName;
              targetExists = true;
              changed = true;
            } else {
              // Delete duplicate if it exists
              db.data.paroquias = db.data.paroquias.filter(item => item !== p);
              changed = true;
            }
          }
        });
      }

      // 2. Trim parish names across all collections
      const collectionsToTrim = ['ministros', 'paroquias', 'disponibilidades', 'missasTemporarias'];
      collectionsToTrim.forEach(coll => {
        if (db.data && (db.data as any)[coll]) {
          (db.data as any)[coll].forEach((item: any) => {
            const field = coll === 'paroquias' ? 'nome' : 'paroquia';
            if (item[field] && item[field] !== item[field].trim()) {
              item[field] = item[field].trim();
              changed = true;
            }
          });
        }
      });

      if (db.data.escalaGerada) {
        const newEscala: any = {};
        let escalaChanged = false;
        Object.keys(db.data.escalaGerada).forEach(key => {
          const trimmedKey = key.trim();
          if (trimmedKey !== key) {
             newEscala[trimmedKey] = { ...(newEscala[trimmedKey] || {}), ...db.data.escalaGerada[key] };
             escalaChanged = true;
          } else {
             newEscala[key] = db.data.escalaGerada[key];
          }
        });
        if (escalaChanged) {
          db.data.escalaGerada = newEscala;
          changed = true;
        }
      }

      // 3. Move root-level date keys to Paróquia Santa Rita de Cássia
      if (db.data.escalaGerada) {
        const rootKeys = Object.keys(db.data.escalaGerada);
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const defaultParoquia = 'Paróquia Santa Rita de Cássia';
        
        if (rootKeys.some(k => dateRegex.test(k))) {
          if (!db.data.escalaGerada[defaultParoquia]) {
            db.data.escalaGerada[defaultParoquia] = {};
          }
          rootKeys.forEach(key => {
            if (dateRegex.test(key)) {
              if (db.data.escalaGerada[defaultParoquia][key]) {
                db.data.escalaGerada[defaultParoquia][key] = {
                  ...db.data.escalaGerada[defaultParoquia][key],
                  ...db.data.escalaGerada[key]
                };
              } else {
                db.data.escalaGerada[defaultParoquia][key] = db.data.escalaGerada[key];
              }
              delete db.data.escalaGerada[key];
              changed = true;
            }
          });
        }
      }

      // 4. Rename "Missa de Cura e Libertação" -> "Missa com Benção do Santíssimo"
      const collectionsToCheckMissa = ['disponibilidades', 'missasTemporarias'];
      collectionsToCheckMissa.forEach(coll => {
        if (db.data && (db.data as any)[coll]) {
          (db.data as any)[coll].forEach((item: any) => {
            const field = coll === 'disponibilidades' ? 'nomeMissa' : 'nome';
            if (item[field] && item[field].includes('Cura')) {
              item[field] = 'Missa com Benção do Santíssimo';
              changed = true;
            }
          });
        }
      });
      if (db.data.escalaGerada) {
        Object.keys(db.data.escalaGerada).forEach(data => {
          if (typeof db.data.escalaGerada[data] === 'object') {
            Object.keys(db.data.escalaGerada[data]).forEach(horario => {
              const missa = db.data.escalaGerada[data][horario];
              if (missa && missa.nome && missa.nome.includes('Cura')) {
                missa.nome = 'Missa com Benção do Santíssimo';
                changed = true;
              }
            });
          }
        });
      }
      if (db.data.mensagens) {
        db.data.mensagens.forEach(m => {
          if (m.texto && m.texto.includes('Cura')) {
            m.texto = m.texto.replace(/Cura e Libertação/g, 'Benção do Santíssimo');
            changed = true;
          }
        });
      }
      // 5. Default Availability Schedule Migration
      if (db.data.config) {
        if (!db.data.config.diaAbertura) {
          db.data.config.diaAbertura = 20;
          changed = true;
        }
        if (!db.data.config.horaAbertura) {
          db.data.config.horaAbertura = '06:00';
          changed = true;
        }
        if (!db.data.config.diaFechamento) {
          db.data.config.diaFechamento = 30;
          changed = true;
        }
        if (!db.data.config.horaFechamento) {
          db.data.config.horaFechamento = '23:59';
          changed = true;
        }
      }

      // 6. Heal missing paroquias of registered ministers
      if (db.data.ministros) {
        db.data.ministros.forEach(m => {
          if (!m.paroquia) {
            // Let's try to infer from spouse
            if (m.nomeConjuge) {
              const spouse = db.data.ministros.find(s => 
                s.paroquia && (
                  (s.nome && s.nome.toLowerCase().includes(m.nomeConjuge.toLowerCase())) ||
                  (s.nomeConjuge && s.nomeConjuge.toLowerCase().includes(m.nome.toLowerCase())) ||
                  (m.telefoneConjuge && s.telefone && s.telefone.replace(/\D/g, '') === m.telefoneConjuge.replace(/\D/g, ''))
                )
              );
              if (spouse) {
                m.paroquia = spouse.paroquia;
                changed = true;
                console.log(`[HEAL] Copied paroquia '${m.paroquia}' for ${m.nome} from spouse ${spouse.nome}`);
              }
            }
            // If still no paroquia, let's default to the main paroquia 'Paróquia Santa Rita de Cássia'
            if (!m.paroquia) {
              m.paroquia = 'Paróquia Santa Rita de Cássia';
              changed = true;
              console.log(`[HEAL] Assigned default paroquia '${m.paroquia}' for ${m.nome}`);
            }
          }
        });
      }

      // 7. Auto-create/sync missing coordinator accounts for existing paróquias
      if (db.data.paroquias) {
        db.data.paroquias.forEach(p => {
          const { coordenador, telefoneCoordenador, nome } = p;
          if (coordenador && telefoneCoordenador && nome) {
            if (!db.data.ministros) db.data.ministros = [];
            
            const clean = (num: string) => num ? num.replace(/\D/g, '') : '';
            const cleanTel = clean(telefoneCoordenador);
            
            if (cleanTel) {
              const existing = db.data.ministros.find(m => clean(m.telefone) === cleanTel || (m.telefoneConjuge && clean(m.telefoneConjuge) === cleanTel));
              
              if (existing) {
                if (existing.role !== 'coordenacao' || existing.paroquia !== nome || !existing.aprovado) {
                  if (existing.role !== 'admin') existing.role = 'coordenacao';
                  existing.aprovado = true;
                  existing.paroquia = nome;
                  changed = true;
                  console.log(`[COORD-SYNC] Found existing minister ${existing.nome} with matching phone ${telefoneCoordenador}, elevated to coordinator for '${nome}'`);
                }
              } else {
                const novoId = (db.data.ministros.length > 0) ? Math.max(...db.data.ministros.map(m => m.id)) + 1 : 1;
                db.data.ministros.push({
                  id: novoId,
                  nome: coordenador,
                  nomeExibicao: coordenador,
                  telefone: telefoneCoordenador,
                  paroquia: nome,
                  senha: '123456', // senha padrão para acesso inicial
                  tipo: 'individual',
                  role: 'coordenacao',
                  acessoCoordenacao: 'casal',
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

      // 8. Surgical Fix for June 2026 names (User Request)
      if (db.data.escalaGerada) {
          const eg = db.data.escalaGerada;
          Object.keys(eg).forEach(par => {
              const escala = eg[par];
              if (!escala || typeof escala !== 'object') return;

              // Sábado, 6 de junho às 17:00
              if (escala['2026-06-06'] && escala['2026-06-06']['17:00']) {
                  const slot = escala['2026-06-06']['17:00'];
                  const before = JSON.stringify(slot.ministros);
                  slot.ministros = slot.ministros.map((m: string) => {
                      const lower = m.toLowerCase();
                      // Captura "Valter e Sônia", "Valter e Sõnia", "Valter/Sônia", etc.
                      if (lower.includes('valter') && (lower.includes('sonia') || lower.includes('sônia') || lower.includes('sõnia'))) {
                          return 'Sônia';
                      }
                      return m;
                  });
                  slot.ministros = Array.from(new Set(slot.ministros));
                  if (before !== JSON.stringify(slot.ministros)) {
                      changed = true;
                      console.log(`[SURGICAL-FIX] Updated 2026-06-06 17:00 in ${par}`);
                  }
              }

              // Domingo, 7 de junho às 10:00
              if (escala['2026-06-07'] && escala['2026-06-07']['10:00']) {
                  const slot = escala['2026-06-07']['10:00'];
                  const before = JSON.stringify(slot.ministros);
                  slot.ministros = slot.ministros.map((m: string) => {
                      if (m === 'Sônia' || m === 'Sõnia') return 'Cristiane';
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

      // 9. Push Subscription Sanitization & Reminder Message Isolation
      if (db.data.ministros) {
        // Collect seen endpoints to ensure one subscription per physical device
        const seenEndpoints = new Map<string, string>(); // endpoint -> cleanPhone
        
        db.data.ministros.forEach(m => {
          const anyM = m as any;
          if (Array.isArray(anyM.pushSubscriptions)) {
            const cleanMPrimary = m.telefone ? String(m.telefone).replace(/\D/g, '') : '';
            const cleanMConjuge = m.telefoneConjuge ? String(m.telefoneConjuge).replace(/\D/g, '') : '';
            const validPhones = [cleanMPrimary, cleanMConjuge].filter(Boolean);

            const filteredSubs: any[] = [];
            for (const item of anyM.pushSubscriptions) {
              const actualSub = (item && item.subscription) ? item.subscription : item;
              const itemPhone = (item && item.telefone) ? String(item.telefone).replace(/\D/g, '') : cleanMPrimary;

              if (actualSub && actualSub.endpoint) {
                // Subscription must belong to this minister's phone numbers
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

      // Clean up orphaned or invalid reminder messages from DB
      if (db.data.mensagens && Array.isArray(db.data.mensagens)) {
        const beforeCount = db.data.mensagens.length;
        db.data.mensagens = db.data.mensagens.filter(msg => {
          const isReminder = msg.texto && (
            msg.texto.includes('Lembrete de Escala') ||
            msg.texto.includes('Lembrete de Líder') ||
            msg.texto.includes('Lembrete Diário') ||
            msg.texto.includes('Lembrete Próximo') ||
            msg.texto.includes('você está escalado') ||
            msg.texto.includes('Você é o LÍDER')
          );
          if (isReminder) {
            const cleanTel = msg.destinatario_telefone ? String(msg.destinatario_telefone).replace(/\D/g, '') : '';
            if (!cleanTel) return false; // Purge reminder without target phone
          }
          return true;
        });
        if (db.data.mensagens.length !== beforeCount) {
          changed = true;
        }
      }
    }
    
    if (changed) {
      await db.write();
      console.log('System: Migrations applied successfully.');
      logDebug('System: Migrations applied successfully.');
    }
  } catch (e) {
    console.error('Migration error:', e);
    logDebug(`Migration error: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function enviarLembretesAutomaticos(paroquia: string) {
  try {
    await db.read();
    const config = (db.data.config || {}) as any;
    if (!config.lembreteAutomaticoPorParoquia) {
      config.lembreteAutomaticoPorParoquia = {};
    }
    const automaticoEnabled = config.lembreteAutomaticoPorParoquia[paroquia] === true;
    if (!automaticoEnabled) return;

    if (!db.data.escalaGerada || !db.data.escalaGerada[paroquia]) return;

    const nowMs = Date.now();
    let dbUpdated = false;

    if (!db.data.mensagens) db.data.mensagens = [];

    const paroquiaEscala = db.data.escalaGerada[paroquia];

    // Scan all scheduled dates in the parish scale
    for (const dataStr of Object.keys(paroquiaEscala)) {
      const slotsNoDia = paroquiaEscala[dataStr];
      if (!slotsNoDia) continue;

      for (const horario of Object.keys(slotsNoDia)) {
        const missa = slotsNoDia[horario];
        if (!missa || !missa.ministros || !Array.isArray(missa.ministros) || missa.ministros.length === 0) continue;

        const cleanHorario = horario.trim();
        const timeParts = cleanHorario.split(':');
        if (timeParts.length < 2) continue;
        const hStr = timeParts[0].padStart(2, '0');
        const mStr = timeParts[1].padStart(2, '0');

        // Construct exact Date timestamp of the Mass in America/Sao_Paulo (UTC-3)
        const massISOStr = `${dataStr}T${hStr}:${mStr}:00-03:00`;
        const massDate = new Date(massISOStr);
        const massTimeMs = massDate.getTime();

        if (isNaN(massTimeMs)) continue;

        const ms24h = 24 * 60 * 60 * 1000;
        const ms3h = 3 * 60 * 60 * 1000;

        const time24hStart = massTimeMs - ms24h;
        const time3hStart = massTimeMs - ms3h;

        // Target:
        // 1. 24h reminder: sent between 24h and 23h before Mass (within 1 hour slot)
        // 2. 3h reminder: sent between 3h and 2h before Mass (within 1 hour slot)
        // Avoid sending any broad notifications at night or outside these narrow windows.
        const is24hWindow = (nowMs >= massTimeMs - ms24h) && (nowMs < massTimeMs - (ms24h - 60 * 60 * 1000));
        const is3hWindow = (nowMs >= massTimeMs - ms3h) && (nowMs < massTimeMs - (ms3h - 60 * 60 * 1000));

        if (is24hWindow || is3hWindow) {
          for (const escMin of missa.ministros) {
            const matchResult = findMinistroByNomeOrId(escMin, paroquia);
            if (!matchResult || matchResult.targetPhones.length === 0) continue;

            const { ministro, targetPhones } = matchResult;
            const nomeEscala = (typeof escMin === 'object' && escMin !== null) ? (escMin.nome || '') : String(escMin);
            const dateBr = dataStr.split('-').reverse().join('/');

            const isEleLider = Boolean(ministro.isLider || ministro.role === 'coordenacao' || ministro.role === 'vice_coordenacao' || ministro.role === 'admin');
            const isElaLider = Boolean(ministro.isLiderConjuge || ministro.role === 'coordenacao' || ministro.role === 'vice_coordenacao' || ministro.role === 'admin');
            const rawLider = typeof missa.lider === 'object' && missa.lider !== null ? (missa.lider.nome || '') : String(missa.lider || '');
            const isLiderValid = rawLider && rawLider !== 'Não definido' && rawLider !== 'Líder da Missa' && rawLider !== 'Coordenação';
            
            let isLider = false;
            if (isLiderValid) {
              if (typeof missa.lider === 'object' && missa.lider !== null && missa.lider.id && String(missa.lider.id) === String(ministro.id)) {
                isLider = isEleLider || isElaLider;
              } else {
                const normL = normalize(rawLider);
                if (normL === normalize(nomeEscala)) {
                  isLider = isEleLider || isElaLider;
                } else if (normL === normalize(ministro.nome || '') || normL === normalize(ministro.nomeExibicao || '')) {
                  isLider = isEleLider;
                } else if (normL === normalize(ministro.nomeConjuge || '') || normL === normalize(ministro.nomeExibicaoConjuge || '')) {
                  isLider = isElaLider;
                }
              }
            }

            // 1. Process 24h Reminder (sent ~24h before mass)
            if (is24hWindow) {
              for (const phone of targetPhones) {
                const jaNotificado24h = db.data.mensagens.some(msg => 
                  msg.type === 'private' && 
                  String(msg.destinatario_telefone).replace(/\D/g, '') === phone &&
                  msg.texto.includes(dateBr) &&
                  msg.texto.includes(cleanHorario) &&
                  (msg.texto.includes('24h') || msg.texto.includes('24 horas'))
                );

                if (!jaNotificado24h) {
                  const msgTexto24h = isLider
                    ? `Olá, ${nomeEscala}! Lembrete de Escala (24h): Você é o LÍDER da missa das ${cleanHorario}h (${dateBr} - ${missa.nome || 'Missa'}). Lembre-se de chegar com antecedência para conferir alfaias e a equipe. Contamos com a sua presença! Amém.`
                    : `Olá, ${nomeEscala}! Lembrete de Escala (24h): você está escalado para a missa das ${cleanHorario}h (${dateBr} - ${missa.nome || 'Missa'}). Contamos com a sua presença! Amém.`;

                  db.data.mensagens.push({
                    id: Date.now() + Math.floor(Math.random() * 1000),
                    nome: 'Sistema de Lembretes',
                    telefone: '00000000000',
                    destinatario_telefone: phone,
                    texto: msgTexto24h,
                    paroquia: paroquia,
                    type: 'private',
                    data: new Date().toISOString()
                  });
                  dbUpdated = true;

                  sendPushNotificationToUser(phone, isLider ? 'Lembrete de Líder (24h) ⭐' : 'Lembrete de Escala (24h) 📅', msgTexto24h, '/', paroquia);
                }
              }
            }

            // 2. Process 3h Reminder (sent ~3h before mass)
            if (is3hWindow) {
              for (const phone of targetPhones) {
                const jaNotificado3h = db.data.mensagens.some(msg => 
                  msg.type === 'private' && 
                  String(msg.destinatario_telefone).replace(/\D/g, '') === phone &&
                  msg.texto.includes(dateBr) &&
                  msg.texto.includes(cleanHorario) &&
                  (msg.texto.includes('3h') || msg.texto.includes('3 horas'))
                );

                if (!jaNotificado3h) {
                  const msgTexto3h = isLider
                    ? `Olá, ${nomeEscala}! Lembrete Próximo (3h): Você é o LÍDER da missa HOJE em 3 horas, às ${cleanHorario}h (${dateBr} - ${missa.nome || 'Missa'}). Lembre-se de chegar com antecedência para conferir alfaias e a equipe. Que Deus abençoe seu servir! Amém.`
                    : `Olá, ${nomeEscala}! Lembrete Próximo (3h): sua missa é HOJE em 3 horas, às ${cleanHorario}h (${dateBr} - ${missa.nome || 'Missa'}). Que Deus abençoe seu servir! Amém.`;

                  db.data.mensagens.push({
                    id: Date.now() + Math.floor(Math.random() * 1000),
                    nome: 'Sistema de Lembretes',
                    telefone: '00000000000',
                    destinatario_telefone: phone,
                    texto: msgTexto3h,
                    paroquia: paroquia,
                    type: 'private',
                    data: new Date().toISOString()
                  });
                  dbUpdated = true;

                  sendPushNotificationToUser(phone, isLider ? 'Lembrete de Líder (3h) ⭐' : 'Lembrete de Escala (3h) 🔔', msgTexto3h, '/', paroquia);
                }
              }
            }
          }
        }
      }
    }

    if (dbUpdated) {
      await db.write();
      console.log(`[Lembrete Automático] Mensagens de lembrete geradas para paróquia: ${paroquia}`);
    }
  } catch (error) {
    console.error('Erro ao enviar lembretes automáticos:', error);
  }
}

async function triggerAllBackgroundReminders() {
  try {
    await db.read();
    if (!db.data || !db.data.config) return;
    const config = db.data.config as any;
    if (config.lembreteAutomaticoPorParoquia) {
      for (const paroquia of Object.keys(config.lembreteAutomaticoPorParoquia)) {
        if (config.lembreteAutomaticoPorParoquia[paroquia] === true) {
          console.log(`[BACKGROUND LEMBRETE] Executing background reminders for paróquia: ${paroquia}`);
          try {
            await enviarLembretesAutomaticos(paroquia);
          } catch (err) {
            console.error(`[BACKGROUND LEMBRETE] Error sending reminders for ${paroquia}:`, err);
          }
        }
      }
    }
  } catch (err) {
    console.error('[BACKGROUND LEMBRETE] Error running background reminders task:', err);
  }
}

async function startServer() {
  await setupDatabase();
  await initVapidKeys();
  
  // Emergency Recovery from chat data
  try {
    const fs = await import('fs');
    const path = await import('path');
    const restorePath = path.join(process.cwd(), 'restore_data.json');
    
    await db.read();
    
    // Forçamos a restauração se o arquivo existir para garantir os dados do chat
    if (fs.existsSync(restorePath)) {
       console.log('[RECOVERY] Encontrado restore_data.json. Aplicando dados...');
       const jsonData = JSON.parse(fs.readFileSync(restorePath, 'utf8'));
       
       // Garantimos a união dos dados novos sobre os antigos
       db.data = {
         ...db.data,
         ...jsonData,
         ministros: jsonData.ministros || db.data.ministros,
         config: { ...db.data.config, ...jsonData.config }
       };
       
       await db.write();
       console.log('[RECOVERY] Dados restaurados com sucesso do arquivo.');
       
       try {
         fs.renameSync(restorePath, restorePath + '.applied');
         console.log('[RECOVERY] Arquivo restore_data.json renomeado para .applied com sucesso.');
       } catch (renameErr: any) {
         console.error('[RECOVERY] Erro ao renomear arquivo restore_data.json:', renameErr);
       }
    }
    
    // Check if recovery is still needed (critical accounts)
    const cleanPhone = (phone: string | null | undefined) => phone ? phone.replace(/\D/g, '') : '';
    const alex = db.data.ministros?.find(m => m.id === 1 || (m.telefone && cleanPhone(m.telefone) === '14997865806'));
    
    // Check if we need to initialize standard accounts (only if they are completely missing)
    if (!alex) {
       console.log('[RECOVERY] Alexandre account missing. Initializing standard accounts...');
       if (!db.data.ministros) db.data.ministros = [];
       
       const criticalMinistros = [
         { id: 1, nome: 'Alexandre', telefone: '(14) 99786-5806', senha: '888', role: 'coordenacao', aprovado: true, paroquia: 'Paróquia Santa Rita de Cássia', tipo: 'casal' },
         { id: 43, nome: 'Josué', telefone: '(14) 99999-9999', senha: '111', role: 'coordenacao', aprovado: true, paroquia: 'Paróquia São Cristóvão', tipo: 'individual' },
         { id: 47, nome: 'Ministro', telefone: '(14) 98888-8888', senha: '888', role: 'coordenacao', aprovado: true, paroquia: 'Paróquia Teste', tipo: 'individual' }
       ];

       criticalMinistros.forEach(cm => {
          const existing = db.data.ministros.find(m => m.id === cm.id || (m.telefone && cleanPhone(m.telefone) === cleanPhone(cm.telefone)));
         if (!existing) {
           db.data.ministros.push(cm as any);
         }
       });

       if (!db.data.config) db.data.config = {} as any;
       if (!db.data.config.adminPassword) {
         db.data.config.adminPassword = 'Aqamnsqa081%';
       }
       await db.write();
       console.log('[RECOVERY] Contas críticas garantidas.');
    }

    // Force safety fix: Ensure any coordinator has role 'coordenacao' and NOT 'admin'.
    // ONLY the physical "Admin" login (Name="admin" and adminPassword) has admin role.
    let changedAny = false;
    if (db.data.ministros) {
      db.data.ministros.forEach(m => {
        if (m.role === 'admin') {
          m.role = 'coordenacao';
          console.log(`[SECURITY] Forçado role 'coordenacao' para o usuário ${m.nome} que estava como 'admin'.`);
          changedAny = true;
        }
      });
    }
    if (changedAny) {
      await db.write();
    }

     // Deduplicate any duplicate entries with same phone number
     if (db.data.ministros && db.data.ministros.length > 0) {
       const seenCleanPhones = new Set<string>();
       const uniqueMinistros: any[] = [];
       let duplicateFoundAndCleared = false;
       
       const groupedByPhone: Record<string, any[]> = {};
       db.data.ministros.forEach(m => {
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
           // We have duplicates! Let's merge them.
           // Sort by priority: prefer those with id === 1 or those with more characters in names
           list.sort((a,b) => {
             if (a.id === 1) return -1;
             if (b.id === 1) return 1;
             const aLen = (a.nome || '').length + (a.nomeConjuge || '').length;
             const bLen = (b.nome || '').length + (b.nomeConjuge || '').length;
             return bLen - aLen; // Descending by name lengths
           });

           const primary = list[0];
           // Merge fields from other records in the list to the primary
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
         db.data.ministros = uniqueMinistros;
         await db.write();
         console.log('[RECOVERY] Duplicidade de telefones limpa e mesclada com sucesso!');
       }
     }

  } catch (e) {
    console.error('[RECOVERY] Erro durante recuperação:', e);
  }

  console.log(`[SERVER] Banco de dados carregado. Ministros: ${db.data?.ministros?.length || 0}`);
  logDebug(`[SERVER] Banco de dados carregado. Ministros: ${db.data?.ministros?.length || 0}`);

  // Task: Clear availability and old schedules
  setInterval(async () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonthStr = todayStr.substring(0, 7); // "YYYY-MM"

    try {
      await db.read();
      if (!db.data) return;
      
      let changed = false;

      // 1. Clear availability on the 20th (only for months prior to the current month)
      if (now.getDate() === 20) {
        if (!db.data.config) {
          db.data.config = { 
            coordinatorEnabled: false, 
            escalaPublicada: false, 
            disponibilidadeAberta: false, 
            disponibilidadeAbertaPorParoquia: {} 
          };
        }
        
        const lastRun = db.data.config.lastClearAvailabilityDate;
        
        if (lastRun !== todayStr) {
          console.log('[Cleanup] Clearing availability for past months...');
          const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          
          const beforeCount = (db.data.disponibilidades || []).length;
          db.data.disponibilidades = (db.data.disponibilidades || []).filter(d => {
            const dispMonth = d.data.substring(0, 7);
            return dispMonth >= currentMonthStr;
          });
          const afterCount = db.data.disponibilidades.length;
          
          db.data.config.lastClearAvailabilityDate = todayStr;
          changed = true;
          console.log(`[Cleanup] Availability cleared. ${beforeCount - afterCount} records removed.`);
        }
      }

      // 2. Clear old scales (New logic: available until last day 23:59)
      // Any month before the current month is considered "previous and expired"
      if (db.data.escalaGerada) {
        Object.keys(db.data.escalaGerada).forEach(paroquia => {
          const paroquiaEscala = db.data.escalaGerada[paroquia];
          if (paroquiaEscala && typeof paroquiaEscala === 'object') {
            const dates = Object.keys(paroquiaEscala);
            let paroquiaChanged = false;
            
            dates.forEach(dateKey => {
              // Format is YYYY-MM-DD
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

      // 3. Auto-lock parishes in test mode
      if (db.data.paroquias) {
        db.data.paroquias.forEach(p => {
          if (p.status === 'testes' && p.dataBloqueio) {
            if (todayStr >= p.dataBloqueio) {
              p.status = 'bloqueado';
              changed = true;
              console.log(`[Cleanup] Parish ${p.nome} auto-locked due to date expiration.`);
            }
          }
        });
      }

      // 4. Initialize required collections
      if (!db.data.estoque) {
        db.data.estoque = [];
        changed = true;
      }
      if (!db.data.estoqueMovimentacoes) {
        db.data.estoqueMovimentacoes = [];
        changed = true;
      }

      if (changed) {
        await db.write();
        console.log('[Cleanup] Database updated with cleaned records.');
      }
    } catch (err) {
      console.error('[Cleanup] Error during periodic cleanup:', err);
    }
  }, 1000 * 60 * 60); // Check every hour

  // Performance Optimized Migrations
  await runMigrations();

  logDebug('[SERVER] Migrações concluídas. Iniciando Express...');
  const app = express();
  logDebug('[SERVER] Express instanciado.');
  const PORT = 3000;

  // Global Request arrival log (most urgent)
  app.use((req, res, next) => {
    next();
  });

  // API ROUTES - Must be defined first
  app.get('/api/test-route', (req, res) => {
    res.status(200).send('Test route working');
  });

  app.get('/api/keep-alive', (req, res) => {
    res.status(200).send('OK');
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Middleware: Request logger
  app.use((req, res, next) => {
    next();
  });

  // Add 404 logger
  app.use((req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode === 404) {
        console.log(`[DEBUG] 404 Not Found: ${req.method} ${req.path}`);
      }
    });
    next();
  });

  // Middleware: CORS
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-fidelis-token, Accept, Origin');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Middleware: JSON/URL Encoded
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Helper: check if user is Alexandre Borelli Facchini or Admin (exempt from maintenance blocks)
  const isAlexandreOrAdmin = (userOrPhoneOrName: any) => {
    if (!userOrPhoneOrName) return false;
    if (typeof userOrPhoneOrName === 'string') {
      const raw = userOrPhoneOrName;
      const digits = raw.replace(/\D/g, '');
      if (digits.endsWith('14997865806') || digits === '14997865806') return true;
      const norm = raw.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (norm.includes('alexandre borelli facchini') || norm.includes('alexandre facchini') || norm === 'admin' || norm === 'alexandre') return true;
      if (norm.includes('alex.facchini1@gmail.com')) return true;
      return false;
    }
    const u = userOrPhoneOrName;
    if (u.role === 'admin') return true;
    const cleanP = (p: any) => (p || '').replace(/\D/g, '');
    const phones = [
      cleanP(u.telefone),
      cleanP(u.telefoneConjuge),
      cleanP(u.loginPhone),
      cleanP(u.phone)
    ];
    if (phones.some((p: string) => p.endsWith('14997865806') || p === '14997865806')) return true;
    const normalizeStr = (s: any) => (s || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const names = [
      normalizeStr(u.nome),
      normalizeStr(u.nomeExibicao),
      normalizeStr(u.nomeConjuge),
      normalizeStr(u.nomeExibicaoConjuge),
      normalizeStr(u.loggedInName)
    ];
    if (names.some((n: string) => n.includes('alexandre borelli facchini') || n.includes('alexandre facchini') || n === 'alexandre')) return true;
    if (u.email && normalizeStr(u.email).includes('alex.facchini1@gmail.com')) return true;
    return false;
  };

  // Middleware: Maintenance Mode
  app.use((req, res, next) => {
    // 1. Only act on API requests
    if (!req.path.startsWith('/api/')) {
      return next();
    }

    // 2. Always allow health checks
    if (req.path === '/api/health' || req.path === '/api/keep-alive' || req.path === '/api/test-route' || req.path === '/api/liturgia') {
      return next();
    }
    
    // 3. Maintenance mode logic
    const maintenanceActive = db.data?.config?.modoManutencao === true;
    if (maintenanceActive) {
      console.log(`[DEBUG] Maintenance mode active, checking access for: ${req.path}`);
      
      const userHeaderPhone = (req.headers['x-user-phone'] as string) || '';
      const userHeaderName = (req.headers['x-user-name'] as string) || '';
      const userHeaderEmail = (req.headers['x-user-email'] as string) || '';
      const queryPhone = (req.query.userPhone as string) || (req.query.telefone as string) || '';
      const queryName = (req.query.userName as string) || (req.query.nome as string) || '';
      const queryEmail = (req.query.userEmail as string) || (req.query.email as string) || '';

      const isExempt = 
        isAlexandreOrAdmin(userHeaderPhone) ||
        isAlexandreOrAdmin(userHeaderName) ||
        isAlexandreOrAdmin(userHeaderEmail) ||
        isAlexandreOrAdmin(queryPhone) ||
        isAlexandreOrAdmin(queryName) ||
        isAlexandreOrAdmin(queryEmail) ||
        (req.body && (isAlexandreOrAdmin(req.body.telefone) || isAlexandreOrAdmin(req.body.nome) || isAlexandreOrAdmin(req.body.user) || isAlexandreOrAdmin(req.body.email)));

      const allowedPaths = [
        '/api/config',
        '/api/admin/login',
        '/api/login',
        '/api/paroquias',
        '/api/debug/db-state',
        '/api/debug/logs',
        '/api/health',
        '/api/keep-alive',
        '/api/test-route',
        '/api/liturgia'
      ];
      
      const isAllowed = isExempt || allowedPaths.some(p => req.path === p || req.path === p + '/') || req.path.startsWith('/api/admin/');
      
      if (!isAllowed) {
        console.log(`[DEBUG] Maintenance blocking request to: ${req.path}`);
        return res.status(503).json({
          error: 'O sistema está temporariamente em manutenção preventiva.'
        });
      }
    }
    next();
  });

  // API ROUTES
  // (Moved to top)

  const publicPath = path.resolve(process.cwd(), 'public');
  app.use(express.static(publicPath));

  // Explicit download routes with correct headers
  const serveFile = (filename: string, res: express.Response) => {
    const filePath = path.join(publicPath, filename);
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'image/jpeg');
      return res.sendFile(filePath);
    }
    return res.status(404).send('Arquivo não encontrado');
  };

  app.get('/dl/banner', (req, res) => serveFile('play_store_banner.jpg', res));
  app.get('/dl/recurso', (req, res) => serveFile('recurso_grafico_1024x500.jpg', res));
  app.get('/dl/graphic', (req, res) => serveFile('play_store_graphic_1024x500.jpg', res));

  app.get('/recurso_grafico_1024x500.jpg', (req, res) => res.sendFile(path.join(publicPath, 'recurso_grafico_1024x500.jpg')));
  app.get('/play_store_banner.jpg', (req, res) => res.sendFile(path.join(publicPath, 'play_store_banner.jpg')));

  app.get('/api/debug/db-state', async (req, res) => {
    try {
      await db.read();
      res.json({
        cwd: process.cwd(),
        ministrosCount: db.data?.ministros?.length || 0,
        paroquiasCount: db.data?.paroquias?.length || 0,
        config: db.data?.config,
        hasData: !!db.data
      });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao ler estado do banco: ' + err });
    }
  });

  app.get('/api/debug/logs', (req, res) => {
    try {
      if (fs.existsSync('debug.log')) {
        const logs = fs.readFileSync('debug.log', 'utf8');
        const lines = logs.split('\n').slice(-100);
        res.send(lines.join('\n'));
      } else {
        res.send('Arquivo debug.log não encontrado.');
      }
    } catch (err) {
      res.status(500).send('Erro ao ler logs: ' + err);
    }
  });

  app.get('/api/debug/firebase-config', (req, res) => {
    const config = {
      apiKey: process.env.VITE_FIREBASE_API_KEY ? 'Configurado (***)' : 'Não configurado',
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'Não configurado',
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'Não configurado',
      hasAppId: !!process.env.VITE_FIREBASE_APP_ID
    };
    res.json(config);
  });

  app.get('/api/debug/db', async (req, res) => {
    await db.read();
    res.json(db.data);
  });

  app.get('/api/push/public-key', async (req, res) => {
    try {
      await db.read();
      if (!db.data.config || !(db.data.config as any).vapidKeys) {
        await initVapidKeys();
      }
      res.json({ publicKey: (db.data.config as any).vapidKeys.publicKey });
    } catch (error) {
      console.error('Error fetching VAPID public key:', error);
      res.status(500).json({ error: 'Failed to fetch public key' });
    }
  });

  app.post('/api/push/subscribe', async (req, res) => {
    const { telefone, subscription } = req.body;
    if (!telefone || !subscription) {
      return res.status(400).json({ error: 'Telefone and subscription are required.' });
    }

    try {
      await db.read();
      if (!db.data || !db.data.ministros) {
        return res.status(500).json({ error: 'Server data not initialized.' });
      }

      let updated = false;

      const matchingMinisters = db.data.ministros.filter(m => {
        return matchPhones(m.telefone, telefone) || matchPhones(m.telefoneConjuge, telefone);
      });

      if (matchingMinisters.length === 0) {
        return res.status(404).json({ error: 'Minister not found for provided phone.' });
      }

      const cleanInputPhone = String(telefone).replace(/\D/g, '');

      // Remove this device subscription endpoint from all other ministers' accounts to avoid cross-notifications on shared devices
      db.data.ministros.forEach(m => {
        const anyM = m as any;
        if (Array.isArray(anyM.pushSubscriptions)) {
          const beforeLen = anyM.pushSubscriptions.length;
          anyM.pushSubscriptions = anyM.pushSubscriptions.filter((s: any) => {
            const sSub = (s && s.subscription) ? s.subscription : s;
            return sSub?.endpoint !== subscription.endpoint;
          });
          if (anyM.pushSubscriptions.length !== beforeLen) {
            updated = true;
          }
        }
      });

      for (const ministro of matchingMinisters) {
        const anyM = ministro as any;
        anyM.pushSubscriptions = anyM.pushSubscriptions || [];
        
        // Prevent duplicate subscriptions comparing the endpoint
        const exists = anyM.pushSubscriptions.some((s: any) => {
          const sSub = (s && s.subscription) ? s.subscription : s;
          return sSub && sSub.endpoint === subscription.endpoint;
        });

        if (!exists) {
          anyM.pushSubscriptions.push({
            telefone: cleanInputPhone,
            subscription: subscription
          });
          updated = true;
        } else {
          const idx = anyM.pushSubscriptions.findIndex((s: any) => {
            const sSub = (s && s.subscription) ? s.subscription : s;
            return sSub && sSub.endpoint === subscription.endpoint;
          });
          if (idx !== -1) {
            anyM.pushSubscriptions[idx] = {
              telefone: cleanInputPhone,
              subscription: subscription
            };
            updated = true;
          }
        }
      }

      if (updated) {
        await db.write();
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error subscribing to push:', error);
      res.status(500).json({ error: 'Failed to subscribe.' });
    }
  });

  app.get('/api/config', async (req, res) => {
    const { paroquia } = req.query;
    console.log(`[API CONFIG] Request received. Paróquia: ${paroquia}`);
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      await db.read();
      if (!db.data) {
        db.data = { ministros: [], disponibilidades: [], mensagens: [], config: { coordinatorEnabled: false, escalaPublicada: false, disponibilidadeAberta: false } };
      }
      const config = db.data.config || { 
        coordinatorEnabled: false, 
        escalaPublicada: false, 
        escalaPublicadaPorParoquia: {},
        disponibilidadeAberta: false, 
        disponibilidadeAbertaPorParoquia: {} 
      };
      
      // If paroquia is provided, return a merged config with parish-specific values
      if (paroquia) {
        const targetParoquia = String(paroquia).trim();
        const agendamento = config.agendamentoPorParoquia?.[targetParoquia] || {};
        
        // Calcular o status real para esta paróquia
        const { aberta } = getDisponibilidadeStatus(config, null, targetParoquia);

        const mergedConfig = {
          ...config,
          // Default to false if not explicitly set for this parish to avoid leaking global state
          escalaPublicada: config.escalaPublicadaPorParoquia?.[targetParoquia] ?? false,
          escalaPublicadaPorMes: config.escalaPublicadaPorMes?.[targetParoquia] || {},
          disponibilidadeAberta: aberta, // Agora usa o valor real (manual ou agendado)
          // Use parish-specific scheduling if available, otherwise return empty for isolation
          diaAbertura: agendamento.diaAbertura !== undefined ? agendamento.diaAbertura : '',
          horaAbertura: agendamento.horaAbertura !== undefined ? agendamento.horaAbertura : '',
          diaFechamento: agendamento.diaFechamento !== undefined ? agendamento.diaFechamento : '',
          horaFechamento: agendamento.horaFechamento !== undefined ? agendamento.horaFechamento : '',
          maxEscalacoes: config.limiteEscalacaoPorParoquia?.[targetParoquia] ?? 3,
          limiteNovos: config.limiteNovosPorMissaPorParoquia?.[targetParoquia] ?? 2,
          regraDisponibilidade: config.regraDisponibilidadePorParoquia?.[targetParoquia] ?? "regra2",
          lembreteAutomatico: config.lembreteAutomaticoPorParoquia?.[targetParoquia] ?? false
        };
        console.log(`[API CONFIG] Returning merged config for ${targetParoquia}`);
        const sanitizedMerged = { ...mergedConfig };
        delete (sanitizedMerged as any).adminPassword;
        return res.json(sanitizedMerged);
      }

      console.log(`[API CONFIG] Returning global config`);
      const sanitizedGlobal = { ...config };
      delete (sanitizedGlobal as any).adminPassword;
      res.json(sanitizedGlobal);
    } catch (error) {
      console.error(`[API CONFIG] Erro ao buscar config: ${error}`);
      res.status(500).json({ error: 'Erro interno do servidor ao buscar configurações.' });
    }
  });

  app.post('/api/config', async (req, res) => {
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
    
    await db.read();
    if (!db.data.config) db.data.config = { coordinatorEnabled: false, escalaPublicada: false, disponibilidadeAberta: false, disponibilidadeAbertaPorParoquia: {} };
    if (!db.data.config.disponibilidadeAbertaPorParoquia) db.data.config.disponibilidadeAbertaPorParoquia = {};
    if (!db.data.config.escalaPublicadaPorParoquia) db.data.config.escalaPublicadaPorParoquia = {};
    if (!db.data.config.escalaPublicadaPorMes) db.data.config.escalaPublicadaPorMes = {};
    if (!db.data.config.limiteEscalacaoPorParoquia) db.data.config.limiteEscalacaoPorParoquia = {};
    if (!db.data.config.limiteNovosPorMissaPorParoquia) db.data.config.limiteNovosPorMissaPorParoquia = {};
    if (!db.data.config.regraDisponibilidadePorParoquia) db.data.config.regraDisponibilidadePorParoquia = {};
    if (!db.data.config.lembreteAutomaticoPorParoquia) db.data.config.lembreteAutomaticoPorParoquia = {};
    
    if (modoManutencao !== undefined) {
      db.data.config.modoManutencao = modoManutencao;
    }

    if (targetParoquia && maxEscalacoes !== undefined) {
      db.data.config.limiteEscalacaoPorParoquia[targetParoquia] = maxEscalacoes === "libre" || maxEscalacoes === 99 || maxEscalacoes === "99" ? 99 : Number(maxEscalacoes);
    }

    if (targetParoquia && limiteNovos !== undefined) {
      db.data.config.limiteNovosPorMissaPorParoquia[targetParoquia] = limiteNovos;
    }

    if (targetParoquia && regraDisponibilidade !== undefined) {
      db.data.config.regraDisponibilidadePorParoquia[targetParoquia] = regraDisponibilidade;
    }
    
    if (targetParoquia && lembreteAutomatico !== undefined) {
      db.data.config.lembreteAutomaticoPorParoquia[targetParoquia] = lembreteAutomatico === true || lembreteAutomatico === "true";
    }
    
    if (coordinatorEnabled !== undefined) db.data.config.coordinatorEnabled = coordinatorEnabled;
    
    if (escalaPublicada !== undefined) {
      if (targetParoquia) {
        if (mesPublicado) {
          if (!db.data.config.escalaPublicadaPorMes[targetParoquia]) db.data.config.escalaPublicadaPorMes[targetParoquia] = {};
          db.data.config.escalaPublicadaPorMes[targetParoquia][mesPublicado] = escalaPublicada;
          // db.data.config.escalaPublicadaPorParoquia[targetParoquia] = false; // Removido para não esconder meses passados erradamente
        } else {
          db.data.config.escalaPublicadaPorParoquia[targetParoquia] = escalaPublicada;
          if (!escalaPublicada && db.data.config.escalaPublicadaPorMes[targetParoquia]) {
            db.data.config.escalaPublicadaPorMes[targetParoquia] = {};
          }
        }
      } else {
        db.data.config.escalaPublicada = escalaPublicada;
        if (!escalaPublicada) {
          db.data.config.escalaPublicadaPorParoquia = {};
          db.data.config.escalaPublicadaPorMes = {};
        }
      }
    }
    
    if (disponibilidadeAberta !== undefined) {
      if (targetParoquia) {
        if (disponibilidadeAberta === null) {
          delete db.data.config.disponibilidadeAbertaPorParoquia[targetParoquia];
        } else {
          const wasOpen = db.data.config.disponibilidadeAbertaPorParoquia[targetParoquia] === true;
          db.data.config.disponibilidadeAbertaPorParoquia[targetParoquia] = disponibilidadeAberta;
          
          const isOpeningNow = (disponibilidadeAberta === true && !wasOpen);
          
          // Se estiver abrindo disponibilidade ou for solicitado reset, limpa confirmações e disponibilidades antigas
          if (isOpeningNow || req.body.resetConfirmations === true) {
            db.data.ministros.forEach(m => {
              if (m.paroquia && String(m.paroquia).trim() === targetParoquia) {
                m.disponibilidadeConfirmada = false;
              }
            });

            const now = new Date();
            const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            const nextMonthStr = nextMonthDate.toISOString().substring(0, 7);
            
            db.data.disponibilidades = (db.data.disponibilidades || []).filter(d => {
              if (d.paroquia && String(d.paroquia).trim() !== targetParoquia) return true;
              const dispMonth = d.data.substring(0, 7);
              return dispMonth >= nextMonthStr;
            });
          }
        }
      } else {
        const wasOpen = db.data.config.disponibilidadeAberta === true;
        db.data.config.disponibilidadeAberta = disponibilidadeAberta;
        const isOpeningNow = (disponibilidadeAberta === true && !wasOpen);

        if (isOpeningNow || req.body.resetConfirmations === true) {
          db.data.ministros.forEach(m => {
            m.disponibilidadeConfirmada = false;
          });

          const now = new Date();
          const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          const nextMonthStr = nextMonthDate.toISOString().substring(0, 7);
          
          db.data.disponibilidades = (db.data.disponibilidades || []).filter(d => {
            const dispMonth = d.data.substring(0, 7);
            return dispMonth >= nextMonthStr;
          });
        }
      }
    }

    if (targetParoquia) {
      if (!db.data.config.agendamentoPorParoquia) db.data.config.agendamentoPorParoquia = {};
      if (!db.data.config.agendamentoPorParoquia[targetParoquia]) db.data.config.agendamentoPorParoquia[targetParoquia] = {};
      
      const agendamento = db.data.config.agendamentoPorParoquia[targetParoquia];
      if (diaAbertura !== undefined) agendamento.diaAbertura = Number(diaAbertura);
      if (horaAbertura !== undefined) agendamento.horaAbertura = horaAbertura;
      if (diaFechamento !== undefined) agendamento.diaFechamento = Number(diaFechamento);
      if (horaFechamento !== undefined) agendamento.horaFechamento = horaFechamento;
    } else {
      if (diaAbertura !== undefined) db.data.config.diaAbertura = diaAbertura;
      if (horaAbertura !== undefined) db.data.config.horaAbertura = horaAbertura;
      if (diaFechamento !== undefined) db.data.config.diaFechamento = diaFechamento;
      if (horaFechamento !== undefined) db.data.config.horaFechamento = horaFechamento;
    }
    
    await db.write();
    res.json({ message: 'Configuração salva com sucesso!' });
  });

  app.get('/api/backup', async (req, res) => {
    try {
      // Usar a mesma lógica do admin backup para garantir consistência
      const adapter = db.adapter as any;
      const latestData = await adapter.read(true);
      if (latestData) {
        db.data = latestData;
      }
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=backup_sistema.json');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.send(JSON.stringify(db.data, null, 2));
    } catch (error) {
      console.error('Erro ao gerar backup:', error);
      res.status(500).json({ error: 'Erro ao gerar backup.' });
    }
  });

  app.post('/api/login', async (req, res) => {
    const { nome, telefone, senha } = req.body;
    logDebug(`Tentativa de login: Nome=${nome}, Telefone=${telefone}, Senha=${senha}`);
    try {
      await db.read();
      logDebug(`Total de ministros no banco: ${db.data?.ministros?.length || 0}`);
      
      const cleanPhone = (phone: string | null | undefined) => {
        if (!phone) return '';
        let num = phone.replace(/\D/g, '');
        // Remove o código de país do Brasil (55) se estiver presente em números de 12 ou 13 dígitos
        if (num.startsWith('55') && (num.length === 12 || num.length === 13)) {
          num = num.substring(2);
        }
        return num;
      };

      const normalize = (s: any) => {
        if (typeof s !== "string") return "";
        return s
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/&/g, " e ")
          .replace(/\s+/g, " ")
          .trim();
      };

      const loginPhone = cleanPhone(telefone);
      console.log(`Telefone limpo para login: ${loginPhone}`);

      // Procura o ministro que corresponda ao telefone (comparando apenas dígitos sem o código de país 55)
      console.log('Ministros cadastrados (primeiros 5):', db.data.ministros.slice(0, 5).map(m => ({ nome: m.nome, telefone: m.telefone, telefoneConjuge: m.telefoneConjuge })));
      const ministro = db.data.ministros.find(m => 
        (m.telefone && cleanPhone(m.telefone) === loginPhone) || 
        (m.telefoneConjuge && cleanPhone(m.telefoneConjuge) === loginPhone)
      );
      
      if (!ministro) {
        logDebug(`Login falhou: Ministro não encontrado para o telefone ${loginPhone}`);
        const debugInfo = {
          loginPhone,
          totalMinistros: db.data.ministros.length,
          samplePhones: db.data.ministros.slice(0, 5).map(m => cleanPhone(m.telefone))
        };
        return res.status(401).json({ error: 'Telefone ou senha inválidos.', data: { debugInfo } });
      }
      logDebug(`Ministro encontrado: ${ministro.nome}`);

      // Verifica se o nome digitado corresponde ao nome de exibição ou nome principal (ou cônjuge), ignorando acentos e capitalização
      const inputNomeNormalized = normalize(nome);
      const isPrincipal = (ministro.nomeExibicao && normalize(ministro.nomeExibicao) === inputNomeNormalized) || 
                          (normalize(ministro.nome) === inputNomeNormalized);
      
      const isConjuge = (ministro.nomeExibicaoConjuge && normalize(ministro.nomeExibicaoConjuge) === inputNomeNormalized) || 
                        (normalize(ministro.nomeConjuge) === inputNomeNormalized);

      // Verificação de nome: o nome informado deve pertencer a este cadastro (seja titular ou cônjuge)
      if (!isPrincipal && !isConjuge) {
        logDebug(`Login falhou: Nome "${nome}" não corresponde ao cadastro para o telefone ${loginPhone}`);
        const debugInfo = {
          inputNomeNormalized,
          ministroNome: ministro.nome,
          ministroNomeConjuge: ministro.nomeConjuge,
          loginPhone
        };
        return res.status(401).json({ error: 'O nome informado não corresponde ao cadastro deste telefone.', data: { debugInfo } });
      }

      // Define se é o login do cônjuge ou do titular
      const isElaLogin = isConjuge && !isPrincipal;
      const isEleLogin = isPrincipal;

      // Validação de senha por usuário
      // Se corresponder ao cônjuge, usa a senha do cônjuge (ou a do titular como fallback).
      const senhaCorreta = isElaLogin ? (ministro.senhaConjuge || ministro.senha) : ministro.senha;

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
        senhaCorreta: senhaCorreta
      };

      console.log(`Login debug:`, debugInfo);
      logDebug(`Login debug: ${JSON.stringify(debugInfo)}`);

      if (senha !== senhaCorreta) {
        return res.status(401).json({ error: 'Telefone ou senha inválidos.', data: { debugInfo } });
      }

      // Bloqueio de manutenção preventiva: apenas Alexandre Borelli Facchini (14 997865806) e Admin têm acesso liberado
      const isMaintenance = db.data?.config?.modoManutencao === true;
      if (isMaintenance && !isAlexandreOrAdmin(ministro) && !isAlexandreOrAdmin(nome) && !isAlexandreOrAdmin(telefone)) {
        return res.status(503).json({
          error: 'O sistema está temporariamente em manutenção preventiva para atualizações. O acesso está pausado temporariamente.'
        });
      }

      if (ministro.aprovado === false) {
        return res.status(403).json({ error: 'Seu cadastro está pendente de aprovação pela Coordenação.' });
      }

      // NÃO INVERTEMOS MAIS OS DADOS. O objeto 'ministro' é retornado como está no banco.
      // Apenas adicionamos flags para o frontend saber quem está logado.
      let userResponse: any = { ...ministro };
      userResponse.isConjugeLogin = isElaLogin || (isConjuge && !isPrincipal);
      userResponse.loggedInName = userResponse.isConjugeLogin ? 
        (ministro.nomeExibicaoConjuge || ministro.nomeConjuge) : 
        (ministro.nomeExibicao || ministro.nome);
      
      // Determine role based on who is logging in and access settings
      let finalRole = ministro.role || 'ministro';
      if (['coordenacao', 'vice_coordenacao'].includes(finalRole) && ministro.tipo === 'casal') {
        const acesso = ministro.acessoCoordenacao || 'casal';
        if (acesso === 'ele' && userResponse.isConjugeLogin) finalRole = 'ministro';
        if (acesso === 'ela' && !userResponse.isConjugeLogin) finalRole = 'ministro';
      }

      userResponse.role = finalRole;
      userResponse.loginPhone = loginPhone;

      // Gera um novo token de sessão único para este login
      const newSessionToken = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      
      const dbMinistro = db.data.ministros.find(m => m.id === ministro.id);
      if (dbMinistro) {
        if (userResponse.isConjugeLogin) {
          dbMinistro.sessionTokenConjuge = newSessionToken;
        } else {
          dbMinistro.sessionToken = newSessionToken;
        }
        await db.write();
        logDebug(`Sessão gerada para ministro ID ${ministro.id}: ${newSessionToken} (isConjuge=${userResponse.isConjugeLogin})`);
      }
      userResponse.sessionToken = newSessionToken;

      // Verifica se a paróquia está bloqueada
      const paroquia = db.data.paroquias?.find(p => p.nome === ministro.paroquia);
      if (paroquia && paroquia.status === 'bloqueado') {
        return res.status(403).json({ error: 'Sua paróquia está bloqueada. Entre em contato com o administrador.' });
      }

      res.json({ message: 'Login bem-sucedido!', user: userResponse });
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.post('/api/admin/login', async (req, res) => {
    const { senha } = req.body;
    logDebug(`Admin Login Attempt: receivedPassword=${senha}`);
    try {
      await db.read();
      if (!db.data.config) db.data.config = { coordinatorEnabled: false, escalaPublicada: false, adminPassword: '999' };
      const adminPass = String(db.data.config.adminPassword || '999');
      logDebug(`Admin Stored Password: ${adminPass}`);
      
      if (String(senha) === adminPass) {
        logDebug('Admin Login Success');
        res.json({ message: 'Login Admin bem-sucedido!', user: { nome: 'Admin', role: 'admin' } });
      } else {
        logDebug('Admin Login Failed: Incorrect password');
        res.status(401).json({ error: 'Senha de administrador incorreta.' });
      }
    } catch (error) {
      logDebug(`Admin Login Error: ${error}`);
      res.status(500).json({ error: 'Erro no login admin.' });
    }
  });

  app.use('/api', (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      logDebug(`[API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${Date.now() - start}ms)`);
    });
    next();
  });

  app.post('/api/admin/change-password', async (req, res) => {
    const { novaSenha } = req.body;
    const adminPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,15}$/;
    
    if (!novaSenha || !adminPasswordRegex.test(novaSenha)) {
      return res.status(400).json({ 
        error: 'A senha do Admin deve ter entre 8 e 15 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos.' 
      });
    }
    try {
      await db.read();
      if (!db.data.config) db.data.config = { coordinatorEnabled: false, escalaPublicada: false, adminPassword: '999' };
      db.data.config.adminPassword = novaSenha;
      await db.write();
      res.json({ message: 'Senha alterada com sucesso!' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao alterar senha admin.' });
    }
  });

  app.post('/api/ministros', async (req, res) => {
    const { nome, nomeExibicao, nomeExibicaoConjuge, telefone, dataNascimento, nomeConjuge, dataNascimentoConjuge, telefoneConjuge, paroquia, senha, senhaConjuge, role, aprovado, acessoCoordenacao, tipo, afastado, afastadoConjuge, tempoMinisterio, tempoMinisterioConjuge, incompatibilidades, isTesoureiro, isLider, isLiderConjuge } = req.body;
    console.log(`Tentativa de cadastro: Nome=${nome}, Telefone=${telefone}, Paróquia=${paroquia}`);

    if (!nome || !telefone || !senha || !paroquia) {
      console.log('Cadastro falhou: Campos obrigatórios ausentes.');
      return res.status(400).json({ error: 'Nome, telefone, senha e paróquia são obrigatórios.' });
    }

    try {
      await db.read();
      
      const cleanInputPhone = (telefone || '').replace(/\D/g, '');
      const cleanInputPhoneConjuge = (telefoneConjuge || '').replace(/\D/g, '');

      if (!cleanInputPhone) {
        return res.status(400).json({ error: 'O número de telefone é obrigatório.' });
      }

      const existingMinistro = db.data.ministros.find(m => {
        const cleanDbPhone = (m.telefone || '').replace(/\D/g, '');
        const cleanDbPhoneConjuge = (m.telefoneConjuge || '').replace(/\D/g, '');

        const mainPhoneMatches = cleanInputPhone && (cleanDbPhone === cleanInputPhone || cleanDbPhoneConjuge === cleanInputPhone);
        const conjugePhoneMatches = cleanInputPhoneConjuge && (cleanDbPhone === cleanInputPhoneConjuge || cleanDbPhoneConjuge === cleanInputPhoneConjuge);

        return mainPhoneMatches || conjugePhoneMatches;
      });

      if (existingMinistro) {
        console.log(`Cadastro falhou: Telefone/DDD ${telefone} já cadastrado.`);
        return res.status(409).json({ error: 'Este número de telefone (DDD + telefone) já possui um cadastro efetuado.' });
      }

      const cleanName = (s: string) => s ? s.replace(/\s+&\s+/g, ' e ') : s;

      const novoId = (db.data.ministros.length > 0) ? Math.max(...db.data.ministros.map(m => m.id)) + 1 : 1;
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
        tipo: tipo || (nomeConjuge ? 'casal' : 'individual'),
        role: role || 'ministro',
        acessoCoordenacao: acessoCoordenacao || 'casal',
        aprovado: aprovado !== undefined ? aprovado : false,
        tempoMinisterio: tempoMinisterio || 'novo',
        tempoMinisterioConjuge: tempoMinisterioConjuge || 'novo',
        afastado: afastado !== undefined ? afastado : false,
        afastadoConjuge: afastadoConjuge !== undefined ? afastadoConjuge : false,
        incompatibilidades: incompatibilidades || [],
        isTesoureiro: isTesoureiro !== undefined ? isTesoureiro : false,
        isLider: isLider !== undefined ? isLider : false,
        isLiderConjuge: isLiderConjuge !== undefined ? isLiderConjuge : false
      };
      db.data.ministros.push(novoMinistro);
      await db.write();
      res.status(201).json({ message: 'Cadastro realizado com sucesso!', user: novoMinistro });
    } catch (error) {
      console.error('Erro ao cadastrar ministro:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.get('/api/ministros', async (req, res) => {
    console.log("DEBUG_SERVER_MINISTROS", "request received");
    let { paroquia } = req.query;
    if (paroquia === 'undefined' || paroquia === 'null') paroquia = undefined;

    try {
      await db.read();
      if (!db.data || !db.data.ministros) {
        return res.json([]);
      }

      const targetParoquia = paroquia ? normalize(String(paroquia)) : null;
      const ministrosArr: any[] = [];
      
      db.data.ministros.forEach(m => {
        if (!m) return;
        if (m.aprovado !== true || m.role === 'admin') return;
        
        if (targetParoquia) {
          if (!m.paroquia) return;
          if (normalize(m.paroquia) !== targetParoquia) return;
        }
        ministrosArr.push(m);
      });
      
      ministrosArr.sort((a, b) => {
        const nameA = a.nomeExibicao || a.nome || '';
        const nameB = b.nomeExibicao || b.nome || '';
        return nameA.localeCompare(nameB);
      });
      res.json(ministrosArr);
    } catch (error) {
      console.error('Erro ao buscar ministros:', error);
      res.status(500).json({ error: 'Erro ao buscar ministros.' });
    }
  });

  app.get('/api/ministros/aniversariantes', async (req, res) => {
    let { paroquia, mes } = req.query;
    if (paroquia === 'undefined' || paroquia === 'null') paroquia = undefined;
    if (mes === 'undefined' || mes === 'null') mes = undefined;
    
    const mesAtual = mes ? parseInt(mes as string) : new Date().getMonth() + 1; // 1-12
    
    try {
      await db.read();
      
      const ministrosFiltrados = (db.data.ministros || []).filter(m => {
        if (paroquia && m.paroquia) {
          const mP = normalize(m.paroquia);
          const qP = normalize(paroquia as string);
          if (mP !== qP) return false;
        }
        return true;
      });

      const aniversariantes = ministrosFiltrados.map(m => {
        const results = [];
        const b1 = parseBirthday(m.dataNascimento);
        if (b1 && b1.month === mesAtual) {
          results.push({ nome: m.nome, dia: b1.day, tipo: 'Ministro', telefone: m.telefone });
        }
        const b2 = parseBirthday(m.dataNascimentoConjuge);
        if (b2 && b2.month === mesAtual) {
          results.push({ nome: m.nomeConjuge || 'Ministro', dia: b2.day, tipo: 'Ministro', telefone: m.telefoneConjuge || m.telefone });
        }
        return results;
      }).flat().sort((a, b) => a.dia - b.dia);

      res.json(aniversariantes);
    } catch (error) {
      console.error('Erro ao buscar aniversariantes:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.get('/api/ministros/:telefone', async (req, res) => {
    const { telefone } = req.params;
    try {
      await db.read();
      const cleanPhone = (p: string | null | undefined) => p ? p.replace(/\D/g, '') : '';
      const searchPhone = cleanPhone(telefone);
      
      const ministro = db.data.ministros.find(m => 
        (m.telefone && cleanPhone(m.telefone) === searchPhone) || 
        (m.telefoneConjuge && cleanPhone(m.telefoneConjuge) === searchPhone)
      );

      if (!ministro) {
        return res.status(404).json({ error: 'Ministro não encontrado.' });
      }

      // If it's the spouse's phone, swap fields for the frontend
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
        // DO NOT swap sessionToken here, let the frontend handle it
        console.log(`[DEBUG API] Spouse data swapped (no token swap)`);
      } else {
        console.log(`[DEBUG API] No swap needed for titular: ${ministro.nome}`);
      }

      // Determine role based on who is logging in and access settings
      let finalRole = ministro.role || 'ministro';
      if (['coordenacao', 'vice_coordenacao'].includes(finalRole) && ministro.tipo === 'casal') {
        const acesso = ministro.acessoCoordenacao || 'casal';
        if (acesso === 'ele' && responseData.isConjugeLogin) finalRole = 'ministro';
        if (acesso === 'ela' && !responseData.isConjugeLogin) finalRole = 'ministro';
      }
      responseData.role = finalRole;

      res.json(responseData);
    } catch (error) {
      console.error('Erro ao buscar ministro:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.put('/api/ministros/:telefone', async (req, res) => {
    const { telefone } = req.params;
    const { nome, nomeExibicao, nomeExibicaoConjuge, nomeConjuge, dataNascimento, dataNascimentoConjuge, paroquia, senha, senhaConjuge, telefone: novoTelefone, telefoneConjuge, tipo, role, acessoCoordenacao, afastado, afastadoConjuge, tempoMinisterio, tempoMinisterioConjuge, incompatibilidades, isTesoureiro, isLider, isLiderConjuge } = req.body;

    try {
      await db.read();
      const cleanPhone = (p: string | null | undefined) => p ? p.replace(/\D/g, '') : '';
      const searchPhone = cleanPhone(telefone);
      
      const ministro = db.data.ministros.find(m => 
        (m.telefone && cleanPhone(m.telefone) === searchPhone) || 
        (m.telefoneConjuge && cleanPhone(m.telefoneConjuge) === searchPhone)
      );
      
      if (!ministro) {
        return res.status(404).json({ error: 'Ministro não encontrado.' });
      }

      const cleanName = (s: string) => s ? s.replace(/\s+&\s+/g, ' e ') : s;

      if (nome) ministro.nome = cleanName(nome);
      ministro.cadastroCompleto = true;
      if (nomeExibicao !== undefined) ministro.nomeExibicao = cleanName(nomeExibicao);
      if (nomeExibicaoConjuge !== undefined) ministro.nomeExibicaoConjuge = cleanName(nomeExibicaoConjuge);
      if (novoTelefone !== undefined) {
        ministro.telefone = novoTelefone;
      }
      if (nomeConjuge !== undefined) ministro.nomeConjuge = cleanName(nomeConjuge);
      if (dataNascimento !== undefined) ministro.dataNascimento = dataNascimento;
      if (dataNascimentoConjuge !== undefined) ministro.dataNascimentoConjuge = dataNascimentoConjuge;
      if (paroquia !== undefined) ministro.paroquia = paroquia;
      const isCoordenadorRole = ['coordenacao', 'vice_coordenacao'].includes(role !== undefined ? role : ministro.role);
      const effectiveAcessoCoordenacao = acessoCoordenacao !== undefined ? acessoCoordenacao : ministro.acessoCoordenacao;

      logDebug(`[DEBUG] Update password check: isCoordenadorRole=${isCoordenadorRole}, effectiveAcessoCoordenacao=${effectiveAcessoCoordenacao}, senha=${senha ? '***' : 'undefined'}, senhaConjuge=${senhaConjuge ? '***' : 'undefined'}`);

      if (senha !== undefined) {
        if (isCoordenadorRole && ['casal', 'ele'].includes(effectiveAcessoCoordenacao) && !isComplexPassword(senha)) {
          return res.status(400).json({ error: 'A senha do Coordenador ou Vice-Coordenador deve ter pelo menos 6 caracteres, contendo letras maiúsculas, minúsculas e caracteres especiais.' });
        }
        ministro.senha = senha;
      }
      if (senhaConjuge !== undefined) {
        if (isCoordenadorRole && ['casal', 'ela'].includes(effectiveAcessoCoordenacao) && !isComplexPassword(senhaConjuge)) {
          return res.status(400).json({ error: 'A senha do cônjuge do Coordenador ou Vice-Coordenador deve ter pelo menos 6 caracteres, contendo letras maiúsculas, minúsculas e caracteres especiais.' });
        }
        ministro.senhaConjuge = senhaConjuge;
      }
      if (telefoneConjuge !== undefined) ministro.telefoneConjuge = telefoneConjuge;
      if (tipo !== undefined) ministro.tipo = tipo;
      if (role !== undefined) ministro.role = role;
      if (acessoCoordenacao !== undefined) ministro.acessoCoordenacao = acessoCoordenacao;
      if (afastado !== undefined) ministro.afastado = afastado;
      if (afastadoConjuge !== undefined) ministro.afastadoConjuge = afastadoConjuge;
      if (tempoMinisterio !== undefined) ministro.tempoMinisterio = tempoMinisterio;
      if (tempoMinisterioConjuge !== undefined) ministro.tempoMinisterioConjuge = tempoMinisterioConjuge;
      if (incompatibilidades !== undefined) ministro.incompatibilidades = incompatibilidades;
      if (isTesoureiro !== undefined) ministro.isTesoureiro = isTesoureiro;
      if (isLider !== undefined) ministro.isLider = isLider;
      if (isLiderConjuge !== undefined) ministro.isLiderConjuge = isLiderConjuge;

      await db.write();
      res.json({ message: 'Dados atualizados com sucesso!', ministro });
    } catch (error) {
      console.error('Erro ao atualizar ministro:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.post('/api/reset-password', async (req, res) => {
    const { telefone } = req.body;
    try {
      await db.read();
      
      const cleanPhone = (phone: string | null | undefined) => phone ? phone.replace(/\D/g, '') : '';
      const searchPhone = cleanPhone(telefone);

      const ministro = db.data.ministros.find(m => 
        (m.telefone && cleanPhone(m.telefone) === searchPhone) || 
        (m.telefoneConjuge && cleanPhone(m.telefoneConjuge) === searchPhone)
      );

      if (!ministro) {
        return res.status(404).json({ error: 'Ministro não encontrado.' });
      }

      const isCoordenador = ['coordenacao', 'vice_coordenacao'].includes(ministro.role);
      const newPassword = isCoordenador
        ? `Temp@${Math.floor(100 + Math.random() * 900)}X`
        : Math.floor(100 + Math.random() * 900).toString(); // 3-digit password
      
      const isElaReset = cleanPhone(ministro.telefoneConjuge) === searchPhone;
      if (isElaReset) {
        ministro.senhaConjuge = newPassword;
      } else {
        ministro.senha = newPassword;
      }
      
      await db.write();
      res.json({ message: 'Nova senha gerada com sucesso!', newPassword });
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  const findBestMinisterMatch = (ministros: any[], nome: string, telefone: string, nomeConjuge?: string) => {
    const cleanPhone = telefone ? telefone.replace(/\D/g, '') : '';
    let bestMatch = null;
    let bestScore = 0;

    for (const m of ministros) {
      let score = 0;
      const mPhone = m.telefone ? m.telefone.replace(/\D/g, '') : '';
      const mPhoneConjuge = m.telefoneConjuge ? m.telefoneConjuge.replace(/\D/g, '') : '';
      const phoneMatches = cleanPhone && (mPhone === cleanPhone || mPhoneConjuge === cleanPhone);
      
      if (phoneMatches) score += 5;

      if (nome && m.nome) {
        const normalizeName = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, ' e ').replace(/\s+/g, ' ').trim();
        const n1 = normalizeName(nome);
        const n2 = normalizeName(m.nome);
        const c1 = nomeConjuge ? normalizeName(nomeConjuge) : '';
        
        let combinedN1 = n1;
        if (c1) {
            combinedN1 = [n1, c1].sort().join(' e ');
        } else if (n1.includes(' e ')) {
            combinedN1 = n1.split(' e ').map(x => x.trim()).sort().join(' e ');
        }
        
        if (m.tipo === 'casal' && m.nomeConjuge) {
          const conj = normalizeName(m.nomeConjuge);
          const combinedN2 = [n2, conj].sort().join(' e ');
          
          if (combinedN1 === combinedN2) {
            score += 20;
          } else if (combinedN1.includes(n2) && combinedN1.includes(conj)) {
            score += 15;
          } else if (combinedN1 === n2 || combinedN1 === conj || combinedN1.includes(n2) || combinedN1.includes(conj)) {
            score += 2; // Only matched one part of the couple
          }
        } else {
          if (combinedN1 === n2 || n1 === n2) {
            score += 20;
          } else if (combinedN1.includes(n2) || n2.includes(combinedN1)) {
            score += 10;
          }
        }
      }

      if (score > bestScore && score >= 5) { // Require at least a phone match or partial name match
        bestScore = score;
        bestMatch = m;
      }
    }
    return bestMatch;
  };

// Função auxiliar para calcular o status da disponibilidade
function getDisponibilidadeStatus(config: any, ministro: any, paroquia?: string) {
  const agora = new Date();
  const finalParoquia = (ministro?.paroquia || paroquia || '').toString().trim();
  
  // Lógica de agendamento mensal
  let estaNoPeriodoAgendado = false;
  
  // Get parish-specific scheduling if available
  const agendamento = config.agendamentoPorParoquia?.[finalParoquia] || {};
  const diaAbertura = agendamento.diaAbertura !== undefined && agendamento.diaAbertura !== '' ? agendamento.diaAbertura : config.diaAbertura;
  const horaAbertura = agendamento.horaAbertura || config.horaAbertura;
  const diaFechamento = agendamento.diaFechamento !== undefined && agendamento.diaFechamento !== '' ? agendamento.diaFechamento : config.diaFechamento;
  const horaFechamento = agendamento.horaFechamento || config.horaFechamento;

  if (diaAbertura && horaAbertura && typeof horaAbertura === 'string' && horaAbertura.includes(':') &&
      diaFechamento && horaFechamento && typeof horaFechamento === 'string' && horaFechamento.includes(':')) {
    const [hA, mA] = horaAbertura.split(':').map(Number);
    const [hF, mF] = horaFechamento.split(':').map(Number);
    
    // Create dates in current local server time (which should be configured appropriately or kept in UTC)
    const dataAbertura = new Date(agora.getFullYear(), agora.getMonth(), diaAbertura, hA, mA);
    const dataFechamento = new Date(agora.getFullYear(), agora.getMonth(), diaFechamento, hF, mF);
    
    if (dataFechamento < dataAbertura) {
      dataFechamento.setMonth(dataFechamento.getMonth() + 1);
    }

    if (agora >= dataAbertura && agora <= dataFechamento) {
      estaNoPeriodoAgendado = true;
    } else {
      // Verifica mês anterior (para os primeiros dias do mês caso o fechamento tenha sido agendado para o mês atual vindo do anterior)
      const dAMesAnt = new Date(dataAbertura);
      dAMesAnt.setMonth(dAMesAnt.getMonth() - 1);
      const dFMesAnt = new Date(dataFechamento);
      dFMesAnt.setMonth(dFMesAnt.getMonth() - 1);
      
      if (agora >= dAMesAnt && agora <= dFMesAnt) {
        estaNoPeriodoAgendado = true;
      }
    }
  }

  const manualOverride = finalParoquia && config.disponibilidadeAbertaPorParoquia ? config.disponibilidadeAbertaPorParoquia[finalParoquia] : undefined;
  
  const aberta = manualOverride !== undefined 
    ? manualOverride 
    : (config.disponibilidadeAberta || estaNoPeriodoAgendado);

  let temExcecao = false;
  if (ministro?.excecaoAcessoAte) {
    const dataExcecao = new Date(ministro.excecaoAcessoAte);
    if (dataExcecao > agora) {
      temExcecao = true;
    }
  }

  return { aberta, estaNoPeriodoAgendado, manualOverride, temExcecao };
}

  app.post('/api/disponibilidade', async (req, res) => {
    const { ministro_id, nome, telefone, disponibilidade, tipo, nomeConjuge, paroquia, isCoordenador } = req.body;
    const role = (req.body.role || '').toLowerCase().trim();
    const isCoordenadorRequest = isCoordenador === true || role === 'admin' || role === 'coordenador' || role === 'coordenacao' || role === 'vice_coordenacao' || role.includes('coordena');
    logDebug(`POST /api/disponibilidade recebido: ${JSON.stringify(req.body)}`);
    logDebug(`POST /api/disponibilidade recebido: ministro_id=${ministro_id}, nome=${nome}, paroquia=${paroquia}, disponibilidade.length=${disponibilidade?.length}, isCoordenadorRequest=${isCoordenadorRequest}`);

    if (!nome || !disponibilidade || !Array.isArray(disponibilidade)) {
      return res.status(400).json({ error: 'Nome e lista de disponibilidade são obrigatórios.' });
    }

    if (!isCoordenadorRequest && (!telefone || disponibilidade.length < 2)) {
      return res.status(400).json({ error: 'Nome, telefone e pelo menos duas missas são obrigatórios para ministros.' });
    }

    try {
      await db.read();
      
      let ministro = null;
      if (ministro_id) {
        const ministroIdNum = parseInt(ministro_id);
        ministro = db.data.ministros.find(m => m.id === ministroIdNum);
      }
      if (!ministro) {
        ministro = findBestMinisterMatch(db.data.ministros, nome, telefone, nomeConjuge);
      }

      const finalParoquia = (ministro?.paroquia || paroquia || '').toString().trim();

      // Verificação de período de disponibilidade
      const config = db.data.config || { 
        coordinatorEnabled: false, 
        escalaPublicada: false, 
        disponibilidadeAberta: false 
      };
      
      const { aberta, estaNoPeriodoAgendado, manualOverride, temExcecao } = getDisponibilidadeStatus(config, ministro, finalParoquia);
      
      logDebug(`Checking availability for ${nome} (${finalParoquia}): manualOverride=${manualOverride}, global=${config.disponibilidadeAberta}, estaNoPeriodo=${estaNoPeriodoAgendado}, temExcecao=${temExcecao}, isCoordenadorRequest=${isCoordenadorRequest}`);
      
      if (!aberta && !temExcecao && !isCoordenadorRequest) {
        logDebug(`Access denied for ${nome}: aberta=${aberta}, temExcecao=${temExcecao}, isCoordenadorRequest=${isCoordenadorRequest}`);
        return res.status(403).json({ error: 'O período de preenchimento da disponibilidade está encerrado. Entre em contato com a coordenação.' });
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
        const novoId = (db.data.ministros.length > 0) ? Math.max(...db.data.ministros.map(m => m.id)) + 1 : 1;
        const novoMinistro = { 
          id: novoId, 
          nome, 
          telefone,
          tipo: tipo || 'individual',
          nomeConjuge: nomeConjuge || '',
          paroquia: finalParoquia,
          aprovado: false,
          role: 'ministro'
        };
        db.data.ministros.push(novoMinistro);
        final_ministro_id = novoId;
      }

      // Detect month and year from the first slot, or use current month/year if empty
      // Actually, it's safer to specify the month/year in the payload, but we can derive it
      const targetMonthYear = (disponibilidade.length > 0) 
        ? `${disponibilidade[0].data.split('-')[0]}-${disponibilidade[0].data.split('-')[1]}`
        : (() => {
            const today = new Date();
            const targetDate = new Date(today.getFullYear(), today.getDate() >= 20 ? today.getMonth() + 1 : today.getMonth(), 1);
            return `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
          })();

      // Clear existing availability for this minister in the specific month
      db.data.disponibilidades = db.data.disponibilidades.filter(d => 
        !(d.ministro_id === final_ministro_id && d.data.startsWith(targetMonthYear))
      );

      // Mark availability as confirmed for this minister and clear any temporary access exception
      const ministroAtualizado = db.data.ministros.find(m => m.id === final_ministro_id);
      if (ministroAtualizado) {
        ministroAtualizado.disponibilidadeConfirmada = true;
        ministroAtualizado.excecaoAcessoAte = null;
      }

      let proxIdDisp = (db.data.disponibilidades.length > 0) ? Math.max(...db.data.disponibilidades.map(d => d.id)) + 1 : 1;
      
      for (const slot of disponibilidade) {
        logDebug(`Salvando disponibilidade: ministro_id=${final_ministro_id}, data=${slot.data}, horario=${slot.horario}, nomeMissa=${slot.nomeMissa}`);
        db.data.disponibilidades.push({
          id: proxIdDisp++,
          ministro_id: final_ministro_id,
          data: slot.data,
          horario: slot.horario,
          nomeMissa: slot.nomeMissa,
          modo: slot.modo || 'individual',
          paroquia: finalParoquia // Save parish for easier filtering
        });
      }

      await db.write();
      res.status(201).json({ message: 'Disponibilidade salva com sucesso!' });
    } catch (error) {
      console.error('Erro ao salvar disponibilidade:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.get('/api/disponibilidade', async (req, res) => {
    const { paroquia } = req.query;
    try {
      await db.read();
      
      let dbChanged = false;

      let disponibilidades = db.data.disponibilidades || [];
      
      // We no longer filter out the current month on the server, 
      // let the client decide what to show based on its target month.
      
      if (paroquia) {
        const targetParoquia = normalize(String(paroquia));
        disponibilidades = disponibilidades.filter(d => {
          // 1. Check if the record already has the correct parish
          const dParoquia = normalize(d.paroquia);
          if (dParoquia === targetParoquia) return true;
          
          // 2. Try to find the minister by ID
          let ministro = db.data.ministros.find(m => String(m.id) === String(d.ministro_id));
          
          // 3. Fallback: Try matching by name/phone if ID is missing or not found
          if (!ministro && (d.nome || d.telefone)) {
            ministro = findBestMinisterMatch(db.data.ministros, d.nome, d.telefone, (d as any).nomeConjuge);
            if (ministro) {
              d.ministro_id = ministro.id;
              dbChanged = true;
            }
          }
          
          const mParoquia = normalize(ministro?.paroquia);
          return mParoquia === targetParoquia;
        });
      }

      // Group disponibilidades by minister
      const grouped = disponibilidades.reduce((acc, curr) => {
        let minId = curr.ministro_id;
        let ministro = null;

        // Try to find the minister if we have an ID
        if (minId) {
          ministro = db.data.ministros.find(m => String(m.id) === String(minId));
        }

        // If not found by ID, try matching by name/phone (redundant but safe)
        if (!ministro && (curr.nome || curr.telefone)) {
          ministro = findBestMinisterMatch(db.data.ministros, curr.nome, curr.telefone, (curr as any).nomeConjuge);
          if (ministro) {
            minId = ministro.id;
            curr.ministro_id = ministro.id;
            dbChanged = true;
          }
        }

        if (!ministro && minId) {
          ministro = db.data.ministros.find(m => m.id === minId);
        }
        
        // Auto-correct past submissions where a couple's submission was assigned to an individual
        if (ministro && ministro.tipo === 'individual' && curr.modo === 'casal') {
           const correctCouple = db.data.ministros.find(m => m.tipo === 'casal' && (m.telefone === ministro.telefone || m.nome.includes(ministro.nome)));
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
              tipo: ministro.tipo || 'individual',
              disponibilidade: []
            };
          } else {
            acc[key] = {
              ministro_id: null,
              nome: curr.nome || 'Desconhecido',
              nomeExibicao: (curr as any).nomeExibicao || curr.nome || 'Desconhecido',
              nomeExibicaoConjuge: (curr as any).nomeExibicaoConjuge || (curr as any).nomeConjuge || '',
              telefone: curr.telefone || '',
              nomeConjuge: '',
              tipo: 'individual',
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
        await db.write();
        console.log('Database updated with corrected minister IDs.');
      }

      res.json(Object.values(grouped));
    } catch (error) {
      console.error('Erro ao buscar disponibilidades:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.get('/api/disponibilidade/:telefone', async (req, res) => {
    const { telefone } = req.params;
    try {
      await db.read();
      const cleanPhone = (p: string | null | undefined) => p ? p.replace(/\D/g, '') : '';
      const searchPhone = cleanPhone(telefone);
      
      const ministro = db.data.ministros.find(m => 
        (m.telefone && cleanPhone(m.telefone) === searchPhone) || 
        (m.telefoneConjuge && cleanPhone(m.telefoneConjuge) === searchPhone)
      );
      
      if (!ministro) {
        return res.json([]);
      }
      const { mes, ano } = req.query;
      
      let disponibilidades = db.data.disponibilidades
        .filter(d => d.ministro_id === ministro.id);
        
      if (mes && ano) {
        const m = parseInt(mes as string, 10);
        const y = parseInt(ano as string, 10);
        disponibilidades = disponibilidades.filter(d => {
          const date = new Date(d.data + 'T00:00:00');
          return (date.getMonth() + 1) === m && date.getFullYear() === y;
        });
      }

      const result = disponibilidades.map(d => {
        return { data: d.data, horario: d.horario, nomeMissa: d.nomeMissa, modo: d.modo };
      });
      res.json(result);
    } catch (error) {
      console.error('Erro ao buscar disponibilidade do ministro:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.get('/api/vagas', async (req, res) => {
    fs.appendFileSync('debug.log', `${new Date().toISOString()} - [DEBUG /api/vagas] Route HIT. Params: ${JSON.stringify(req.query)}\n`);
    const { paroquia, mes, ano } = req.query;
    const targetMonth = mes ? parseInt(String(mes)) : null;
    const targetYear = ano ? parseInt(String(ano)) : null;

    fs.appendFileSync('debug.log', `${new Date().toISOString()} - [DEBUG /api/vagas] Entry. Paroquia: ${paroquia}, Mes: ${mes}, Ano: ${ano}\n`);
    
    try {
      await db.read();
      const contagem = {};

      let disponibilidades = db.data.disponibilidades || [];
      console.log(`[DEBUG /api/vagas] Total initial disponibilidades: ${disponibilidades.length}`);
      fs.appendFileSync('debug.log', `${new Date().toISOString()} - [DEBUG /api/vagas] Total initial disponibilidades: ${disponibilidades.length}\n`);
      
      if (paroquia) {
        const targetParoquia = normalize(String(paroquia));
        disponibilidades = disponibilidades.filter(d => {
          const dParoquia = normalize(d.paroquia);
          if (dParoquia === targetParoquia) return true;
          
          const ministro = db.data.ministros.find(m => String(m.id) === String(d.ministro_id));
          const mParoquia = normalize(ministro?.paroquia);
          return mParoquia === targetParoquia;
        });
        console.log(`[DEBUG /api/vagas] Disponibilidades após filtro paroquia ("${paroquia}"): ${disponibilidades.length}`);
        fs.appendFileSync('debug.log', `${new Date().toISOString()} - [DEBUG /api/vagas] Disponibilidades após filtro paroquia ("${paroquia}"): ${disponibilidades.length}\n`);
      }

      // Filter by month and year if provided and valid
      if (targetMonth && !isNaN(targetMonth) && targetYear && !isNaN(targetYear)) {
        disponibilidades = disponibilidades.filter(d => {
          if (!d.data) return false;
          const [y, m, d_day] = d.data.split('-').map(Number);
          return m === targetMonth && y === targetYear;
        });
      }

      for (const disp of disponibilidades) {
        const normModo = normalizeModo(disp.modo);
        let isCasal = normModo === 'casal';
        if (!disp.modo) {
          const ministro = db.data.ministros.find(m => String(m.id) === String(disp.ministro_id));
          if (ministro && ministro.tipo === 'casal') isCasal = true;
        }
        
        let peso = isCasal ? 2 : 1;
        
        let nomeParaChave = disp.nomeMissa || disp.nome || '';
        let chave = `${disp.data}-${disp.horario}-${normalize(nomeParaChave)}`;
        
        fs.appendFileSync('debug.log', `${new Date().toISOString()} - [DEBUG /api/vagas] Chave gerada: "${chave}" (Data: ${disp.data}, Horario: ${disp.horario}, Nome: "${nomeParaChave}")\n`);
        
        if (!contagem[chave]) {
          contagem[chave] = { total: 0, casal: 0, individual: 0, ministros: [] };
        }
        contagem[chave].total += peso;
        if (isCasal) contagem[chave].casal += 1;
        else contagem[chave].individual += 1;

        // Add minister names
        const ministro = db.data.ministros.find(m => String(m.id) === String(disp.ministro_id));
        if (ministro) {
          let nomeExibicao = ministro.nomeExibicao || ministro.nome;
          if (isCasal) {
            const n1 = ministro.nomeExibicao || ministro.nome;
            const n2 = ministro.nomeExibicaoConjuge || ministro.nomeConjuge;
            nomeExibicao = `${n1} e ${n2}`;
          } else if (normModo === 'ela') {
            nomeExibicao = ministro.nomeExibicaoConjuge || ministro.nomeConjuge;
          } else if (normModo === 'ele') {
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
      console.error('Erro ao buscar vagas:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.post('/api/mensagens', async (req, res) => {
    const { nome, telefone, mensagem, paroquia, type } = req.body;

    if (!nome || !mensagem || !paroquia) {
      return res.status(400).json({ error: 'Nome, mensagem e paróquia são obrigatórios.' });
    }

    try {
      await db.read();
      if (!db.data.mensagens) {
        db.data.mensagens = [];
      }

      db.data.mensagens.push({
        id: Date.now(),
        nome,
        telefone,
        destinatario_telefone: req.body.destinatario_telefone || null,
        texto: mensagem,
        paroquia,
        type: type || 'broadcast',
        data: new Date().toISOString()
      });

      await db.write();

      // Send Web Push notification
      if (req.body.destinatario_telefone) {
        sendPushNotificationToUser(req.body.destinatario_telefone, 'Nova Mensagem 📩', mensagem, '/', paroquia);
      } else {
        sendPushNotificationToParoquia(paroquia, 'Comunicado da Coordenação 📢', mensagem, '/');
      }

      res.status(201).json({ message: 'Mensagem enviada com sucesso!' });
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.post('/api/comunhao', async (req, res) => {
    try {
      await db.read();
      if (!db.data.comunhao) db.data.comunhao = [];
      console.log('[DEBUG] Server Saving Communion:', req.body);
      db.data.comunhao.push({
        id: Date.now(),
        ...req.body,
        ministro_id: Number(req.body.ministro_id),
        dataCadastro: new Date().toISOString()
      });
      await db.write();
      res.status(201).json({ message: 'Cadastro de comunhão realizado com sucesso!' });
    } catch (error) {
      console.error('Erro ao salvar comunhão:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.delete('/api/comunhao/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await db.read();
      if (!db.data.comunhao) return res.status(404).json({ error: 'Nenhuma comunhão encontrada.' });
      const index = db.data.comunhao.findIndex(c => String(c.id) === String(id));
      if (index === -1) return res.status(404).json({ error: 'Comunhão não encontrada.' });
      db.data.comunhao.splice(index, 1);
      await db.write();
      res.json({ message: 'Comunhão excluída com sucesso!' });
    } catch (error) {
      console.error('Erro ao excluir comunhão:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.put('/api/comunhao/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await db.read();
      if (!db.data.comunhao) return res.status(404).json({ error: 'Nenhuma comunhão encontrada.' });
      const index = db.data.comunhao.findIndex(c => String(c.id) === String(id));
      if (index === -1) return res.status(404).json({ error: 'Comunhão não encontrada.' });
      db.data.comunhao[index] = { 
        ...db.data.comunhao[index], 
        ...req.body, 
        ministro_id: Number(req.body.ministro_id), 
        id: Number(id) 
      };
      await db.write();
      res.json({ message: 'Comunhão atualizada com sucesso!' });
    } catch (error) {
      console.error('Erro ao atualizar comunhão:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.get('/api/comunhao/:ministro_id', async (req, res) => {
    const { ministro_id } = req.params;
    try {
      await db.read();
      const ministro_id_num = Number(ministro_id);
      const main_id = Math.floor(ministro_id_num);
      const spouse_id = main_id + 0.5;

      // Find the minister to check 'tipo'
      const ministro = db.data.ministros.find(m => Number(m.id) === main_id);
      
      const comunhoes = (db.data.comunhao || []).filter(c => {
        const cid = Number(c.ministro_id);
        if (ministro && ministro.tipo === 'casal') {
            return cid === main_id || cid === spouse_id;
        } else {
            // For individual, only return records for the specific ID logged in
            return cid === ministro_id_num;
        }
      }).map(c => {
        const id = Number(c.ministro_id);
        const main_id = Math.floor(id);
        const ministro = db.data.ministros.find(m => Number(m.id) === main_id);
        
        let ministro_nome = 'Desconhecido';
        if (ministro) {
            if (id === main_id) {
                ministro_nome = ministro.nomeExibicao || ministro.nome;
            } else if (id === main_id + 0.5) {
                ministro_nome = ministro.nomeExibicaoConjuge || ministro.nomeConjuge || 'Desconhecido';
            }
        }
        return { ...c, ministro_nome };
      });
      res.json(comunhoes);
    } catch (error) {
      console.error('Erro ao buscar comunhões:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.get('/api/comunhao/paroquia/:paroquia', async (req, res) => {
    const { paroquia } = req.params;
    try {
      await db.read();
      const targetParoquia = normalize(paroquia);
      const comunhoes = (db.data.comunhao || []).filter(c => {
        const ministro = db.data.ministros.find(m => {
          const id = Number(c.ministro_id);
          const main_id = Math.floor(id);
          return Number(m.id) === main_id;
        });
        const matchCParoquia = (c.paroquia && normalize(c.paroquia) === targetParoquia);
        const matchMParoquia = (ministro && normalize(ministro.paroquia) === targetParoquia);
        const isClinica = ((c as any).tipoAtendimento === 'clinica');
        const isFamilia = ((c as any).tipoAtendimento === 'familia');
        
        console.log(`[DEBUG] Communion ${c.id}: paroquia=${c.paroquia}, tipo=${(c as any).tipoAtendimento}, matchC=${matchCParoquia}, matchM=${matchMParoquia}, isClinica=${isClinica}, isFamilia=${isFamilia}`);
        
        return matchCParoquia || matchMParoquia || isClinica || isFamilia;
      }).map(c => {
        const id = Number(c.ministro_id);
        const main_id = Math.floor(id);
        const ministro = db.data.ministros.find(m => Number(m.id) === main_id);
        
        let ministro_nome = 'Desconhecido';
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
      console.error('Erro ao buscar comunhões da paróquia:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.get('/api/comunhao/:ministroId', async (req, res) => {
    const { ministroId } = req.params;
    try {
      await db.read();
      const mainId = Math.floor(Number(ministroId));
      const comunhoes = (db.data.comunhao || []).filter(c => {
        const id = Number(c.ministro_id);
        const main_id = Math.floor(id);
        return main_id === mainId;
      }).map(c => {
        const id = Number(c.ministro_id);
        const main_id = Math.floor(id);
        const ministro = db.data.ministros.find(m => Number(m.id) === main_id);
        
        let ministro_nome = 'Desconhecido';
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
      console.error('Erro ao buscar comunhões do ministro:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  // --- ENDPOINTS DE FALTAS (GESTÃO DE FALTAS DA COORDENAÇÃO) ---
  app.get('/api/faltas', async (req, res) => {
    const { paroquia, mes, ministroId } = req.query;
    if (!paroquia || paroquia === 'undefined' || paroquia === 'null') {
      return res.status(400).json({ error: 'Paróquia não informada ou inválida.' });
    }
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      await db.read();
      if (!db.data) return res.json([]);
      if (!db.data.faltas) db.data.faltas = [];

      const targetParoquia = normalize(String(paroquia));
      let list = db.data.faltas.filter((f: any) => f && f.paroquia && normalize(f.paroquia) === targetParoquia);

      if (mes) {
        list = list.filter((f: any) => f.data && f.data.startsWith(String(mes)));
      }

      if (ministroId) {
        list = list.filter((f: any) => String(f.ministroId) === String(ministroId));
      }

      // Sort by date descending, then horario descending
      list.sort((a: any, b: any) => {
        const dCompare = (b.data || '').localeCompare(a.data || '');
        if (dCompare !== 0) return dCompare;
        return (b.horario || '').localeCompare(a.horario || '');
      });

      res.json(list);
    } catch (error) {
      console.error('Erro ao buscar faltas:', error);
      res.status(500).json({ error: 'Erro interno ao buscar faltas.' });
    }
  });

  app.post('/api/faltas', async (req, res) => {
    const { paroquia, data, horario, ministroId, ministroNome, quantidade, tipoFalta, justificativa, registradoPor } = req.body;
    if (!paroquia || !data || !horario || !ministroId || !ministroNome) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes (paroquia, data, horario, ministroId, ministroNome).' });
    }
    try {
      await db.read();
      if (!db.data) db.data = {} as any;
      if (!db.data.faltas) db.data.faltas = [];

      let qtd = 1;
      if (typeof quantidade === 'number' && quantidade > 0) {
        qtd = quantidade;
      } else if (tipoFalta === 'ambos') {
        qtd = 2;
      } else {
        const norm = normalize(String(ministroNome || ''));
        if (norm.includes(' e ') || norm.includes(' & ') || norm.includes(' / ')) {
          qtd = 2;
        }
      }

      const novaFalta = {
        id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7),
        paroquia: String(paroquia).trim(),
        data: String(data).trim(), // YYYY-MM-DD
        horario: String(horario).trim(), // e.g. "08:00"
        ministroId: String(ministroId).trim(),
        ministroNome: String(ministroNome).trim(),
        quantidade: qtd,
        tipoFalta: tipoFalta || (qtd === 2 ? 'ambos' : 'individual'),
        justificativa: justificativa ? String(justificativa).trim() : '',
        registradoPor: registradoPor ? String(registradoPor).trim() : '',
        createdAt: new Date().toISOString()
      };

      db.data.faltas.push(novaFalta);
      await db.write();

      res.status(201).json({ success: true, falta: novaFalta });
    } catch (error) {
      console.error('Erro ao registrar falta:', error);
      res.status(500).json({ error: 'Erro interno ao registrar falta.' });
    }
  });

  app.delete('/api/faltas/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await db.read();
      if (!db.data || !db.data.faltas) {
        return res.status(404).json({ error: 'Registro não encontrado.' });
      }

      const index = db.data.faltas.findIndex((f: any) => String(f.id) === String(id));
      if (index === -1) {
        return res.status(404).json({ error: 'Registro de falta não encontrado.' });
      }

      db.data.faltas.splice(index, 1);
      await db.write();

      res.json({ success: true, message: 'Registro de falta removido com sucesso.' });
    } catch (error) {
      console.error('Erro ao remover falta:', error);
      res.status(500).json({ error: 'Erro interno ao remover falta.' });
    }
  });

  // --- ENDPOINTS DE RELATÓRIOS DE LÍDER DE MISSA ---
  app.get('/api/relatorios-lider', async (req, res) => {
    const { paroquia, data, horario } = req.query;
    try {
      await db.read();
      if (!db.data) db.data = {} as any;
      if (!db.data.relatoriosLider) db.data.relatoriosLider = [];

      const targetParoquia = paroquia ? normalize(String(paroquia)) : '';
      let list = db.data.relatoriosLider.filter((r: any) => r && r.paroquia && normalize(r.paroquia) === targetParoquia);

      if (data) {
        list = list.filter((r: any) => r.data === String(data));
      }
      if (horario) {
        list = list.filter((r: any) => r.horario === String(horario));
      }

      res.json(list);
    } catch (error) {
      console.error('Erro ao buscar relatórios de líder:', error);
      res.status(500).json({ error: 'Erro interno ao buscar relatórios de líder.' });
    }
  });

  app.post('/api/relatorios-lider', async (req, res) => {
    const { paroquia, data, horario, liderNome, presencas, faltasReportadas, trocasNaoRegistradas, usoEstoque, observacoes } = req.body;
    if (!paroquia || !data || !horario || !liderNome) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes (paroquia, data, horario, liderNome).' });
    }

    try {
      await db.read();
      if (!db.data) db.data = {} as any;
      if (!db.data.relatoriosLider) db.data.relatoriosLider = [];
      if (!db.data.faltas) db.data.faltas = [];

      const normalizedParoquia = String(paroquia).trim();
      const existingIdx = db.data.relatoriosLider.findIndex((r: any) =>
        normalize(r.paroquia) === normalize(normalizedParoquia) &&
        r.data === String(data) &&
        r.horario === String(horario)
      );

      const novoRelatorio = {
        id: existingIdx !== -1 ? db.data.relatoriosLider[existingIdx].id : (Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7)),
        paroquia: normalizedParoquia,
        data: String(data).trim(),
        horario: String(horario).trim(),
        liderNome: String(liderNome).trim(),
        presencas: presencas || {}, // { "Nome do Ministro": true/false }
        faltasReportadas: faltasReportadas || [], // [{ ministroNome: string, ministroId?: string, justificativa?: string }]
        trocasNaoRegistradas: trocasNaoRegistradas ? String(trocasNaoRegistradas).trim() : '',
        usoEstoque: usoEstoque ? String(usoEstoque).trim() : '',
        observacoes: observacoes ? String(observacoes).trim() : '',
        updatedAt: new Date().toISOString()
      };

      if (existingIdx !== -1) {
        db.data.relatoriosLider[existingIdx] = novoRelatorio;
      } else {
        db.data.relatoriosLider.push(novoRelatorio);
      }

      // Automatically sync reported faltas into db.data.faltas for coordination view
      if (Array.isArray(faltasReportadas)) {
        for (const faltaItem of faltasReportadas) {
          if (!faltaItem || !faltaItem.ministroNome) continue;
          const minNome = String(faltaItem.ministroNome).trim();
          
          // Check if already registered
          const jaExiste = db.data.faltas.some((f: any) =>
            normalize(f.paroquia) === normalize(normalizedParoquia) &&
            f.data === String(data).trim() &&
            f.horario === String(horario).trim() &&
            normalize(f.ministroNome) === normalize(minNome)
          );

          if (!jaExiste) {
            // Find minister id if not provided
            let mId = faltaItem.ministroId || '';
            if (!mId) {
              const listMin = db.data.ministros[normalizedParoquia] || [];
              const minFound = listMin.find((m: any) =>
                normalize(m.nome) === normalize(minNome) ||
                normalize(m.nomeConjuge || '') === normalize(minNome)
              );
              if (minFound) mId = minFound.id;
              else mId = Date.now().toString();
            }

            let qtd = 1;
            if (typeof faltaItem.quantidade === 'number' && faltaItem.quantidade > 0) {
              qtd = faltaItem.quantidade;
            } else if (faltaItem.tipoFalta === 'ambos') {
              qtd = 2;
            } else {
              const norm = normalize(minNome);
              if (norm.includes(' e ') || norm.includes(' & ') || norm.includes(' / ')) {
                qtd = 2;
              }
            }

            db.data.faltas.push({
              id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7),
              paroquia: normalizedParoquia,
              data: String(data).trim(),
              horario: String(horario).trim(),
              ministroId: mId,
              ministroNome: minNome,
              quantidade: qtd,
              tipoFalta: faltaItem.tipoFalta || (qtd === 2 ? 'ambos' : 'individual'),
              justificativa: faltaItem.justificativa ? String(faltaItem.justificativa).trim() : 'Falta reportada pelo Líder da Missa',
              registradoPor: `Líder: ${liderNome}`,
              createdAt: new Date().toISOString()
            });
          }
        }
      }

      await db.write();
      res.status(200).json({ success: true, relatorio: novoRelatorio });
    } catch (error) {
      console.error('Erro ao salvar relatório de líder:', error);
      res.status(500).json({ error: 'Erro interno ao salvar relatório do líder.' });
    }
  });

  app.delete('/api/relatorios-lider/:id', async (req, res) => {
    const { id } = req.params;
    const { paroquia } = req.query;
    try {
      await db.read();
      if (!db.data || !db.data.relatoriosLider) {
        return res.status(404).json({ error: 'Nenhum relatório encontrado.' });
      }

      const idx = db.data.relatoriosLider.findIndex((r: any) => String(r.id) === String(id));
      if (idx === -1) {
        return res.status(404).json({ error: 'Relatório não encontrado.' });
      }

      db.data.relatoriosLider.splice(idx, 1);
      await db.write();
      res.json({ success: true, message: 'Relatório excluído com sucesso.' });
    } catch (error) {
      console.error('Erro ao excluir relatório de líder:', error);
      res.status(500).json({ error: 'Erro interno ao excluir relatório.' });
    }
  });


  // --- ENDPOINTS DE FINANCEIRO (TESOURARIA) ---
  app.get('/api/financeiro', async (req, res) => {
    let { paroquia } = req.query;
    if (!paroquia || paroquia === 'undefined' || paroquia === 'null') {
        return res.status(403).json({ error: 'Paróquia não informada ou inválida.' });
    }
    try {
      await db.read();
      if (!db.data) return res.json([]);
      
      // Ensure collection exists
      if (!db.data.financeiro) {
        db.data.financeiro = [];
      }
      
      let items = db.data.financeiro;
      const targetParoquia = normalize(String(paroquia));
      items = items.filter(i => i && normalize(i.paroquia) === targetParoquia);
      
      res.json(items);
    } catch (error) {
      console.error('Erro ao buscar financeiro:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.post('/api/financeiro', async (req, res) => {
    const { tipo, categoria, valor, data, ministroId, ministroNome, usuario, paroquia, descricao, mesReferencia } = req.body;
    
    if (!tipo || !categoria || !valor || !data || !paroquia) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    }

    try {
      await db.read();
      if (!db.data) return res.status(500).json({ error: 'Banco de dados não carregado.' });

      if (!db.data.financeiro) {
        db.data.financeiro = [];
      }

      const hash = Math.random().toString(36).substring(2, 9).toUpperCase();
      const novoLancamento = {
        id: `FIN-${hash}`,
        tipo,
        categoria,
        valor: Number(valor),
        data,
        ministroId: ministroId ? Number(ministroId) : undefined,
        ministroNome,
        usuario,
        paroquia,
        descricao,
        mesReferencia,
        createdAt: new Date().toISOString()
      };

      db.data.financeiro.push(novoLancamento);
      await db.write();

      res.status(201).json({ message: 'Lançamento registrado com sucesso!', lancamento: novoLancamento });
    } catch (error) {
      console.error('Erro ao salvar lançamento financeiro:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.delete('/api/financeiro/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await db.read();
      if (!db.data || !db.data.financeiro) {
        return res.status(404).json({ error: 'Lançamento não encontrado.' });
      }

      const index = db.data.financeiro.findIndex(f => f.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Lançamento não encontrado.' });
      }

      db.data.financeiro.splice(index, 1);
      await db.write();

      res.json({ message: 'Lançamento excluído com sucesso!' });
    } catch (error) {
      console.error('Erro ao excluir lançamento financeiro:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });


  // --- ENDPOINTS DE ESTOQUE ---
  app.get('/api/estoque', async (req, res) => {
    const { paroquia } = req.query;
    try {
      await db.read();
      if (!db.data || !db.data.estoque) return res.json([]);
      
      let items = db.data.estoque;
      if (paroquia && paroquia !== 'undefined' && paroquia !== 'null') {
        const targetParoquia = normalize(String(paroquia));
        items = items.filter(i => i && normalize(i.paroquia) === targetParoquia);
      }
      res.json(items);
    } catch (error) {
      console.error('Erro ao buscar estoque:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.get('/api/estoque/movimentacoes', async (req, res) => {
    const { paroquia, itemId } = req.query;
    try {
      await db.read();
      if (!db.data || !db.data.estoqueMovimentacoes) return res.json([]);
      
      let docs = db.data.estoqueMovimentacoes;
      if (paroquia && paroquia !== 'undefined' && paroquia !== 'null') {
        const target = normalize(String(paroquia));
        docs = docs.filter(m => m && normalize(m.paroquia) === target);
      }
      if (itemId) {
        docs = docs.filter(m => m && m.itemId === itemId);
      }
      
      // Sort most recent first
      docs.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      
      res.json(docs);
    } catch (error) {
      console.error('Erro ao buscar movimentações:', error);
      res.status(500).json({ error: 'Erro ao buscar movimentações.' });
    }
  });

  app.post('/api/estoque/movimentar', async (req, res) => {
    const { itemId, tipo, quantidade, isEmbalagem, quantidadeOriginal, usuario, observacao, paroquia, dataMissa, horarioMissa, ministroResponsavel } = req.body;
    try {
      await db.read();
      const itemIndex = db.data.estoque.findIndex(i => i.id === itemId);
      if (itemIndex === -1) return res.status(404).json({ error: 'Item não encontrado.' });
      
      const item = db.data.estoque[itemIndex];
      const unitsToMove = Number(quantidade);
      
      if (tipo === 'entrada') {
        item.quantidade += unitsToMove;
        item.entradas = (item.entradas || 0) + unitsToMove;
      } else {
        item.quantidade -= unitsToMove;
        item.saidas = (item.saidas || 0) + unitsToMove;
      }
      
      item.quantidade = Math.max(0, item.quantidade);
      item.quantidadeEmbalagens = item.quantidade / (item.unidadesPorEmbalagem || 1);
      item.ultimaAtualizacao = new Date().toISOString();
      
      const movimentacao = {
        id: Date.now().toString(),
        itemId,
        tipo,
        quantidade: unitsToMove,
        isEmbalagem: !!isEmbalagem,
        quantidadeOriginal: Number(quantidadeOriginal || unitsToMove),
        data: new Date().toISOString(),
        dataMissa,
        horarioMissa,
        ministroResponsavel,
        usuario,
        paroquia,
        observacao
      };
      
      if (!db.data.estoqueMovimentacoes) db.data.estoqueMovimentacoes = [];
      db.data.estoqueMovimentacoes.push(movimentacao);
      
      await db.write();
      res.json({ item, movimentacao });
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error);
      res.status(500).json({ error: 'Erro ao registrar movimentação.' });
    }
  });

  app.post('/api/estoque', async (req, res) => {
    try {
      await db.read();
      if (!db.data.estoque) db.data.estoque = [];
      const data = { ...req.body };
      
      // Ensure quantity and packages are numbers and correctly calculated
      const unidadesPorEmbalagem = Number(data.unidadesPorEmbalagem) || 1;
      const quantidade = Number(data.quantidade) || 0;
      const quantidadeEmbalagens = data.quantidadeEmbalagens !== undefined 
        ? Number(data.quantidadeEmbalagens) 
        : (quantidade / unidadesPorEmbalagem);

      const newItem = {
        ...data,
        quantidade,
        unidadesPorEmbalagem,
        quantidadeEmbalagens,
        id: Date.now().toString(),
        ultimaAtualizacao: new Date().toISOString()
      };
      db.data.estoque.push(newItem);
      await db.write();
      res.status(201).json(newItem);
    } catch (error) {
      console.error('Erro ao criar item no estoque:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.put('/api/estoque/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await db.read();
      if (!db.data.estoque) return res.status(404).json({ error: 'Estoque vazio.' });
      const index = db.data.estoque.findIndex(i => i.id === id);
      if (index === -1) return res.status(404).json({ error: 'Item não encontrado.' });
      
      const item = db.data.estoque[index];
      const updatedData = { ...req.body };
      
      // Calculate derived fields if dependencies change
      if (updatedData.unidadesPorEmbalagem !== undefined) {
        item.unidadesPorEmbalagem = Number(updatedData.unidadesPorEmbalagem);
        item.quantidadeEmbalagens = item.quantidade / (item.unidadesPorEmbalagem || 1);
      }
      
      if (updatedData.quantidade !== undefined) {
        item.quantidade = Number(updatedData.quantidade);
        item.quantidadeEmbalagens = item.quantidade / (item.unidadesPorEmbalagem || 1);
      }

      db.data.estoque[index] = { 
        ...item, 
        ...updatedData, 
        id, 
        ultimaAtualizacao: new Date().toISOString() 
      };
      
      await db.write();
      res.json(db.data.estoque[index]);
    } catch (error) {
      console.error('Erro ao atualizar item no estoque:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.delete('/api/estoque/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await db.read();
      if (!db.data.estoque) return res.status(404).json({ error: 'Estoque vazio.' });
      const index = db.data.estoque.findIndex(i => i.id === id);
      if (index === -1) return res.status(404).json({ error: 'Item não encontrado.' });
      db.data.estoque.splice(index, 1);
      await db.write();
      res.json({ message: 'Item excluído com sucesso!' });
    } catch (error) {
      console.error('Erro ao excluir item do estoque:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.post('/api/escala/gerar', async (req, res) => {
    const { paroquia, mes, ano, keep } = req.query;
    const keepExisting = keep === 'true';
    if (!paroquia) return res.status(400).json({ error: 'Paróquia é obrigatória.' });

    console.log(`[POST /api/escala/gerar] Iniciando nova lógica para: Paroquia: ${paroquia}, Mes: ${mes}, Ano: ${ano}, Keep: ${keepExisting}`);

    try {
      await (db as any).read(true);
      
      const targetParoquia = String(paroquia).trim();
      const targetMonthStr = (mes && ano) ? `${ano}-${String(mes).padStart(2, '0')}` : null;
      const anoNum = Number(ano);
      const mesNum = Number(mes);

      if (!targetMonthStr) {
        return res.status(400).json({ error: 'Mês e ano são obrigatórios.' });
      }

      // 1. Buscar dados
      const allMinistros = db.data.ministros || [];
      const allDisponibilidades = db.data.disponibilidades || [];
      const todasMissas = db.data.missasTemporarias || []; // Contém fixas e temporárias da tabela

      // Filtrar as missas cadastradas para a paróquia alvo (exatamente igual ao GET /api/missas-temporarias)
      const missasDaParoquia = todasMissas.filter(m => {
        const mPar = (m.paroquia && m.paroquia !== 'undefined') ? String(m.paroquia).trim() : '';
        if (targetParoquia) {
          return mPar.toLowerCase() === targetParoquia.toLowerCase();
        }
        return mPar === '';
      });

      // Missas Padrão (Hardcoded como fallback base)
      const MISSAS_PADRAO = [
        { id: 'padrao-sab-17', nome: 'Missa de Sábado', frequencia: 'semanal', diaSemana: '6', horario: '17:00', quantidade: 6, tipo: 'padrao' },
        { id: 'padrao-dom-07', nome: 'Missa de Domingo', frequencia: 'semanal', diaSemana: '0', horario: '07:30', quantidade: 5, tipo: 'padrao' },
        { id: 'padrao-dom-10', nome: 'Missa de Domingo', frequencia: 'semanal', diaSemana: '0', horario: '10:00', quantidade: 8, tipo: 'padrao' },
        { id: 'padrao-dom-19', nome: 'Missa de Domingo', frequencia: 'semanal', diaSemana: '0', horario: '19:00', quantidade: 8, tipo: 'padrao' },
      ];

      const missas: any[] = [];
      
      // Adicionar missas padrão aplicando as regras de override da paróquia atual
      MISSAS_PADRAO.forEach(mp => {
        const override = missasDaParoquia.find(m => 
          (m.tipo === 'padrao' || m.tipo === 'fixa' || (!m.tipo && m.frequencia === 'semanal')) && 
          m.horario === mp.horario &&
          String(m.diaSemana) === String(mp.diaSemana) &&
          !m.data // Não é uma sobrescrita de data única
        );
        
        if (override) {
          if (!override.deletada) {
            missas.push({ ...mp, ...override, paroquia: targetParoquia || override.paroquia || 'Padrão' });
          }
        } else {
          missas.push({ ...mp, paroquia: targetParoquia || 'Padrão' });
        }
      });

      // Adicionar as outras missas cadastradas da paróquia (não-padrão)
      missasDaParoquia.forEach(m => {
        if (m.deletada) return;
        const isDefaultOverride = MISSAS_PADRAO.some(mp => 
          m.horario === mp.horario && 
          String(m.diaSemana) === String(mp.diaSemana) && 
          (m.tipo === 'padrao' || m.tipo === 'fixa' || (!m.tipo && m.frequencia === 'semanal')) &&
          !m.data
        );
        if (!isDefaultOverride) {
          missas.push(m);
        }
      });

      console.log(`[POST /api/escala/gerar] Missas encontradas para a paróquia ${targetParoquia}: ${missas.length}`);
      missas.forEach(m => {
        console.log(` - Missa: ${m.nome} | Horário: ${m.horario} | Frequência: ${m.frequencia} | Qtd: ${m.quantidade}`);
      });

      // Filtrar ministros ativos da paróquia
      const ministros = allMinistros.filter(m => {
        const mParoquia = (m.paroquia || '').trim();
        if (mParoquia !== targetParoquia || !m.aprovado) return false;
        if (m.tipo === 'individual' && m.afastado) return false;
        if (m.tipo === 'casal' && m.afastado && m.afastadoConjuge) return false;
        return true;
      });

      console.log(`[POST /api/escala/gerar] Ministros ativos encontrados para ${targetParoquia}: ${ministros.length}`);
      if (ministros.length < 10) {
        console.log(`[POST /api/escala/gerar] Nomes dos ministros: ${ministros.map(m => m.nome).join(', ')}`);
      }

      // Filtrar disponibilidades do mês e da paróquia
      const disponibilidades = allDisponibilidades.filter(d => {
        if (!d.data.startsWith(targetMonthStr)) return false;
        
        if (d.paroquia) {
          if (String(d.paroquia).trim() !== targetParoquia) return false;
        } else {
          const ministro = ministros.find(m => String(m.id) === String(d.ministro_id));
          if (!ministro) return false;
        }
        
        return true;
      });

      console.log(`[POST /api/escala/gerar] Disponibilidades encontradas para ${targetMonthStr}: ${disponibilidades.length}`);
      
      // Debug specific ministers
      const alexandreDisp = disponibilidades.filter(d => String(d.ministro_id) === '1');
      const mauricioDisp = disponibilidades.filter(d => String(d.ministro_id) === '38');
      console.log(`[POST /api/escala/gerar] Disponibilidades Alexandre (ID 1): ${alexandreDisp.length}`);
      console.log(`[POST /api/escala/gerar] Disponibilidades Maurício (ID 38): ${mauricioDisp.length}`);

      // 2. Gerar todos os slots de missa para o mês
      const slots = {}; // chave: "YYYY-MM-DD|HH:MM|Nome", valor: { data, horario, nome, quantidade, ocupacao, ministros: [], candidatos: [] }
      const daysInMonth = new Date(anoNum, mesNum, 0).getDate();

      const normalizeMassName = (name: string) => {
        if (!name) return "";
        return name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ' ');
      };

      const normalizeHorario = (h: string) => {
        if (!h) return "00:00";
        const parts = h.trim().split(/[:h]/);
        if (parts.length === 0) return "00:00";
        let HH = parts[0].padStart(2, '0');
        let MM = (parts[1] || '00').padStart(2, '0');
        if (parseInt(HH) > 23) HH = "23";
        if (parseInt(MM) > 59) MM = "59";
        return `${HH}:${MM}`;
      };

      for (let dia = 1; dia <= daysInMonth; dia++) {
        const dataStr = `${anoNum}-${String(mesNum).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        const dateObj = new Date(anoNum, mesNum - 1, dia);
        const diaSemana = dateObj.getDay(); // 0 (Dom) a 6 (Sáb)
        const semanaDoMes = Math.ceil(dia / 7); // 1 a 5

        missas.forEach(m => {
          // Ignorar se a data estiver inativada (Gerenciar Datas Inativas)
          if (m.datasInativas && m.datasInativas.some(d => String(d).trim() === dataStr)) {
            console.log(`[GERAR] Missa ${m.nome} em ${dataStr} ignorada por datasInativas`);
            return;
          }

          let isMatch = false;
          if ((m.frequencia === 'temporaria' || m.tipo === 'unica') && m.data === dataStr) isMatch = true;
          else if (m.frequencia === 'diaria' && diaSemana !== 0 && diaSemana !== 6) isMatch = true;
          else if (m.frequencia === 'semanal' && parseInt(m.diaSemana) === diaSemana) isMatch = true;
          else if (m.frequencia === 'mensal-data' && parseInt(m.diaMes) === dia) isMatch = true;
          else if (m.frequencia === 'mensal' && parseInt(m.diaSemana) === diaSemana && semanaDoMes === parseInt(m.diaMes || '1', 10)) isMatch = true;
          else if (m.frequencia === 'mensal-1' && semanaDoMes === 1 && parseInt(m.diaSemana) === diaSemana) isMatch = true;
          else if (m.frequencia === 'mensal-2' && semanaDoMes === 2 && parseInt(m.diaSemana) === diaSemana) isMatch = true;
          else if (m.frequencia === 'mensal-3' && semanaDoMes === 3 && parseInt(m.diaSemana) === diaSemana) isMatch = true;
          else if (m.frequencia === 'mensal-4' && semanaDoMes === 4 && parseInt(m.diaSemana) === diaSemana) isMatch = true;
          else if (m.frequencia === 'quinzenal' && parseInt(m.diaSemana) === diaSemana && (semanaDoMes === 1 || semanaDoMes === 3 || semanaDoMes === 5)) isMatch = true;

          if (isMatch && Number(m.quantidade) > 0) {
            const normalizedName = normalizeMassName(m.nome);
            const normHorario = normalizeHorario(m.horario);
            const chave = `${dataStr}|${normHorario}|${normalizedName}`;
            // Se houver conflito (ex: uma temporária ou única sobrescrevendo uma fixa no mesmo dia/hora), a temporária/única tem prioridade
            if (!slots[chave] || m.frequencia === 'temporaria' || m.tipo === 'unica') {
              slots[chave] = {
                data: dataStr,
                horario: normHorario,
                origHorario: m.horario,
                nome: m.nome, // Nome original para exibição
                normalizedNome: normalizedName,
                quantidade: Number(m.quantidade) || 0, // Vagas definidas pela coordenação
                ocupacao: 0,
                novosIndividuais: 0,
                novosCasais: 0,
                isTemporaria: (m.frequencia === 'temporaria' || m.tipo === 'unica'),
                ministros: [],
                candidatos: []
              };
            }
          }
        });
      }

      // 3. Mapear disponibilidades para os slots
      let mappedCount = 0;
      disponibilidades.forEach(d => {
        // Garantir normalização total dos dados da disponibilidade
        const cleanData = String(d.data || '').trim();
        const cleanHorario = normalizeHorario(d.horario);
        const normalizedDispName = normalizeMassName(d.nomeMissa);
        
        // Tentar encontrar o slot exato (Data|Horario|Nome)
        const chave = `${cleanData}|${cleanHorario}|${normalizedDispName}`;
        
        if (slots[chave]) {
          slots[chave].candidatos.push(d);
          mappedCount++;
        } else {
          // Busca um pouco mais flexível: mesmo dia e horário, mas ignore diferenças mínimas no nome se houver apenas um slot no horário
          // Isso ajuda se o coordenador mudou levemente o nome da missa mas o horário é o mesmo
          const slotsNoMesmoHorario = Object.keys(slots).filter(k => k.startsWith(`${cleanData}|${cleanHorario}|`));
          
          if (slotsNoMesmoHorario.length > 0) {
            // Priority 1: Exact match
            let bestKey = slotsNoMesmoHorario.find(k => slots[k].normalizedNome === normalizedDispName);
            
            // Priority 2: Partial match (e.g. "Missa" in availability matching "Missa de Domingo" in coordinate)
            if (!bestKey) {
              bestKey = slotsNoMesmoHorario.find(k => {
                const sn = slots[k].normalizedNome;
                return sn.includes(normalizedDispName) || normalizedDispName.includes(sn);
              });
            }
            
            // Priority 3: Fallback to unique slot if only 1 at that time
            if (!bestKey && slotsNoMesmoHorario.length === 1) {
              bestKey = slotsNoMesmoHorario[0];
            }

            if (bestKey) {
              slots[bestKey].candidatos.push(d);
              mappedCount++;
            } else {
              console.log(`[AVISO] Não foi possível mapear disponibilidade: ${cleanData} ${cleanHorario} "${normalizedDispName}" (Conflito entre ${slotsNoMesmoHorario.length} slots)`);
            }
          }
        }
      });
      console.log(`[POST /api/escala/gerar] Disponibilidades mapeadas para slots: ${mappedCount}`);

      // 4. Algoritmo de Distribuição (Justo e respeitando limites, com variação avançada para o "gerar novamente")
      const liderancasHistoricas: { [nome: string]: number } = {};

      // Carregar lideranças de outros meses para dar continuidade ao rodízio histórico
      try {
        const escalaParoquia = db.data.escalaGerada?.[targetParoquia] || {};
        Object.keys(escalaParoquia).forEach((dataKey) => {
          if (dataKey.startsWith(targetMonthStr)) return; // Ignora o mês atual que estamos gerando
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
        console.log(`[POST /api/escala/gerar] Carregadas ${Object.keys(liderancasHistoricas).length} lideranças históricas de outros meses para ${targetParoquia}`);
      } catch (err) {
        console.error("Erro ao carregar lideranças históricas:", err);
      }

      const liderCountMap: Record<string, number> = {};
      ministros.forEach(m => {
        let maxCount = 0;
        const nEle = m.nomeExibicao || m.nome;
        const nEla = m.nomeExibicaoConjuge || m.nomeConjuge;
        if (nEle && liderancasHistoricas[nEle]) maxCount = Math.max(maxCount, liderancasHistoricas[nEle]);
        if (nEla && liderancasHistoricas[nEla]) maxCount = Math.max(maxCount, liderancasHistoricas[nEla]);
        liderCountMap[String(m.id)] = maxCount;
      });

      const contagemMinistro: Record<string, number> = {};
      const dispCount: Record<string, number> = {};
      const randomTieBreaker: Record<string, number> = {};
      ministros.forEach(m => {
        contagemMinistro[String(m.id)] = 0;
        dispCount[String(m.id)] = 0;
        randomTieBreaker[String(m.id)] = Math.random();
      });

      // Count total availabilities per minister for scarcity sorting
      Object.values(slots).forEach((slot: any) => {
        slot.candidatos.forEach((d: any) => {
          dispCount[String(d.ministro_id)] = (dispCount[String(d.ministro_id)] || 0) + 1;
        });
      });

      const chavesSlots = Object.keys(slots);
      
      // Tracking maps for absolute safety (ID and Name per day)
      const idsEscaladosNoDia: Record<string, Set<string>> = {};
      const nomesEscaladosNoDia: Record<string, Set<string>> = {};
      const idsEscaladosNaSemana: Record<string, Set<string>> = {}; // key: "YYYY-WXX" -> Set(mId)

      const getWeekKey = (dateStr: string) => {
        const parts = dateStr.split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        
        // Use local Date to find the day of the week
        // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
        const d = new Date(year, month, day);
        const dayOfWeek = d.getDay();

        // If it is Friday (5), Saturday (6), or Sunday (0), group them into the same weekend key
        if (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) {
          // Find the Sunday of this weekend
          const sunday = new Date(d);
          if (dayOfWeek === 5) sunday.setDate(d.getDate() + 2); // Friday -> Sunday
          else if (dayOfWeek === 6) sunday.setDate(d.getDate() + 1); // Saturday -> Sunday
          // Sunday is already Sunday
          const y = sunday.getFullYear();
          const m = String(sunday.getMonth() + 1).padStart(2, '0');
          const dy = String(sunday.getDate()).padStart(2, '0');
          return `weekend-${y}-${m}-${dy}`;
        }

        // For weekdays, return a unique key per day so they don't block any other day
        return `weekday-${dateStr}`;
      };

      const getAdjacentDateStrings = (dateStr: string) => {
        const parts = dateStr.split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-indexed month
        const day = parseInt(parts[2], 10);
        
        const baseDate = new Date(Date.UTC(year, month, day));
        
        const prevDate = new Date(baseDate);
        prevDate.setUTCDate(baseDate.getUTCDate() - 1);
        
        const nextDate = new Date(baseDate);
        nextDate.setUTCDate(baseDate.getUTCDate() + 1);
        
        const formatDateUTC = (d: Date) => {
          const y = d.getUTCFullYear();
          const m = String(d.getUTCMonth() + 1).padStart(2, '0');
          const dayVal = String(d.getUTCDate()).padStart(2, '0');
          return `${y}-${m}-${dayVal}`;
        };
        
        return {
          prevStr: formatDateUTC(prevDate),
          nextStr: formatDateUTC(nextDate)
        };
      };

      const isJaEscaladoNoDia = (data: string, mId: string, nomeExibicao: string) => {
        const normName = normalizeMassName(nomeExibicao);
        const dayIds = idsEscaladosNoDia[data];
        const dayNames = nomesEscaladosNoDia[data];
        
        if (dayIds?.has(String(mId))) return true;
        
        // Exact name matching to avoid substrings blocking distinct people
        if (dayNames?.has(normName)) return true;
        
        // If it's a couple, check if either individual is already in
        const parts = normName.split(/\s+e\s+/);
        if (dayNames && parts.length > 1) {
          for (const p of parts) {
            if (dayNames.has(p)) return true;
          }
        }
        
        return false;
      };

      const isJaEscaladoNaSemana = (data: string, mId: string) => {
        const weekKey = getWeekKey(data);
        const weekSet = idsEscaladosNaSemana[weekKey];
        return weekSet && weekSet.has(String(mId));
      };

      const registrarEscalacaoNoDia = (data: string, mId: string, nomeExibicao: string) => {
        if (!idsEscaladosNoDia[data]) idsEscaladosNoDia[data] = new Set();
        if (!nomesEscaladosNoDia[data]) nomesEscaladosNoDia[data] = new Set();
        idsEscaladosNoDia[data].add(String(mId));
        
        const normName = normalizeMassName(nomeExibicao);
        nomesEscaladosNoDia[data].add(normName);
        
        // Also register individual names if it's a couple to prevent double-booking separately
        const parts = normName.split(/\s+e\s+/);
        if (parts.length > 1) {
          parts.forEach(p => nomesEscaladosNoDia[data].add(p.trim()));
        }

        // Registry for week constraints
        const weekKey = getWeekKey(data);
        if (!idsEscaladosNaSemana[weekKey]) idsEscaladosNaSemana[weekKey] = new Set();
        idsEscaladosNaSemana[weekKey].add(String(mId));
      };

      // 4.5 Restaurar escala existente nas vagas se solicitado
      if (keepExisting && db.data.escalaGerada && db.data.escalaGerada[targetParoquia]) {
        const extEscala = db.data.escalaGerada[targetParoquia];
        let preservedCount = 0;
        
        Object.keys(extEscala).forEach(dt => {
          if (targetMonthStr && dt.startsWith(targetMonthStr)) {
            const diarias = extEscala[dt];
            Object.keys(diarias).forEach(horario => {
              const prevSlot = diarias[horario];
              const sn = normalizeMassName(prevSlot.nome || '');
              const slotKey = `${dt}|${normalizeHorario(horario)}|${sn}`;
              let targetSlotKey = slots[slotKey] ? slotKey : null;
              if (!targetSlotKey) {
                const normH = normalizeHorario(horario);
                const matchingKey = Object.keys(slots).find(k => {
                  const s = slots[k];
                  return s.data === dt && normalizeHorario(s.horario) === normH;
                });
                if (matchingKey) {
                  targetSlotKey = matchingKey;
                }
              }
              const slot = targetSlotKey ? slots[targetSlotKey] : null;

              if (slot && prevSlot.ministros && Array.isArray(prevSlot.ministros)) {
                prevSlot.ministros.forEach((pmNome: string) => {
                  // Find the minister by name
                  const matchedMin = allMinistros.find(min => {
                    const mParoquia = (min.paroquia || '').trim();
                    if (mParoquia !== targetParoquia) return false;
                    const mainNameRaw = min.nome;
                    if (normalizeMassName(mainNameRaw) === normalizeMassName(pmNome)) return true;
                    // Also check casal combined name just in case
                    if (min.tipo === 'casal') {
                      const casalNome = `${min.nome} e ${min.nomeConjuge}`;
                      if (normalizeMassName(casalNome) === normalizeMassName(pmNome)) return true;
                    }
                    return false;
                  });

                  if (matchedMin) {
                    const mId = String(matchedMin.id);
                    // Verify if the minister is still strictly active
                    if (contagemMinistro[mId] !== undefined) {
                      let peso = 1;
                      let modo = 'individual';
                      if (matchedMin.tipo === 'casal') {
                        const mNameNorm = normalize(pmNome);
                        const isEleksandraOnly = mNameNorm === normalize(matchedMin.nomeExibicaoConjuge) || mNameNorm === normalize(matchedMin.nomeConjuge);
                        const isRodrigoOnly = mNameNorm === normalize(matchedMin.nomeExibicao) || mNameNorm === normalize(matchedMin.nome);
                        if (isEleksandraOnly) {
                          peso = 1;
                          modo = 'ela';
                        } else if (isRodrigoOnly) {
                          peso = 1;
                          modo = 'ele';
                        } else {
                          peso = 2;
                          modo = 'casal';
                        }
                      }
                      if (slot.ocupacao + peso <= slot.quantidade) {
                        slot.ministros.push({
                          id: mId,
                          nome: pmNome,
                          modo: modo,
                          telefone: matchedMin.telefone || ''
                        });
                        
                        registrarEscalacaoNoDia(dt, mId, pmNome);
                        contagemMinistro[mId]++;
                        slot.ocupacao += peso;
                        preservedCount++;
                      }
                    }
                  }
                });
              }
            });
          }
        });
        console.log(`[POST /api/escala/gerar] keepExisting ativado. Foram preservados ${preservedCount} assentos de ministros já escalados.`);
      }

      // Shuffle physically once to ensure base order is random
      for (let i = chavesSlots.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chavesSlots[i], chavesSlots[j]] = [chavesSlots[j], chavesSlots[i]];
      }

      // To prevent the exact same slots from being processed in the exact same sequence (which kills rotation),
      // we add a tiny random jitter to each slot's scarcity score so similar-scarcity slots rotate.
      const slotRandom: Record<string, number> = {};
      chavesSlots.forEach(k => {
        slotRandom[k] = Math.random() * 0.15;
      });

      function tentarPreencher(
        maxEscalacoesPermitidas: number, 
        ignorarRestricoes = false, 
        ignorarRegraDaSemana = false,
        ignorarSequenciaDias = false,
        ignorarMesmoDia = false,
        chavesParaProcessar?: string[]
      ) {
        let alocouAlguem = false;
        
        const chavesAtivas = chavesParaProcessar || chavesSlots;
        
        // Sort slots by scarcity (number of candidates available vs needed spots)
        // This ensures dates with few availability get prioritized (like 07/06 missing people)
        const currentOrder = [...chavesAtivas].sort((a, b) => {
          const slotA = slots[a];
          const slotB = slots[b];
          const missingA = slotA.quantidade - slotA.ocupacao;
          const missingB = slotB.quantidade - slotB.ocupacao;
          // Ratio of available candidates to missing spots with small random jitter
          const ratioA = (missingA > 0 ? slotA.candidatos.length / missingA : 999) + (slotRandom[a] || 0);
          const ratioB = (missingB > 0 ? slotB.candidatos.length / missingB : 999) + (slotRandom[b] || 0);
          
          return ratioA - ratioB;
        });

        for (const chave of currentOrder) {
          const slot = slots[chave];
          if (slot.ocupacao >= slot.quantidade) continue;

          const remainingCapacity = slot.quantidade - slot.ocupacao;

          // Helper: check if slot currently has a leader
          let slotHasLeader = slot.ministros.some((mEsc: any) => {
            const mObj = ministros.find(m => String(m.id) === String(mEsc.id));
            if (!mObj) return false;
            const normM = normalizeModo(mEsc.modo);
            if (normM === 'ela') return !!mObj.isLiderConjuge || mObj.role === 'coordenacao' || mObj.role === 'vice_coordenacao';
            if (normM === 'ele') return !!mObj.isLider || mObj.role === 'coordenacao' || mObj.role === 'vice_coordenacao';
            return !!(mObj.isLider || mObj.isLiderConjuge || mObj.role === 'coordenacao' || mObj.role === 'vice_coordenacao');
          });

          // Shuffle candidates radically EVERY round for EVERY slot
          const candidatesToTest = [...slot.candidatos].map(d => {
            const m = ministros.find(min => String(min.id) === String(d.ministro_id));
            const normModo = normalizeModo(d.modo);
            let p = 1;
            if (normModo === 'casal' || (!d.modo && m?.tipo === 'casal')) p = 2;
            const isLiderCand = normModo === 'ela' ? (!!m?.isLiderConjuge || m?.role === 'coordenacao' || m?.role === 'vice_coordenacao') : 
                                normModo === 'ele' ? (!!m?.isLider || m?.role === 'coordenacao' || m?.role === 'vice_coordenacao') : 
                                !!(m?.isLider || m?.isLiderConjuge || m?.role === 'coordenacao' || m?.role === 'vice_coordenacao');
            return { ...d, modo: normModo, peso: p, isLiderCand };
          }).sort((a: any, b: any) => {
            const mIdA = String(a.ministro_id);
            const mIdB = String(b.ministro_id);
            const countA = contagemMinistro[mIdA] || 0;
            const countB = contagemMinistro[mIdB] || 0;

            // Priority 0: Leader assignment priority if slot currently has no leader
            if (!slotHasLeader) {
              if (a.isLiderCand !== b.isLiderCand) {
                return a.isLiderCand ? -1 : 1;
              }
              if (a.isLiderCand && b.isLiderCand) {
                const lIdA = String(a.ministro_id);
                const lIdB = String(b.ministro_id);
                if (liderCountMap[lIdA] !== liderCountMap[lIdB]) {
                  return (liderCountMap[lIdA] || 0) - (liderCountMap[lIdB] || 0);
                }
              }
            }

            // Priority 1: Absolute Fairness First!
            // A minister with 0 (or fewer) assignments in the month MUST ALWAYS take precedence
            // over anyone who already has more assignments, ensuring EVERY available minister is scheduled at least once.
            if (countA !== countB) return countA - countB;

            // Priority 2: Scarcity / Vulnerability Priority!
            // Among candidates with the same number of assignments (e.g., both 0 escalations),
            // prioritize ministers with FEWER total availabilities in the month (lower dispCount).
            // A minister available in only 2 slots is at high risk of ending up with 0 assignments if skipped.
            const dispA = dispCount[mIdA] || 0;
            const dispB = dispCount[mIdB] || 0;
            if (dispA !== dispB) return dispA - dispB;

            // Priority 3: Bin Packing / Capacity Optimization
            // If capacity >= 2, prefer couples (weight 2) to pack the slot efficiently.
            // If capacity == 1, prefer individuals (weight 1) because couples cannot fit.
            if (a.peso !== b.peso) {
              if (remainingCapacity >= 2) {
                return b.peso - a.peso; // Couples first
              } else {
                return a.peso - b.peso; // Individuals first
              }
            }

            // Priority 4: Random Tiebreaker for rotation when all other criteria match
            return (randomTieBreaker[mIdA] || 0) - (randomTieBreaker[mIdB] || 0);
          });

          for (const disp of candidatesToTest) {
            if (slot.ocupacao >= slot.quantidade) break;

            const mId = String(disp.ministro_id);
            const ministro = ministros.find(m => String(m.id) === mId);
            if (!ministro) continue;

            const modo = normalizeModo(disp.modo);
            const peso = disp.peso;

            // Define display name early for duplicate checks
            let nomeExib = ministro.nomeExibicao || ministro.nome;
            if (peso === 2) {
              nomeExib = `${ministro.nomeExibicao || ministro.nome} e ${ministro.nomeExibicaoConjuge || ministro.nomeConjuge}`;
            } else if (modo === 'ela') {
              nomeExib = ministro.nomeExibicaoConjuge || ministro.nomeConjuge;
            } else if (modo === 'ele') {
              nomeExib = ministro.nomeExibicao || ministro.nome;
            }

            // --- THE GATES (STRICT ORDER) ---

            // 1. Capacity Gate
            if (contagemMinistro[mId] >= maxEscalacoesPermitidas && !ignorarRestricoes) continue;

            if (slot.ocupacao + peso > slot.quantidade) continue;

            // 2. DUPLICATION GATE (ABSOLUTE RIGOR - NEVER IGNORED UNLESS SPECIFIED)
            if (!ignorarMesmoDia) {
              if (isJaEscaladoNoDia(slot.data, mId, nomeExib)) continue;
            } else {
              if (slot.ministros.some((mEsc: any) => String(mEsc.id) === mId)) continue;
            }

            // 3. SEQUENCE GATE (SAT/SUN - ABSOLUTE RIGOR - NEVER IGNORED UNLESS SPECIFIED)
            if (!ignorarSequenciaDias) {
              const { prevStr, nextStr } = getAdjacentDateStrings(slot.data);
              if (isJaEscaladoNoDia(prevStr, mId, nomeExib) || isJaEscaladoNoDia(nextStr, mId, nomeExib)) continue;
            }

            // 3.5. WEEK PROTECT GATE
            if (!ignorarRegraDaSemana && isJaEscaladoNaSemana(slot.data, mId)) continue;

            // 4. NEW vs EXPERIENCED PROTECTION (RELAXABLE)
            const isNovoTitular = ministro.tempoMinisterio === 'novo';
            const isNovoConjuge = ministro.tempoMinisterioConjuge === 'novo';
            const isNovoCandidato = peso === 1 ? (modo === 'ela' ? isNovoConjuge : isNovoTitular) : (isNovoTitular || isNovoConjuge);

            if (isNovoCandidato && !ignorarRestricoes) {
              const currentNovos = (slot.novosCount || 0);
              const limiteNovosConfig = db.data.config?.limiteNovosPorMissaPorParoquia?.[targetParoquia] ?? 2;
              if (limiteNovosConfig !== "livre" && currentNovos >= Number(limiteNovosConfig)) continue;
              if (slot.ocupacao + peso >= slot.quantidade && slot.ocupacao === (slot.novosPessoasCount || 0)) continue;
            }

            // 5. INCOMPATIBILITY GATE (ABSOLUTE RIGOR)
            const temIncompativel = slot.ministros.some((mEsc: any) => {
              const mEscObj = allMinistros.find(m => String(m.id) === String(mEsc.id));
              return (ministro.incompatibilidades || []).some(id => String(id) === String(mEsc.id)) ||
                     (mEscObj?.incompatibilidades || []).some(id => String(id) === mId);
            });
            if (temIncompativel) continue;

            // --- ALLOCATION ---
            slot.ministros.push({ id: mId, nome: nomeExib, modo });
            slot.ocupacao += peso;
            if (disp.isLiderCand && !slotHasLeader) {
              liderCountMap[mId] = (liderCountMap[mId] || 0) + 1;
              slotHasLeader = true;
            }
            
            // Register for duplicate protection
            registrarEscalacaoNoDia(slot.data, mId, nomeExib);

            if (isNovoCandidato) {
              slot.novosCount = (slot.novosCount || 0) + 1;
              slot.novosPessoasCount = (slot.novosPessoasCount || 0) + peso;
            }

            contagemMinistro[mId] += 1;
            alocouAlguem = true;
          }
        }
        return alocouAlguem;
      }

      // Helper function to calculate total weight of candidates for a slot
      const getSlotCandidatosTotalPeso = (slot: any) => {
        let totalPeso = 0;
        slot.candidatos.forEach((d: any) => {
          const m = ministros.find(min => String(min.id) === String(d.ministro_id));
          const normModo = normalizeModo(d.modo);
          let p = 1;
          if (normModo === 'casal' || (!d.modo && m?.tipo === 'casal')) p = 2;
          totalPeso += p;
        });
        return totalPeso;
      };

      const chavesSemSobra: string[] = [];
      const chavesComSobra: string[] = [];

      chavesSlots.forEach(chave => {
        const slot = slots[chave];
        const totalPeso = getSlotCandidatosTotalPeso(slot);
        if (totalPeso <= slot.quantidade) {
          chavesSemSobra.push(chave);
        } else {
          chavesComSobra.push(chave);
        }
      });

      console.log(`[POST /api/escala/gerar] Slots categorizados: Sem Sobra (Grupo 1): ${chavesSemSobra.length}, Com Sobra (Grupo 2): ${chavesComSobra.length}`);

      // COORDENADOR CONFIGURABLE LIMIT
      const limitConfig = db.data.config?.limiteEscalacaoPorParoquia?.[targetParoquia] ?? 3;
      console.log(`[POST /api/escala/gerar] Limite configurado de escalações por ministro: ${limitConfig}`);

      // ROUNDS FOR ROTATION - EXECUTADOS EM DUAS ETAPAS (GRUPO 1 PRIMEIRO, DEPOIS GRUPO 2)
      const initialLimit = Math.min(3, limitConfig);

      // === ETAPA 1: GRUPO 1 (Slots sem sobra, ex: 8/8) ===
      console.log(`[POST /api/escala/gerar] === INICIANDO AGENDAMENTO GRUPO 1: Sem Sobra/Exatos (Total: ${chavesSemSobra.length}) ===`);
      
      // EXCEÇÃO ABSOLUTA: Agendar diretamente TODOS os candidatos das missas sem sobra (ex: 8/8, 4/4)
      // sem aplicar limite máximo (99) ou regra da semana (true), pois não há excedente para rotacionar/misturar.
      // Apenas mantemos as regras básicas de segurança física de mesma pessoa no mesmo dia e dias seguidos (Sábado/Domingo).
      tentarPreencher(99, true, true, false, false, chavesSemSobra);
      console.log(`[POST /api/escala/gerar] Concluído agendamento direto (exceção) para o Grupo 1`);


       // === ETAPA 2: GRUPO 2 (Slots com sobra, ex: 12/8) ===
       console.log(`[POST /api/escala/gerar] === INICIANDO AGENDAMENTO GRUPO 2: Com Sobra/Ministros a mais (Total: ${chavesComSobra.length}) ===`);
 
       // 2.1 Rodadas normais de escalação (respeitando limites e regras)
       if (limitConfig === 99) {
         // Under Liberado (Livre) mode, we can schedule ministers unlimited times without incremental fairness rounds
         // so that available candidates are fully allocated without being blocked by previous weeks' assignments.
         tentarPreencher(99, true, false, false, false, chavesComSobra);
       } else {
         for (let l = 1; l <= initialLimit; l++) {
           tentarPreencher(l, false, false, false, false, chavesComSobra);
         }
         for (let l = initialLimit + 1; l <= limitConfig; l++) {
           tentarPreencher(l, false, false, false, false, chavesComSobra);
         }
       }
 
       // 2.2 Rodadas com relaxamento da regra da semana
       if (limitConfig !== 99) {
         for (let l = 1; l <= initialLimit; l++) {
           tentarPreencher(l, false, true, false, false, chavesComSobra);
         }
         for (let l = initialLimit + 1; l <= limitConfig; l++) {
           tentarPreencher(l, false, true, false, false, chavesComSobra);
         }
       }
 
       // 2.3 Cleanup final do Grupo 2 (experiência, semana, etc.)
       tentarPreencher(99, true, true, false, false, chavesComSobra); 

      // 5. Logar ministros que tinham disponibilidade mas não foram escalados
      const ministrosComDisp = new Set(disponibilidades.map(d => String(d.ministro_id)));
      const ministrosEscalados = new Set();
      Object.values(slots).forEach((slot: any) => {
        slot.ministros.forEach(m => ministrosEscalados.add(String(m.id)));
      });
      
      const naoEscalados = Array.from(ministrosComDisp).filter(id => !ministrosEscalados.has(id));
      if (naoEscalados.length > 0) {
        const nomesNaoEscalados = naoEscalados.map(id => {
          const m = allMinistros.find(m => String(m.id) === id);
          return m ? m.nome : id;
        });
        console.log(`[POST /api/escala/gerar] Ministros com disponibilidade mas NÃO escalados em NENHUMA missa: ${nomesNaoEscalados.join(', ')}`);
      } else {
        console.log(`[POST /api/escala/gerar] Todos os ministros com disponibilidade foram escalados em pelo menos uma missa.`);
      }

      // 6. Verificar se alguma missa não foi preenchida com a quantidade solicitada
      const missasIncompletas = [];
      Object.values(slots).forEach((slot: any) => {
        if (slot.ocupacao < slot.quantidade) {
          const dataFormatada = slot.data.split('-').reverse().join('/');
          
          const diasSemanaMap = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
          const diaSemanaNome = diasSemanaMap[new Date(slot.data + 'T00:00:00').getDay()];
          
          missasIncompletas.push(`${diaSemanaNome} (${dataFormatada}) às ${slot.horario} - Faltando ${slot.quantidade - slot.ocupacao} vaga(s)`);
        }
      });

      // 6. Formatar para o JSON final esperado pelo frontend
      const escalaFinal = {};
      
      const slotsArray = Object.values(slots).sort((a: any, b: any) => {
        if (a.data !== b.data) return a.data.localeCompare(b.data);
        return a.horario.localeCompare(b.horario);
      });
      
      slotsArray.forEach((slot: any) => {
        if (!escalaFinal[slot.data]) escalaFinal[slot.data] = {};
        
        if (!escalaFinal[slot.data][slot.horario]) {
          escalaFinal[slot.data][slot.horario] = {
            ministros: [],
            nome: slot.nome,
            limiteManual: slot.quantidade,
            lider: ""
          };
        }
        
        slot.ministros.sort((a: any, b: any) => {
          const nameA = typeof a === "string" ? a : a?.nome || "";
          const nameB = typeof b === "string" ? b : b?.nome || "";
          return nameA.localeCompare(nameB, "pt-BR", { sensitivity: "base" });
        });

        // 1. Identificar todos os candidatos qualificados a líder no slot
        const candidatosLider: Array<{ nome: string; isCoord: boolean; count: number; randomVal: number }> = [];

        slot.ministros.forEach((m: any) => {
          const mId = typeof m === "object" && m !== null ? m.id : undefined;
          const mName = typeof m === "string" ? m : m?.nome;
          const mObj = allMinistros.find(min => {
            if (mId && String(min.id) === String(mId)) return true;
            if (!mName) return false;
            if (min.nome === mName || min.nomeExibicao === mName) return true;
            if (min.tipo === 'casal') {
              const c1 = (min.nomeExibicao || min.nome) + " e " + (min.nomeExibicaoConjuge || min.nomeConjuge);
              const c2 = min.nome + " e " + min.nomeConjuge;
              if (mName === c1 || mName === c2) return true;
              const p = mName.split(/\s+e\s+/).map((s: string) => s.trim());
              if (p.length === 2) {
                const match1 = (p[0] === min.nome || p[0] === min.nomeExibicao) && (p[1] === min.nomeConjuge || p[1] === min.nomeExibicaoConjuge);
                const match2 = (p[1] === min.nome || p[1] === min.nomeExibicao) && (p[0] === min.nomeConjuge || p[0] === min.nomeExibicaoConjuge);
                if (match1 || match2) return true;
              }
            }
            return false;
          });
          
          if (mObj) {
            const mModoNorm = typeof m === 'object' && m !== null ? normalizeModo(m.modo) : undefined;
            const isCoord = mObj.role === 'coordenacao' || mObj.role === 'vice_coordenacao';
            const isCasal = mObj.tipo === 'casal' || Boolean(mObj.nomeConjuge || mObj.nomeExibicaoConjuge);
            const nomeEle = mObj.nomeExibicao || mObj.nome || "";
            const nomeEla = mObj.nomeExibicaoConjuge || mObj.nomeConjuge || "";
            const randomVal = randomTieBreaker[String(mObj.id)] || Math.random();

            if (isCoord) {
              if (mModoNorm === 'ela' && nomeEla) {
                candidatosLider.push({ nome: nomeEla, isCoord: true, count: liderancasHistoricas[nomeEla] || 0, randomVal });
              } else if (mModoNorm === 'ele' && nomeEle) {
                candidatosLider.push({ nome: nomeEle, isCoord: true, count: liderancasHistoricas[nomeEle] || 0, randomVal });
              } else if (isCasal && nomeEle && nomeEla) {
                // Ambos na coordenação escalados juntos: adicionar ambos individualmente para rodízio e proporcionalidade justa
                candidatosLider.push({ nome: nomeEle, isCoord: true, count: liderancasHistoricas[nomeEle] || 0, randomVal });
                candidatosLider.push({ nome: nomeEla, isCoord: true, count: liderancasHistoricas[nomeEla] || 0, randomVal });
              } else if (nomeEle) {
                candidatosLider.push({ nome: nomeEle, isCoord: true, count: liderancasHistoricas[nomeEle] || 0, randomVal });
              }
            } else if (isCasal) {
              if (mModoNorm === 'ela' && mObj.isLiderConjuge && nomeEla) {
                candidatosLider.push({ nome: nomeEla, isCoord: false, count: liderancasHistoricas[nomeEla] || 0, randomVal });
              } else if (mModoNorm === 'ele' && mObj.isLider && nomeEle) {
                candidatosLider.push({ nome: nomeEle, isCoord: false, count: liderancasHistoricas[nomeEle] || 0, randomVal });
              } else if (mModoNorm !== 'ela' && mModoNorm !== 'ele') {
                // Casal servindo junto
                if (mObj.isLider && mObj.isLiderConjuge && nomeEle && nomeEla) {
                  // Ambos são líderes cadastrados: candidatar ambos individualmente para rodízio e proporcionalidade
                  candidatosLider.push({ nome: nomeEle, isCoord: false, count: liderancasHistoricas[nomeEle] || 0, randomVal });
                  candidatosLider.push({ nome: nomeEla, isCoord: false, count: liderancasHistoricas[nomeEla] || 0, randomVal });
                } else if (mObj.isLider && nomeEle) {
                  candidatosLider.push({ nome: nomeEle, isCoord: false, count: liderancasHistoricas[nomeEle] || 0, randomVal });
                } else if (mObj.isLiderConjuge && nomeEla) {
                  candidatosLider.push({ nome: nomeEla, isCoord: false, count: liderancasHistoricas[nomeEla] || 0, randomVal });
                }
              }
            } else if (mObj.isLider && nomeEle) {
              candidatosLider.push({ nome: nomeEle, isCoord: false, count: liderancasHistoricas[nomeEle] || 0, randomVal });
            }
          }
        });

        // 2. Escolher o melhor líder com base no rodízio
        let designatedLeader = slot.lider || "";

        if (!designatedLeader && candidatosLider.length > 0) {
          // Ordenar pelo menor número de lideranças históricas no mês (rodízio e proporcionalidade justa)
          // Se houver empate no número de lideranças, prefere coordenação/vice como critério de desempate, e depois ordem aleatória estável
          candidatosLider.sort((a, b) => {
            if (a.count !== b.count) return a.count - b.count;
            if (a.isCoord !== b.isCoord) return a.isCoord ? -1 : 1;
            return a.randomVal - b.randomVal;
          });

          designatedLeader = candidatosLider[0].nome;
        }
        
        if (designatedLeader) {
          // Incrementar contagem para manter o rodízio equilibrado nas próximas missas do mês
          liderancasHistoricas[designatedLeader] = (liderancasHistoricas[designatedLeader] || 0) + 1;
        }

        // 3. Adicionar ministros à escala final
        slot.ministros.forEach((m: any) => {
          const mName = typeof m === "string" ? m : m.nome;
          escalaFinal[slot.data][slot.horario].ministros.push(mName);
        });

        const normDesig = designatedLeader ? designatedLeader.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\*/g, "") : "";
        escalaFinal[slot.data][slot.horario].ministros.sort((a: string, b: string) => {
          const normA = (a || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\*/g, "");
          const normB = (b || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\*/g, "");
          const isALider = normDesig && (normA === normDesig || normA.split(/\s+e\s+/).includes(normDesig));
          const isBLider = normDesig && (normB === normDesig || normB.split(/\s+e\s+/).includes(normDesig));
          if (isALider && !isBLider) return -1;
          if (!isALider && isBLider) return 1;
          return a.localeCompare(b, "pt-BR", { sensitivity: "base" });
        });

        // Fallback: if no assigned minister is explicitly flagged as leader, pick first assigned minister
        if (!designatedLeader && escalaFinal[slot.data][slot.horario].ministros.length > 0) {
          designatedLeader = escalaFinal[slot.data][slot.horario].ministros[0];
        }

        escalaFinal[slot.data][slot.horario].lider = designatedLeader;
      });

      // 7. Mesclar com a escala existente (mantendo meses futuros)
      if (!db.data.escalaGerada) db.data.escalaGerada = {};
      const existingEscala = db.data.escalaGerada[targetParoquia] || {};
      
      const hoje = new Date();
      const mesAtualStr = hoje.toISOString().substring(0, 7);
      
      const novaEscalaMesclada = {};
      let keysRemoved = 0;
      
      // Mantém as datas de outros meses
      Object.keys(existingEscala).forEach(data => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return; // Ignora chaves inválidas
        const dataMes = data.substring(0, 7);
        const isTargetMonth = targetMonthStr && dataMes === targetMonthStr;
        
        if (dataMes >= mesAtualStr && !isTargetMonth) {
          novaEscalaMesclada[data] = existingEscala[data];
        } else if (isTargetMonth) {
          keysRemoved++;
        }
      });
      
      console.log(`[POST /api/escala/gerar] Limpeza concluída: ${keysRemoved} chaves antigas do mês ${targetMonthStr} removidas.`);
      
      // Adiciona a nova escala gerada
      Object.assign(novaEscalaMesclada, escalaFinal);
      console.log(`[POST /api/escala/gerar] Adicionadas ${Object.keys(escalaFinal).length} chaves novas.`);
      
      db.data.escalaGerada[targetParoquia] = novaEscalaMesclada;
      await db.write();

      try {
        const fs = await import('fs');
        const debugInfo = {
          timestamp: new Date().toISOString(),
          targetParoquia,
          targetMonthStr,
          totalMinutosAtivos: ministros.length,
          ministrosAtivos: ministros.map(m => ({ id: m.id, nome: m.nome, tipo: m.tipo, tempo: m.tempoMinisterio, afastado: m.afastado })),
          totalDisponibilidades: disponibilidades.length,
          disponibilidades: disponibilidades.map(d => ({ ministro_id: d.ministro_id, data: d.data, horario: d.horario, nomeMissa: d.nomeMissa })),
          escalaFinal
        };
        fs.writeFileSync('generator_debug.json', JSON.stringify(debugInfo, null, 2));
        console.log('[DEBUG] generator_debug.json escrito com sucesso.');
      } catch (debugErr) {
        console.error('Erro ao escrever log do gerador:', debugErr);
      }
      
      if (missasIncompletas.length > 0) {
        console.log(`[DEBUG] Escala gerada com avisos (incompleta) para o mês ${targetMonthStr}.`);
        return res.status(206).json({
          escala: novaEscalaMesclada,
          warning: 'INCOMPLETE_SCHEDULE',
          message: 'A escala foi gerada, mas algumas missas não possuem ministros suficientes.',
          details: missasIncompletas,
          naoEscalados: naoEscalados.map(id => {
            const m = allMinistros.find(min => String(min.id) === String(id));
            return m ? m.nome : id;
          })
        });
      }

      console.log(`[DEBUG] Escala gerada com sucesso para o mês ${targetMonthStr}.`);
      res.json(novaEscalaMesclada);
    } catch (error) {
      console.error('Erro ao gerar escala (nova versão):', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.post('/api/escala/lider', async (req, res) => {
    const { paroquia: rawParoquia, data, horario, lider } = req.body;
    const paroquia = String(rawParoquia || '').trim();

    if (!paroquia || !data || !horario || lider === undefined) {
      return res.status(400).json({ error: 'Parâmetros paroquia, data, horario e lider são obrigatórios.' });
    }

    try {
      await db.read();
      if (!db.data.escalaGerada) db.data.escalaGerada = {};

      const parNorm = normalize(paroquia);
      let targetP = Object.keys(db.data.escalaGerada).find(p => p.toLowerCase() === paroquia.toLowerCase() || normalize(p) === parNorm);

      if (!targetP) {
        // Create entry for paroquia if not exists
        targetP = paroquia;
        db.data.escalaGerada[targetP] = {};
      }

      if (!db.data.escalaGerada[targetP][data]) {
        return res.status(404).json({ error: 'Data não encontrada na escala.' });
      }

      if (!db.data.escalaGerada[targetP][data][horario]) {
        return res.status(404).json({ error: 'Horário não encontrado na escala.' });
      }

      const currentSlot = db.data.escalaGerada[targetP][data][horario];
      if (Array.isArray(currentSlot)) {
        db.data.escalaGerada[targetP][data][horario] = {
          ministros: currentSlot,
          lider: String(lider).trim()
        };
      } else {
        db.data.escalaGerada[targetP][data][horario].lider = String(lider).trim();
      }

      await db.write();

      console.log(`[POST /api/escala/lider] Líder atualizado para ${paroquia} (${data} às ${horario}): ${lider}`);
      res.json({ success: true, lider: String(lider).trim() });
    } catch (error) {
      console.error('Erro ao atualizar líder da escala:', error);
      res.status(500).json({ error: 'Erro ao atualizar líder da escala.' });
    }
  });

  app.get('/api/escala', async (req, res) => {
    const { paroquia, preview } = req.query;
    if (!paroquia) return res.status(400).json({ error: 'Paróquia é obrigatória.' });

    console.log(`[GET /api/escala] Paroquia: ${paroquia}, Preview: ${preview}`);

    try {
      await db.read();
      
    const targetParoquia = String(paroquia).trim();
    const isPreview = preview === 'true';
    const config = db.data.config || { 
      coordinatorEnabled: false, 
      escalaPublicada: false, 
      escalaPublicadaPorParoquia: {}, 
      escalaPublicadaPorMes: {},
      disponibilidadeAberta: false 
    };
    const escalaPublicadaPorParoquia = config.escalaPublicadaPorParoquia?.[targetParoquia];
    const escalaPublicadaPorMes = (config.escalaPublicadaPorMes && config.escalaPublicadaPorMes[targetParoquia]) || {};

    if (!db.data.escalaGerada) {
      console.log(`[GET /api/escala] db.data.escalaGerada is empty`);
      return res.json({});
    }
    console.log(`[GET /api/escala] Available paroquias in escalaGerada: ${Object.keys(db.data.escalaGerada).join(', ')}`);
    const escalaCompleta = db.data.escalaGerada[targetParoquia] || {};
      console.log(`[GET /api/escala] escalaCompleta keys: ${Object.keys(escalaCompleta).length}`);
      
      const hoje = new Date();
      const mesAtualStr = hoje.toISOString().substring(0, 7);
      
      const escalaFiltrada = Object.create(null);
      Object.keys(escalaCompleta).forEach(data => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return; // Ignora chaves inválidas
        const mes = data.substring(0, 7);
        
        // Se for preview (admin/coordenação), mostra tudo o que estiver no banco para aquela paróquia,
        // mas respeita a regra de remover meses anteriores ao atual.
        if (isPreview) {
          if (mes >= mesAtualStr) {
            escalaFiltrada[data] = escalaCompleta[data];
          }
        } else {
          // Para ministros, mostra o mês atual ou se estiver publicado
          let isMesPublicado = !!escalaPublicadaPorMes[mes] || !!escalaPublicadaPorParoquia || !!db.data.config.escalaPublicada;
          
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
              slot.ministros.sort((a: any, b: any) => {
                const nameA = typeof a === "string" ? a : a?.nome || "";
                const nameB = typeof b === "string" ? b : b?.nome || "";
                return nameA.localeCompare(nameB, "pt-BR", { sensitivity: "base" });
              });
            }
          });
        }
      });

      console.log(`[GET /api/escala] escalaFiltrada keys (mesAtualStr=${mesAtualStr}): ${Object.keys(escalaFiltrada).length}, isPreview: ${isPreview}, targetParoquia: ${targetParoquia}, !!escalaPublicadaPorParoquia=${!!escalaPublicadaPorParoquia}, config.escalaPublicada=${db.data.config.escalaPublicada}`);
      res.json(escalaFiltrada);
    } catch (error) {
      console.error('Erro ao buscar escala:', error);
      res.status(500).json({ error: 'Erro interno do servidor.', details: String(error) });
    }
  });

  app.post('/api/escala/enviar-lembretes-fim-de-semana', async (req, res) => {
    const { paroquia } = req.body;
    if (!paroquia) {
      return res.status(400).json({ error: 'Paróquia é obrigatória.' });
    }

    try {
      await db.read();
      const targetParoquia = String(paroquia).trim();

      if (!db.data.escalaGerada || !db.data.escalaGerada[targetParoquia]) {
        return res.json({ sentCount: 0, message: 'Nenhuma escala gerada encontrada para esta paróquia.' });
      }

      // Find the dates for this weekend: Friday, Saturday, Sunday
      const today = new Date();
      const day = today.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
      
      const friday = new Date(today);
      const saturday = new Date(today);
      const sunday = new Date(today);
      
      if (day === 0) { // Sunday
        friday.setDate(today.getDate() - 2);
        saturday.setDate(today.getDate() - 1);
      } else if (day === 5) { // Friday
        saturday.setDate(today.getDate() + 1);
        sunday.setDate(today.getDate() + 2);
      } else if (day === 6) { // Saturday
        friday.setDate(today.getDate() - 1);
        sunday.setDate(today.getDate() + 1);
      } else { // Monday to Thursday: upcoming weekend
        friday.setDate(today.getDate() + (5 - day));
        saturday.setDate(today.getDate() + (6 - day));
        sunday.setDate(today.getDate() + (7 - day));
      }
      
      const formatDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dy = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dy}`;
      };

      const weekendDates = [formatDate(friday), formatDate(saturday), formatDate(sunday)];
      console.log(`[Manual Weekend Reminder] Finding schedules for dates: ${weekendDates.join(', ')}`);

      let sentCount = 0;
      let dbUpdated = false;

      if (!db.data.mensagens) db.data.mensagens = [];

      for (const data of weekendDates) {
        const slotsNoDia = db.data.escalaGerada[targetParoquia][data];
        if (!slotsNoDia) continue;

        for (const horario of Object.keys(slotsNoDia)) {
          const missa = slotsNoDia[horario];
          if (!missa || !missa.ministros) continue;

          for (const escMin of missa.ministros) {
            const matchResult = findMinistroByNomeOrId(escMin, targetParoquia);
            if (!matchResult || matchResult.targetPhones.length === 0) continue;

            const { ministro, targetPhones } = matchResult;
            const nomeEscala = (typeof escMin === 'object' && escMin !== null) ? (escMin.nome || '') : String(escMin);
            const dateBr = data.split('-').reverse().join('/');
            
            const isEleLider = Boolean(ministro.isLider || ministro.role === 'coordenacao' || ministro.role === 'vice_coordenacao' || ministro.role === 'admin');
            const isElaLider = Boolean(ministro.isLiderConjuge || ministro.role === 'coordenacao' || ministro.role === 'vice_coordenacao' || ministro.role === 'admin');
            const rawLider = typeof missa.lider === 'object' && missa.lider !== null ? (missa.lider.nome || '') : String(missa.lider || '');
            const isLiderValid = rawLider && rawLider !== 'Não definido' && rawLider !== 'Líder da Missa' && rawLider !== 'Coordenação';
            
            let isLider = false;
            if (isLiderValid) {
              if (typeof missa.lider === 'object' && missa.lider !== null && missa.lider.id && String(missa.lider.id) === String(ministro.id)) {
                isLider = isEleLider || isElaLider;
              } else {
                const normL = normalize(rawLider);
                if (normL === normalize(nomeEscala)) {
                  isLider = isEleLider || isElaLider;
                } else if (normL === normalize(ministro.nome || '') || normL === normalize(ministro.nomeExibicao || '')) {
                  isLider = isEleLider;
                } else if (normL === normalize(ministro.nomeConjuge || '') || normL === normalize(ministro.nomeExibicaoConjuge || '')) {
                  isLider = isElaLider;
                }
              }
            }
            const msgTexto = isLider
              ? `Olá, ${nomeEscala}! Lembrete de Líder: Você é o LÍDER da missa das ${horario} (${dateBr} - ${missa.nome || 'Missa'}). Lembre-se de chegar com antecedência para conferir alfaias e a equipe. Contamos com a sua presença! Amém.`
              : `Olá, ${nomeEscala}! Lembrete Diário: você está escalado em breve (${dateBr}) na missa de ${horario} (${missa.nome || 'Missa'}). Obrigado e nos vemos na missa! Amém.`;

            for (const phone of targetPhones) {
              const jaNotificado = db.data.mensagens.some(msg => 
                msg.type === 'private' && 
                String(msg.destinatario_telefone).replace(/\D/g, '') === phone &&
                msg.texto.includes(dateBr) &&
                msg.texto.includes(horario)
              );

              if (!jaNotificado) {
                db.data.mensagens.push({
                  id: Date.now() + Math.floor(Math.random() * 1000),
                  nome: 'Coordenação Paroquial',
                  telefone: '00000000000',
                  destinatario_telefone: phone,
                  texto: msgTexto,
                  paroquia: targetParoquia,
                  type: 'private',
                  data: new Date().toISOString()
                });
                sentCount++;
                dbUpdated = true;

                sendPushNotificationToUser(phone, isLider ? 'Lembrete de Líder ⭐' : 'Lembrete de Escala 📅', msgTexto, '/', targetParoquia);
              }
            }
          }
        }
      }

      if (dbUpdated) {
        await db.write();
      }

      res.json({ sentCount, message: `Lembretes enviados com sucesso para ${sentCount} ministros.` });
    } catch (error) {
      console.error('Erro ao enviar lembretes manuais de fim de semana:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.get('/api/fix-escala-june', async (req, res) => {
    try {
      await db.read();
      if (db.data.escalaGerada) {
        const paroquias = Object.keys(db.data.escalaGerada);
        let fixedCount = 0;
        paroquias.forEach(par => {
          const escala = db.data.escalaGerada[par];
          // Sábado, 6 de junho às 17:00
          if (escala['2026-06-06'] && escala['2026-06-06']['17:00']) {
            console.log(`[FIX] Fixing Saturday for paroquia ${par}`);
            escala['2026-06-06']['17:00'].ministros = escala['2026-06-06']['17:00'].ministros.map((m: string) => {
              if (m.includes('Valter') || m.includes('Sônia')) return 'Sônia';
              return m;
            });
            // Adicional: garantir que se houver dois "Sônia" (por falha de lógica anterior), fique apenas um.
            escala['2026-06-06']['17:00'].ministros = Array.from(new Set(escala['2026-06-06']['17:00'].ministros));
            fixedCount++;
          }
          // Domingo, 7 de junho às 10:00
          if (escala['2026-06-07'] && escala['2026-06-07']['10:00']) {
            console.log(`[FIX] Fixing Sunday for paroquia ${par}`);
            escala['2026-06-07']['10:00'].ministros = escala['2026-06-07']['10:00'].ministros.map((m: string) => {
              if (m.toLowerCase() === 'sônia') return 'Cristiane';
              return m;
            });
            fixedCount++;
          }
        });
        await db.write();
        res.send(`Fixed in ${fixedCount} locations across ${paroquias.length} paroquias`);
      } else {
        res.send('No data');
      }
    } catch (e) {
      console.error(e);
      res.status(500).send('Error');
    }
  });

  // ==========================================
  // SWAPS API (SISTEMA DE TROCAS DE MISSAS)
  // ==========================================
  app.get('/api/trocas', async (req, res) => {
    let { paroquia, ministroId } = req.query;
    if (!paroquia || paroquia === 'undefined' || paroquia === 'null') {
      return res.status(403).json({ error: 'Paróquia não informada ou inválida.' });
    }
    try {
      await db.read();
      let trocas = db.data.trocas || [];

      // Deduplicate by ID to clean any database duplication and prevent duplicates in responses
      const seenIds = new Set();
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
        db.data.trocas = uniqueTrocas;
        await db.write();
        trocas = uniqueTrocas;
      }
      
      // Filter by paroquia
      const targetParoquia = normalize(String(paroquia));
      trocas = trocas.filter(t => t && t.paroquia && normalize(t.paroquia) === targetParoquia);
      
      // Filter by ministro if provided
      if (ministroId) {
        const mId = Number(ministroId);
        trocas = trocas.filter(t => t.solicitanteId === mId || t.destinatarioId === mId);
      }
      
      res.json(trocas);
    } catch (error) {
      console.error('Erro ao buscar trocas:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });



  app.post('/api/trocas', async (req, res) => {
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
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    if (segundoDestinatarioId) {
      if (String(destinatarioId) === String(segundoDestinatarioId) || (destinatarioNome && segundoDestinatarioNome && String(destinatarioNome).trim().toLowerCase() === String(segundoDestinatarioNome).trim().toLowerCase())) {
        return res.status(400).json({ error: 'Não é possível selecionar o mesmo ministro para ambos os slots.' });
      }
    }

    try {
      await db.read();
      if (!db.data.trocas) db.data.trocas = [];

      const novaTroca = {
        id: 't_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        paroquia: String(paroquia),
        solicitanteId: Number(solicitanteId),
        solicitanteNome: String(solicitanteNome),
        solicitanteTelefone: String(solicitanteTelefone),
        missaOrigemData: String(missaOrigemData),
        missaOrigemHorario: String(missaOrigemHorario),
        missaOrigemMissa: String(missaOrigemMissa),
        tipo: tipo as 'direta' | 'substituto',
        destinatarioId: Number(destinatarioId),
        destinatarioNome: String(destinatarioNome),
        destinatarioTelefone: String(destinatarioTelefone),
        missaDestinoData: missaDestinoData ? String(missaDestinoData) : undefined,
        missaDestinoHorario: missaDestinoHorario ? String(missaDestinoHorario) : undefined,
        missaDestinoMissa: missaDestinoMissa ? String(missaDestinoMissa) : undefined,
        status: 'pendente_destinatario' as any,
        dataSolicitacao: new Date().toISOString(),
        solicitanteSubMembro: solicitanteSubMembro || 'ambos',
        destinatarioSubMembro: destinatarioSubMembro || 'ambos',
        segundoDestinatarioId: segundoDestinatarioId ? Number(segundoDestinatarioId) : undefined,
        segundoDestinatarioNome: segundoDestinatarioNome ? String(segundoDestinatarioNome) : undefined,
        segundoDestinatarioTelefone: segundoDestinatarioTelefone ? String(segundoDestinatarioTelefone) : undefined
      };

      db.data.trocas.push(novaTroca);
      await db.write();

      if (!db.data.mensagens) db.data.mensagens = [];
      const msgTexto = `⚠️ [Solicitação de Troca] O ministro ${solicitanteNome} solicitou troca para a missa do dia ${missaOrigemData.split('-').reverse().join('/')} às ${missaOrigemHorario} com o ministro ${destinatarioNome}.`;
      
      db.data.mensagens.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        nome: 'Sistema',
        telefone: '0000000000',
        destinatario_telefone: destinatarioTelefone || null,
        texto: msgTexto,
        data: new Date().toISOString(),
        paroquia: String(paroquia),
        type: 'private',
        lida: false
      });
      await db.write();

      // Enviar notificação Web Push
      if (destinatarioTelefone) {
        sendPushNotificationToUser(destinatarioTelefone, 'Solicitação de Troca 🔄', `O ministro ${solicitanteNome} solicitou troca com você para o dia ${missaOrigemData.split('-').reverse().join('/')}.`, '/', paroquia);
      }

      res.status(201).json(novaTroca);
    } catch (error) {
      console.error('Erro ao solicitar troca:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.post('/api/trocas/:id/responder-ministro', async (req, res) => {
    const { id } = req.params;
    const { resposta } = req.body; // 'aceitar' | 'rejeitar'

    if (!resposta || (resposta !== 'aceitar' && resposta !== 'rejeitar')) {
      return res.status(400).json({ error: 'Resposta inválida.' });
    }

    try {
      await db.read();
      const trocas = db.data.trocas || [];
      const troca = trocas.find(t => t.id === id);

      if (!troca) return res.status(404).json({ error: 'Troca não encontrada.' });

      if (troca.status !== 'pendente_destinatario') {
        return res.status(400).json({ error: 'Essa troca não está pendente de resposta do ministro destinatário.' });
      }

      let msgTexto = '';
      if (resposta === 'aceitar') {
        troca.status = 'pendente_coordenacao' as any;
        msgTexto = `O ministro ${troca.destinatarioNome} ACEITOU a solicitação de troca do dia ${troca.missaOrigemData.split('-').reverse().join('/')} às ${troca.missaOrigemHorario}! Agora aguarda aprovação da coordenação.`;
      } else {
        troca.status = 'rejeitado_destinatario' as any;
        msgTexto = `O ministro ${troca.destinatarioNome} recusou a solicitação de troca do dia ${troca.missaOrigemData.split('-').reverse().join('/')} às ${troca.missaOrigemHorario}.`;
      }

      if (!db.data.mensagens) db.data.mensagens = [];
      db.data.mensagens.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        nome: 'Sistema',
        telefone: '0000000000',
        destinatario_telefone: troca.solicitanteTelefone || null,
        texto: msgTexto,
        data: new Date().toISOString(),
        paroquia: String(troca.paroquia),
        type: 'private',
        lida: false
      });

      // If accepted, also notify coordinator
      const paroquiaObj = db.data.paroquias?.find(p => p.nome === troca.paroquia);
      const coordTelefone = paroquiaObj?.telefoneCoordenador;

      if (resposta === 'aceitar' && coordTelefone) {
        db.data.mensagens.push({
          id: Date.now() + Math.floor(Math.random() * 1001),
          nome: 'Sistema',
          telefone: '0000000000',
          destinatario_telefone: coordTelefone,
          texto: `⚠️ Nova troca aguardando aprovação: O ministro ${troca.destinatarioNome} aceitou a troca com ${troca.solicitanteNome} para o dia ${troca.missaOrigemData.split('-').reverse().join('/')} às ${troca.missaOrigemHorario}.`,
          data: new Date().toISOString(),
          paroquia: String(troca.paroquia),
          type: 'private',
          lida: false
        });
      }

      await db.write();

      // Enviar notificação Web Push
      if (troca.solicitanteTelefone) {
        sendPushNotificationToUser(troca.solicitanteTelefone, resposta === 'aceitar' ? 'Troca Aceita! ✅' : 'Troca Recusada ❌', msgTexto, '/', troca.paroquia);
      }
      if (resposta === 'aceitar' && coordTelefone) {
        sendPushNotificationToUser(coordTelefone, 'Troca Aguardando Aprovação ⚠️', `O ministro ${troca.destinatarioNome} aceitou a troca com ${troca.solicitanteNome}.`, '/', troca.paroquia);
      }

      res.json(troca);
    } catch (error) {
      console.error('Erro ao responder como ministro:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.post('/api/trocas/:id/responder-coordenador', async (req, res) => {
    const { id } = req.params;
    const { resposta } = req.body; // 'aprovar' | 'rejeitar'

    if (!resposta || (resposta !== 'aprovar' && resposta !== 'rejeitar')) {
      return res.status(400).json({ error: 'Resposta inválida.' });
    }

    try {
      await db.read();
      const trocas = db.data.trocas || [];
      const troca = trocas.find(t => t.id === id);

      if (!troca) return res.status(404).json({ error: 'Troca não encontrada.' });
      if (troca.status !== 'pendente_coordenacao' && troca.status !== 'pendente_destinatario') {
        return res.status(400).json({ error: 'Essa troca não está pendente de aprovação.' });
      }

      if (resposta === 'rejeitar') {
        troca.status = 'rejeitado_coordenacao';
        const msgTexto = `❌ [Troca Recusada] A coordenação não aprovou a sua solicitação de troca para a missa do dia ${troca.missaOrigemData.split('-').reverse().join('/')} às ${troca.missaOrigemHorario}.`;
        if (!db.data.mensagens) db.data.mensagens = [];
        db.data.mensagens.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          nome: 'Sistema',
          telefone: '0000000000',
          destinatario_telefone: troca.solicitanteTelefone || null,
          texto: msgTexto,
          data: new Date().toISOString(),
          paroquia: String(troca.paroquia),
          type: 'private',
          lida: false
        });
        await db.write();
        // Web Push notification trigger for coordinator exchange refusal has been removed as requested.
        return res.json(troca);
      }

      // Se resposta for 'aprovar':
      troca.status = 'aprovado';

      const { paroquia, missaOrigemData, missaOrigemHorario, solicitanteId, destinatarioId } = troca;
      
      if (db.data.escalaGerada && db.data.escalaGerada[paroquia]) {
        const paroquiaEscala = db.data.escalaGerada[paroquia];
        
        // LEG 1: Update the origin slot
        if (paroquiaEscala[missaOrigemData] && paroquiaEscala[missaOrigemData][missaOrigemHorario]) {
          const slot = paroquiaEscala[missaOrigemData][missaOrigemHorario];
          if (!slot.ministros) slot.ministros = [];
          const slotMinistros = slot.ministros;
          
          const solMin = db.data.ministros.find((m: any) => Number(m.id) === Number(solicitanteId));
          const destMin = db.data.ministros.find((m: any) => Number(m.id) === Number(destinatarioId));
          
          if (solMin) {
            const solName1 = normalize(solMin.nome);
            const solName2 = normalize(solMin.nomeExibicao || solMin.nome);
            const solName3 = normalize(solMin.nomeConjuge || '');
            const solName4 = normalize(solMin.nomeExibicaoConjuge || '');
            const combinedSol = normalize(`${solMin.nomeExibicao || solMin.nome} e ${solMin.nomeExibicaoConjuge || solMin.nomeConjuge}`);
            
            const matchIndex = slotMinistros.findIndex((mName: string) => {
              const nmName = normalize(mName);
              return (
                nmName === solName1 ||
                nmName === solName2 ||
                nmName === solName3 ||
                nmName === solName4 ||
                nmName === combinedSol ||
                nmName.includes(solName2) ||
                nmName.includes(solName1)
              );
            });
          
            let destDisplayName = destMin ? (destMin.nomeExibicao || destMin.nome) : "";
            const tAny = troca as any;
            if (destMin && destMin.tipo === 'casal' && (!tAny.destinatarioSubMembro || tAny.destinatarioSubMembro === 'ambos')) {
              destDisplayName = `${destMin.nomeExibicao || destMin.nome} e ${destMin.nomeExibicaoConjuge || destMin.nomeConjuge}`;
            } else if (destMin && destMin.tipo === 'casal' && tAny.destinatarioSubMembro === 'marido') {
              destDisplayName = destMin.nomeExibicao || destMin.nome;
            } else if (destMin && destMin.tipo === 'casal' && tAny.destinatarioSubMembro === 'esposa') {
              destDisplayName = destMin.nomeExibicaoConjuge || destMin.nomeConjuge;
            }

            const subMembro = tAny.solicitanteSubMembro || 'ambos'; // 'ambos' | 'marido' | 'esposa'

            if (solMin.tipo === 'casal' && subMembro !== 'ambos' && matchIndex !== -1) {
              // PARTIAL COUPLE SWAP - ORIGIN
              const maridoName = solMin.nomeExibicao || solMin.nome;
              const esposaName = solMin.nomeExibicaoConjuge || solMin.nomeConjuge;
              const originalStr = slotMinistros[matchIndex];
              
              if (subMembro === 'marido') {
                const hasEsposa = originalStr && (
                  normalize(originalStr).includes(normalize(esposaName)) ||
                  (solMin.nomeConjuge && normalize(originalStr).includes(normalize(solMin.nomeConjuge))) ||
                  (solMin.nomeExibicaoConjuge && normalize(originalStr).includes(normalize(solMin.nomeExibicaoConjuge)))
                );
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
              } else if (subMembro === 'esposa') {
                const hasMarido = originalStr && (
                  normalize(originalStr).includes(normalize(maridoName)) ||
                  (solMin.nome && normalize(originalStr).includes(normalize(solMin.nome))) ||
                  (solMin.nomeExibicao && normalize(originalStr).includes(normalize(solMin.nomeExibicao)))
                );
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
              // FULL SWAP / STANDARD SWAP - ORIGIN
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

        // LEG 2: For mutual/direct swaps, update the destination slot as well!
        if (troca.tipo === 'direta' && troca.missaDestinoData && troca.missaDestinoHorario) {
          const destData = troca.missaDestinoData;
          const destHorario = troca.missaDestinoHorario;
          if (paroquiaEscala[destData] && paroquiaEscala[destData][destHorario]) {
            const slotDest = paroquiaEscala[destData][destHorario];
            if (!slotDest.ministros) slotDest.ministros = [];
            const slotMinistrosDest = slotDest.ministros;

            const solMin = db.data.ministros.find((m: any) => Number(m.id) === Number(solicitanteId));
            const destMin = db.data.ministros.find((m: any) => Number(m.id) === Number(destinatarioId));

            if (destMin) {
              const destName1 = normalize(destMin.nome);
              const destName2 = normalize(destMin.nomeExibicao || destMin.nome);
              const destName3 = normalize(destMin.nomeConjuge || '');
              const destName4 = normalize(destMin.nomeExibicaoConjuge || '');
              const combinedDest = normalize(`${destMin.nomeExibicao || destMin.nome} e ${destMin.nomeExibicaoConjuge || destMin.nomeConjuge}`);

              const matchIndexDest = slotMinistrosDest.findIndex((mName: string) => {
                const nmName = normalize(mName);
                return (
                  nmName === destName1 ||
                  nmName === destName2 ||
                  nmName === destName3 ||
                  nmName === destName4 ||
                  nmName === combinedDest ||
                  nmName.includes(destName2) ||
                  nmName.includes(destName1)
                );
              });

              const tAny = troca as any;
              let solDisplayName = solMin ? (solMin.nomeExibicao || solMin.nome) : "";
              if (solMin && solMin.tipo === 'casal' && (!tAny.solicitanteSubMembro || tAny.solicitanteSubMembro === 'ambos')) {
                solDisplayName = `${solMin.nomeExibicao || solMin.nome} e ${solMin.nomeExibicaoConjuge || solMin.nomeConjuge}`;
              } else if (solMin && solMin.tipo === 'casal' && tAny.solicitanteSubMembro === 'marido') {
                solDisplayName = solMin.nomeExibicao || solMin.nome;
              } else if (solMin && solMin.tipo === 'casal' && tAny.solicitanteSubMembro === 'esposa') {
                solDisplayName = solMin.nomeExibicaoConjuge || solMin.nomeConjuge;
              }

              const destSubMembro = tAny.destinatarioSubMembro || 'ambos';

              if (destMin.tipo === 'casal' && destSubMembro !== 'ambos' && matchIndexDest !== -1) {
                const maridoName = destMin.nomeExibicao || destMin.nome;
                const esposaName = destMin.nomeExibicaoConjuge || destMin.nomeConjuge;
                const originalStr = slotMinistrosDest[matchIndexDest];

                if (destSubMembro === 'marido') {
                  const hasEsposa = originalStr && (
                    normalize(originalStr).includes(normalize(esposaName)) ||
                    (destMin.nomeConjuge && normalize(originalStr).includes(normalize(destMin.nomeConjuge))) ||
                    (destMin.nomeExibicaoConjuge && normalize(originalStr).includes(normalize(destMin.nomeExibicaoConjuge)))
                  );
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
                } else if (destSubMembro === 'esposa') {
                  const hasMarido = originalStr && (
                    normalize(originalStr).includes(normalize(maridoName)) ||
                    (destMin.nome && normalize(originalStr).includes(normalize(destMin.nome))) ||
                    (destMin.nomeExibicao && normalize(originalStr).includes(normalize(destMin.nomeExibicao)))
                  );
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
      }

      await db.write();

      // Enviar mensagem celebrando o sucesso da troca
      if (!db.data.mensagens) db.data.mensagens = [];
      db.data.mensagens.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        nome: 'Sistema',
        telefone: '0000000000',
        destinatario_telefone: troca.solicitanteTelefone || null,
        texto: `✅ [Troca Aprovada] A coordenação aprovou a sua troca para a missa do dia ${troca.missaOrigemData.split('-').reverse().join('/')} às ${troca.missaOrigemHorario}. O ministro ${troca.destinatarioNome} agora está escalado em seu lugar!`,
        data: new Date().toISOString(),
        paroquia: String(troca.paroquia),
        type: 'private',
        lida: false
      });

      if (troca.destinatarioTelefone) {
        db.data.mensagens.push({
          id: Date.now() + Math.floor(Math.random() * 1001),
          nome: 'Sistema',
          telefone: '0000000000',
          destinatario_telefone: troca.destinatarioTelefone,
          texto: `✅ [Troca Aprovada] A coordenação aprovou a troca para a missa do dia ${troca.missaOrigemData.split('-').reverse().join('/')} às ${troca.missaOrigemHorario}. Você agora está escalado no lugar de ${troca.solicitanteNome}!`,
          data: new Date().toISOString(),
          paroquia: String(troca.paroquia),
          type: 'private',
          lida: false
        });
      }
      await db.write();

      // Enviar notificação Web Push
      if (troca.solicitanteTelefone) {
        sendPushNotificationToUser(troca.solicitanteTelefone, 'Troca Aprovada! ✅', `A coordenação aprovou a sua troca com ${troca.destinatarioNome}.`, '/', troca.paroquia);
      }
      if (troca.destinatarioTelefone) {
        sendPushNotificationToUser(troca.destinatarioTelefone, 'Troca Aprovada! ✅', `A coordenação aprovou a sua troca com ${troca.solicitanteNome}.`, '/', troca.paroquia);
      }

      res.json(troca);
    } catch (error) {
      console.error('Erro ao responder como coordenador:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.post('/api/trocas/rapida', async (req, res) => {
    const { paroquia: rawParoquia, slotA, slotB } = req.body;
    const paroquia = String(rawParoquia).trim();
    
    if (!paroquia || !slotA || !slotB) {
      return res.status(400).json({ error: 'Parâmetros paroquia, slotA e slotB são obrigatórios.' });
    }

    try {
      await db.read();
      if (!db.data.escalaGerada) db.data.escalaGerada = {};
      
      const parNorm = normalize(paroquia);
      let parEscala = db.data.escalaGerada[paroquia] || db.data.escalaGerada[parNorm];
      
      if (!parEscala) {
        return res.status(404).json({ error: `Escala não encontrada para a paróquia "${paroquia}".` });
      }

      const sA = parEscala[slotA.date]?.[slotA.time];
      
      if (!sA) {
        return res.status(404).json({ error: 'Horário A não encontrado na escala.' });
      }

      const getMemberName = (slot: any) => {
        if (slot.tipo === 'casal') {
          if (slot.member === 'c1') return slot.conjuge1 || slot.ministerName?.split(/\s+e\s+/i)[0]?.trim() || slot.name?.split(/\s+e\s+/i)[0]?.trim();
          if (slot.member === 'c2') return slot.conjuge2 || slot.ministerName?.split(/\s+e\s+/i)[1]?.trim() || slot.name?.split(/\s+e\s+/i)[1]?.trim();
        }
        return slot.isMinister ? slot.name : slot.ministerName;
      };

      const getReplacementStrings = (fullString: string, slot: any, incomingSlot: any): string[] => {
        const nameToRemove = getMemberName(slot);
        const nameToInsert = getMemberName(incomingSlot);

        if (slot.tipo === 'casal' && slot.member !== 'both') {
          // Splitting a couple
          const spouse1 = normalize(slot.conjuge1);
          const spouse2 = normalize(slot.conjuge2);
          const parts = fullString.split(/\s+e\s+/i);
          
          let remaining = '';
          if (parts.length === 2) {
            if (normalize(parts[0]) === normalize(nameToRemove)) remaining = parts[1];
            else if (normalize(parts[1]) === normalize(nameToRemove)) remaining = parts[0];
          }
          
          if (!remaining) {
            // Fallback if split didn't work as expected
            remaining = (normalize(nameToRemove) === spouse1) ? slot.conjuge2 : slot.conjuge1;
          }

          // Check if incoming is actually the spouse (unlikely but possible)
          if (incomingSlot.tipo === 'casal' && incomingSlot.member !== 'both') {
             // If we are replacing one spouse with another spouse from a different context? 
             // Unlikely. Let's just return them separate.
             return [remaining, nameToInsert];
          }
          
          return [remaining, nameToInsert];
        }

        // Direct replacement
        return [nameToInsert];
      };

      if (slotB.isMinister) {
        // Precise replacement
        const nameToInsert = getMemberName(slotB);
        const nameToRemove = getMemberName(slotA);
        
        if (sA.ministros && Array.isArray(sA.ministros)) {
          const idx = sA.ministros.findIndex(m => normalize(m) === normalize(slotA.ministerName));
          
          if (idx !== -1) {
            const newEntries = getReplacementStrings(sA.ministros[idx], slotA, slotB);
            sA.ministros.splice(idx, 1, ...newEntries);
          } else {
            // Fallback: search for a minister that contains the removed name
            const fallbackIdx = sA.ministros.findIndex(m => normalize(m).includes(normalize(nameToRemove)));
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

        // Add history
        if (!db.data.trocas) db.data.trocas = [];
        db.data.trocas.push({
          id: Date.now().toString(),
          paroquia,
          solicitanteId: 0,
          solicitanteNome: 'Coordenação (Troca Rápida)',
          solicitanteTelefone: '',
          missaOrigemData: slotA.date,
          missaOrigemHorario: slotA.time,
          missaOrigemMissa: sA.nome || 'Missa',
          tipo: 'direta',
          destinatarioId: 0,
          destinatarioNome: 'Coordenação',
          destinatarioTelefone: '',
          missaDestinoData: '',
          missaDestinoHorario: '',
          missaDestinoMissa: `Substituição: ${nameToRemove} por ${nameToInsert} (Não escalado)`,
          status: 'aprovado',
          dataSolicitacao: new Date().toISOString(),
          confirmadoSolicitante: true,
          confirmadoDestinatario: true
        });
        
        await db.write();
        return res.json({ success: true, slotA: sA });
      }

      const sB = parEscala[slotB.date]?.[slotB.time];

      if (!sB) {
        return res.status(404).json({ error: 'Horário B não encontrado na escala.' });
      }

      // Perform precise swap
      if (sA.ministros && Array.isArray(sA.ministros)) {
        const idxA = sA.ministros.findIndex(m => normalize(m) === normalize(slotA.ministerName));
        if (idxA !== -1) {
          const newEntriesA = getReplacementStrings(sA.ministros[idxA], slotA, slotB);
          sA.ministros.splice(idxA, 1, ...newEntriesA);
        }
      }
      if (sB.ministros && Array.isArray(sB.ministros)) {
        const idxB = sB.ministros.findIndex(m => normalize(m) === normalize(slotB.ministerName));
        if (idxB !== -1) {
          const newEntriesB = getReplacementStrings(sB.ministros[idxB], slotB, slotA);
          sB.ministros.splice(idxB, 1, ...newEntriesB);
        }
      }

      // Add history record in trocas
      if (!db.data.trocas) db.data.trocas = [];
      const newTrocaId = Date.now().toString();
      db.data.trocas.push({
        id: newTrocaId,
        paroquia,
        solicitanteId: 0,
        solicitanteNome: 'Coordenação (Troca Rápida)',
        solicitanteTelefone: '',
        missaOrigemData: slotA.date,
        missaOrigemHorario: slotA.time,
        missaOrigemMissa: sA.nome || 'Missa',
        tipo: 'direta',
        destinatarioId: 0,
        destinatarioNome: 'Coordenação',
        destinatarioTelefone: '',
        missaDestinoData: slotB.date,
        missaDestinoHorario: slotB.time,
        missaDestinoMissa: sB.nome || 'Missa',
        status: 'aprovado',
        dataSolicitacao: new Date().toISOString(),
        confirmadoSolicitante: true,
        confirmadoDestinatario: true
      });

      await db.write();
      res.json({ success: true, slotA: sA, slotB: sB });
    } catch (error) {
      console.error('Erro em troca rápida:', error);
      res.status(500).json({ error: 'Erro interno ao processar troca rápida.' });
    }
  });

  app.post('/api/trocas/:id/confirmar-leitura', async (req, res) => {
    const { id } = req.params;
    const { ministroId } = req.body;

    if (!ministroId) return res.status(400).json({ error: 'Ministro ID é requerido.' });

    try {
      await db.read();
      const trocas = db.data.trocas || [];
      const troca = trocas.find(t => t.id === id);

      if (!troca) return res.status(404).json({ error: 'Troca não encontrada.' });

      const mId = Number(ministroId);
      if (troca.solicitanteId === mId) {
        troca.confirmadoSolicitante = true;
      }
      if (troca.destinatarioId === mId) {
        troca.confirmadoDestinatario = true;
      }

      await db.write();
      res.json(troca);
    } catch (error) {
      console.error('Erro ao confirmar leitura:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.get('/api/debug-db', async (req, res) => {
    try {
      await db.read();
      let logContent = '';
      try {
        logContent = require('fs').readFileSync('src/msg.log', 'utf8');
      } catch (e) {
        logContent = 'Log file not found or empty';
      }
      res.json({ mensagens: db.data.mensagens, logs: logContent });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/mensagens', async (req, res) => {
    const { paroquia, type } = req.query;
    try {
      await db.read();
      if (!db.data.mensagens) return res.json([]);

      const agora = new Date();
      
      const parseMsgDate = (dateStr: string) => {
        if (!dateStr) return new Date(0);
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
        return new Date(0);
      };

      const isOlderThan3Days = (dateStr: string) => {
        const msgDate = parseMsgDate(dateStr);
        if (isNaN(msgDate.getTime()) || msgDate.getTime() === 0) return true;
        const diffTime = agora.getTime() - msgDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays > 3;
      };

      const cleanQueryTel = req.query.telefone ? String(req.query.telefone).replace(/\D/g, '') : '';

      // Encontra todos os números de telefone associados a este ministro/casal
      let ministerPhoneNumbers: string[] = [];
      if (cleanQueryTel) {
        ministerPhoneNumbers.push(cleanQueryTel);
        if (db.data.ministros) {
          const matchingMinister = db.data.ministros.find((m: any) => {
            const mTel1 = m.telefone ? String(m.telefone).replace(/\D/g, '') : '';
            const mTel2 = m.telefoneConjuge ? String(m.telefoneConjuge).replace(/\D/g, '') : '';
            return mTel1 === cleanQueryTel || mTel2 === cleanQueryTel;
          });
          if (matchingMinister) {
            const mTel1 = matchingMinister.telefone ? String(matchingMinister.telefone).replace(/\D/g, '') : '';
            const mTel2 = matchingMinister.telefoneConjuge ? String(matchingMinister.telefoneConjuge).replace(/\D/g, '') : '';
            if (mTel1 && !ministerPhoneNumbers.includes(mTel1)) ministerPhoneNumbers.push(mTel1);
            if (mTel2 && !ministerPhoneNumbers.includes(mTel2)) ministerPhoneNumbers.push(mTel2);
          }
        }
      }

      // Filter active messages
      const isCoordOrAdmin = db.data.ministros?.some((m: any) => {
        const mTel1 = m.telefone ? String(m.telefone).replace(/\D/g, '') : '';
        const mTel2 = m.telefoneConjuge ? String(m.telefoneConjuge).replace(/\D/g, '') : '';
        const matches = (mTel1 && mTel1 === cleanQueryTel) || (mTel2 && mTel2 === cleanQueryTel);
        return matches && (m.role === 'coordenacao' || m.role === 'admin' || m.role === 'vice_coordenacao');
      }) || (cleanQueryTel === '000000000' || cleanQueryTel === '00000000000');

      const activeMessages = db.data.mensagens.filter((msg: any) => {
        // Rule 1: Purge older than 3 days
        if (isOlderThan3Days(msg.data)) return false;

        // Rule 2: Match parish
        if (paroquia && msg.paroquia !== paroquia) return false;

        const cleanMsgTel = msg.destinatario_telefone ? String(msg.destinatario_telefone).replace(/\D/g, '') : '';
        const isReminder = msg.texto && (
          msg.texto.includes('Lembrete de Escala') ||
          msg.texto.includes('Lembrete de Líder') ||
          msg.texto.includes('Lembrete Diário') ||
          msg.texto.includes('Lembrete Próximo') ||
          msg.texto.includes('você está escalado') ||
          msg.texto.includes('Você é o LÍDER')
        );

        // Rule 3: Mass reminders & private messages MUST NEVER be broadcast.
        // They are strictly private and ONLY delivered if targeted phone matches the requesting user!
        if (isReminder || msg.type === 'private') {
          if (!cleanMsgTel || !cleanQueryTel || !ministerPhoneNumbers.includes(cleanMsgTel)) {
            return false;
          }
        }

        // Rule 4: Type filtering
        if (type) {
          const requestedType = String(type);
          const msgType = msg.type || 'broadcast';

          if (requestedType === 'broadcast') {
            // Include general broadcast messages (non-reminders) OR targeted private reminders for this user
            if (msgType === 'broadcast') {
              if (isReminder) return false; // reminders are never general broadcasts
              return true;
            } else if (msgType === 'private' || isReminder) {
              return cleanMsgTel && ministerPhoneNumbers.includes(cleanMsgTel);
            } else {
              return false;
            }
          } else if (requestedType === 'private') {
            return cleanMsgTel && ministerPhoneNumbers.includes(cleanMsgTel);
          } else if (requestedType === 'direct') {
            if (msgType !== 'direct') return false;
            // Direct messages sent to coordination
            if (isCoordOrAdmin) {
              return true;
            }
            // For regular ministers, only messages sent by them or targeted to them
            const senderTel = msg.telefone ? String(msg.telefone).replace(/\D/g, '') : '';
            return (senderTel && ministerPhoneNumbers.includes(senderTel)) || (cleanMsgTel && ministerPhoneNumbers.includes(cleanMsgTel));
          } else {
            if (msgType !== requestedType) return false;
          }
        }

        return true;
      });

      // Update DB to permanently remove old messages (>3 days) from database storage
      const validMessages = db.data.mensagens.filter((msg: any) => !isOlderThan3Days(msg.data));
      if (validMessages.length !== db.data.mensagens.length) {
        db.data.mensagens = validMessages;
        await db.write();
      }

      res.json(activeMessages);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.delete('/api/mensagens/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await db.read();
      if (!db.data.mensagens) return res.status(404).json({ error: 'Nenhuma mensagem encontrada.' });
      
      const initialLength = db.data.mensagens.length;
      db.data.mensagens = db.data.mensagens.filter(msg => String(msg.id) !== id);
      
      if (db.data.mensagens.length === initialLength) {
        return res.status(404).json({ error: 'Mensagem não encontrada.' });
      }
      
      await db.write();
      res.json({ success: true });
    } catch (error) {
      console.error('Erro ao excluir mensagem:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.patch('/api/mensagens/:id/read', async (req, res) => {
    const { id } = req.params;
    try {
      await db.read();
      if (!db.data.mensagens) return res.status(404).json({ error: 'Nenhuma mensagem encontrada.' });
      
      const msg = db.data.mensagens.find(m => String(m.id) === id);
      if (!msg) return res.status(404).json({ error: 'Mensagem não encontrada.' });
      
      msg.lida = true;
      await db.write();
      res.json({ success: true });
    } catch (error) {
      console.error('Erro ao marcar mensagem como lida:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.get('/api/eventos', async (req, res) => {
    const { paroquia } = req.query;
    try {
      await db.read();
      if (!db.data.eventos) db.data.eventos = [];
      let eventos = db.data.eventos;
      if (paroquia && paroquia !== 'todas') {
        const normTarget = normalize(String(paroquia));
        eventos = eventos.filter(e => !e.paroquia || e.paroquia === 'todas' || normalize(e.paroquia) === normTarget);
      }
      res.json(eventos);
    } catch (e: any) {
      console.error('Erro ao buscar eventos:', e);
      res.status(500).json({ error: 'Erro ao buscar eventos.' });
    }
  });

  app.post('/api/eventos', async (req, res) => {
    const { titulo, data, horario, tipo, descricao, paroquia, criadoPor, destinatario, alvoId, alvoNome, alvoIds, alvoNomes, criadoPorAdmin } = req.body;
    if (!titulo || !data) {
      return res.status(400).json({ error: 'Título e data são obrigatórios.' });
    }
    try {
      await db.read();
      if (!db.data.eventos) db.data.eventos = [];
      const novoEvento = {
        id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        titulo: String(titulo).trim(),
        data: String(data).trim(),
        horario: horario ? String(horario).trim() : undefined,
        tipo: tipo || 'reuniao',
        descricao: descricao ? String(descricao).trim() : undefined,
        paroquia: paroquia ? String(paroquia).trim() : undefined,
        criadoPor: criadoPor ? String(criadoPor).trim() : undefined,
        criadoPorAdmin: criadoPorAdmin === true,
        destinatario: destinatario || 'todos',
        alvoId: alvoId || '',
        alvoNome: alvoNome || '',
        alvoIds: Array.isArray(alvoIds) ? alvoIds : [],
        alvoNomes: Array.isArray(alvoNomes) ? alvoNomes : [],
        createdAt: new Date().toISOString()
      };
      db.data.eventos.push(novoEvento);
      await db.write();
      res.json(novoEvento);
    } catch (e: any) {
      console.error('Erro ao salvar evento:', e);
      res.status(500).json({ error: 'Erro ao salvar evento.' });
    }
  });

  app.delete('/api/eventos/:id', async (req, res) => {
    const { id } = req.params;
    const { isAdmin } = req.query;
    try {
      await db.read();
      if (!db.data.eventos) db.data.eventos = [];
      const index = db.data.eventos.findIndex(e => String(e.id) === String(id));
      if (index === -1) {
        return res.status(404).json({ error: 'Evento não encontrado.' });
      }
      const event = db.data.eventos[index];
      if (event.criadoPorAdmin && isAdmin !== 'true') {
        return res.status(403).json({ error: 'Apenas administradores do sistema podem excluir este agendamento.' });
      }
      db.data.eventos.splice(index, 1);
      await db.write();
      res.json({ success: true });
    } catch (e: any) {
      console.error('Erro ao deletar evento:', e);
      res.status(500).json({ error: 'Erro ao deletar evento.' });
    }
  });

  const parseBirthday = (dateString: string | undefined) => {
    if (!dateString) return null;
    const cleanDate = dateString.trim();
    
    // Try YYYY-MM-DD or similar
    const yyyyMatch = cleanDate.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (yyyyMatch) {
      return { month: parseInt(yyyyMatch[2], 10), day: parseInt(yyyyMatch[3], 10) };
    }
    
    // Try DD/MM/YYYY or DD/MM/YY or DD-MM-YYYY
    const ddmmyyyyMatch = cleanDate.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
    if (ddmmyyyyMatch) {
      return { month: parseInt(ddmmyyyyMatch[2], 10), day: parseInt(ddmmyyyyMatch[1], 10) };
    }

    // Try DD/MM or DD-MM
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
        const dayPart = parts.find(p => parseInt(p, 10) !== m && parseInt(p, 10) <= 31);
        return { month: m, day: dayPart ? parseInt(dayPart, 10) : 1 };
      }
    }
    return null;
  };

  app.get('/api/stats', async (req, res) => {
    let { paroquia } = req.query;
    if (paroquia === 'undefined' || paroquia === 'null') paroquia = undefined;

    try {
      await db.read();
      const agora = new Date();
      const mesAtual = agora.getMonth() + 1;
      
      const mesFiltro = req.query.mes ? parseInt(req.query.mes as string) : undefined;
      const anoFiltro = req.query.ano ? parseInt(req.query.ano as string) : undefined;

      const uniqueMinistersMap = new Map();
      (db.data.ministros || []).forEach(m => {
        if (m.aprovado === false || m.role === 'admin') return;
        if (paroquia && m.paroquia) {
          const mP = normalize(m.paroquia);
          const qP = normalize(paroquia as string);
          if (mP !== qP) return;
        }
        
        const cleanPhone = m.telefone ? m.telefone.replace(/\D/g, '') : '';
        const nameKey = m.nome.toLowerCase().trim();
        
        let found = false;
        if (cleanPhone) {
          if (uniqueMinistersMap.has('p_' + cleanPhone)) found = true;
        }
        if (!found && uniqueMinistersMap.has('n_' + nameKey)) found = true;

        if (!found) {
          if (cleanPhone) uniqueMinistersMap.set('p_' + cleanPhone, m);
          uniqueMinistersMap.set('n_' + nameKey, m);
        }
      });

      const ministrosFiltrados = Array.from(new Set(uniqueMinistersMap.values()));

      const totalMinistros = ministrosFiltrados.reduce((acc, m) => acc + (m.tipo === 'casal' ? 2 : 1), 0);
      const idsMinistrosParoquia = new Set(ministrosFiltrados.map(m => String(m.id)));
      
      let disponibilidadesParoquia = db.data.disponibilidades.filter(d => idsMinistrosParoquia.has(String(d.ministro_id)));
      
      if (mesFiltro && anoFiltro) {
        disponibilidadesParoquia = disponibilidadesParoquia.filter(d => {
          if (!d.data) return false;
          const [y, m] = d.data.split('-').map(Number);
          return m === mesFiltro && y === anoFiltro;
        });
      }
      
      const totalDisponibilidades = new Set(disponibilidadesParoquia.map(d => String(d.ministro_id))).size;
      
      const mesParaFiltroAniversario = mesFiltro || mesAtual;

      const aniversariantesList = ministrosFiltrados.flatMap(m => {
        const results = [];
        const b1 = parseBirthday(m.dataNascimento);
        if (b1 && b1.month === mesParaFiltroAniversario) {
          results.push({ nome: m.nome, dia: b1.day, tipo: 'Ministro', telefone: m.telefone });
        }
        const b2 = parseBirthday(m.dataNascimentoConjuge);
        if (b2 && b2.month === mesParaFiltroAniversario) {
          results.push({ nome: m.nomeConjuge || 'Ministro', dia: b2.day, tipo: 'Ministro', telefone: m.telefoneConjuge || m.telefone });
        }
        return results;
      }).flat().sort((a, b) => a.dia - b.dia);

      const pendingApprovals = ministrosFiltrados.filter(m => m.aprovado === false).length;

      // 5. Low Stock Count
      let lowStockCount = 0;
      if (db.data.estoque) {
        let stockItems = db.data.estoque;
        if (paroquia) {
          const qP = normalize(paroquia as string);
          stockItems = stockItems.filter(i => normalize(i?.paroquia) === qP);
        }
        
        lowStockCount = stockItems.filter(item => {
          if (!item) return false;
          const tipo = item.nivelMinimoTipo || 'embalagem';
          const threshold = item.nivelMinimo ?? (tipo === 'unidade' ? 100 : 2);
          const current = tipo === 'unidade' ? item.quantidade : item.quantidadeEmbalagens;
          return current <= threshold;
        }).length;
      }

      // 6. Faltas & Pontualidade para o mês atual
      const mesCalc = mesFiltro || mesAtual;
      const anoCalc = anoFiltro || agora.getFullYear();
      const currentMonthStr = `${anoCalc}-${String(mesCalc).padStart(2, '0')}`;
      
      let totalFaltasMes = 0;
      if (db.data.faltas) {
        const qP = paroquia ? normalize(paroquia as string) : undefined;
        totalFaltasMes = db.data.faltas.filter((f: any) => {
          if (!f || !f.data) return false;
          if (qP && f.paroquia && normalize(f.paroquia) !== qP) return false;
          return f.data.startsWith(currentMonthStr);
        }).length;
      }

      let totalEscaladosMes = 0;
      if (db.data.escalaGerada) {
        const targetP = paroquia ? String(paroquia).trim() : 'Paróquia Santa Rita de Cássia';
        const parEscala = db.data.escalaGerada[targetP] || db.data.escalaGerada[normalize(targetP)] || {};
        Object.keys(parEscala).forEach(date => {
          if (date.startsWith(currentMonthStr)) {
            const slots = parEscala[date] || {};
            if (typeof slots === 'object') {
              Object.keys(slots).forEach(h => {
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
          pontualidade = Math.max(0, Math.min(100, Math.round(((totalEscaladosMes - totalFaltasMes) / totalEscaladosMes) * 100)));
        } else {
          pontualidade = Math.max(0, 100 - (totalFaltasMes * 5));
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
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.get('/api/ministro/pontualidade', async (req, res) => {
    const { telefone, paroquia, nome, id } = req.query;
    try {
      await db.read();
      const agora = new Date();
      const currentMonthStr = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
      
      const targetParoquia = paroquia ? String(paroquia).trim() : 'Paróquia Santa Rita de Cássia';
      const normPar = normalize(targetParoquia);

      const cleanPhone = telefone ? String(telefone).replace(/\D/g, '') : '';
      const targetId = id ? String(id).trim() : '';
      const targetName = nome ? normalize(String(nome)) : '';

      // Find minister profile if available
      let targetMinister = (db.data.ministros || []).find((m: any) => {
        if (targetId && String(m.id) === targetId) return true;
        if (cleanPhone && m.telefone && String(m.telefone).replace(/\D/g, '') === cleanPhone) return true;
        const n1 = normalize(m.nome || '');
        const n2 = normalize(m.nomeExibicao || '');
        const n3 = normalize(m.nomeConjuge || '');
        const n4 = normalize(m.nomeExibicaoConjuge || '');
        if (targetName && (n1 === targetName || n2 === targetName || n3 === targetName || n4 === targetName)) return true;
        return false;
      });

      const isLoggedAsConjuge = targetMinister && targetMinister.tipo === 'casal' && targetName && (
        targetName === normalize(targetMinister.nomeConjuge || '') ||
        targetName === normalize(targetMinister.nomeExibicaoConjuge || '')
      );

      let totalEscalado = 0;
      if (db.data.escalaGerada) {
        const parEscala = db.data.escalaGerada[targetParoquia] || db.data.escalaGerada[normPar] || {};
        Object.keys(parEscala).forEach(date => {
          if (date.startsWith(currentMonthStr)) {
            const slots = parEscala[date] || {};
            if (typeof slots === 'object') {
              Object.keys(slots).forEach(h => {
                const missa = slots[h];
                if (missa && Array.isArray(missa.ministros)) {
                  const isScheduled = missa.ministros.some((mName: string) => {
                    const normM = normalize(mName);
                    if (targetName && normM.includes(targetName)) return true;
                    if (targetMinister) {
                      const p1 = normalize(targetMinister.nomeExibicao || targetMinister.nome || '');
                      const p2 = normalize(targetMinister.nomeExibicaoConjuge || targetMinister.nomeConjuge || '');
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
      if (db.data.faltas) {
        db.data.faltas.forEach((f: any) => {
          if (!f || !f.data) return;
          if (!f.data.startsWith(currentMonthStr)) return;
          if (f.paroquia && normalize(f.paroquia) !== normPar) return;
          
          const fId = f.ministroId ? String(f.ministroId).trim() : '';
          const fNormName = normalize(f.ministroNome || '');
          const matchesId = Boolean(targetId && fId === targetId);
          const matchesPhone = Boolean(cleanPhone && f.telefone && String(f.telefone).replace(/\D/g, '') === cleanPhone);
          const matchesName = Boolean(targetName && fNormName.includes(targetName));

          if (matchesId || matchesPhone || matchesName) {
            // Check specific spouse attribution if couple
            if (targetMinister && targetMinister.tipo === 'casal') {
              if (f.tipoFalta === 'conjuge') {
                if (isLoggedAsConjuge) totalFaltas++;
              } else if (f.tipoFalta === 'principal') {
                if (!isLoggedAsConjuge) totalFaltas++;
              } else {
                // 'ambos' or couple full slot absence
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
        pontualidade = Math.max(0, Math.min(100, Math.round(((totalEscalado - totalFaltas) / totalEscalado) * 100)));
      } else if (totalFaltas > 0) {
        pontualidade = Math.max(0, 100 - (totalFaltas * 10));
      }

      res.json({
        success: true,
        pontualidade,
        totalEscalado,
        totalFaltas
      });
    } catch (error) {
      console.error('Erro ao calcular pontualidade do ministro:', error);
      res.status(500).json({ error: 'Erro ao calcular pontualidade.' });
    }
  });

  const liturgiaCache = new Map<string, { data: any, timestamp: number }>();
  const LITURGIA_CACHE_TTL = 1000 * 60 * 60 * 2; // 2 horas

  // Endpoint for Canção Nova Liturgia Diária
  const cancaoNovaCache = new Map<string, { data: any, timestamp: number }>();
  
  app.get('/api/liturgia-diaria', async (req, res) => {
    try {
      const force = req.query.force === 'true';
      const isVigilia = req.query.vigilia === 'true';
      
      // Use date + vigilia as cache key
      const dateKey = new Date().toISOString().split('T')[0] + (isVigilia ? '-vigilia' : '');
      const nowTime = Date.now();
      const cached = cancaoNovaCache.get(dateKey);

      if (!force && cached && (nowTime - cached.timestamp < LITURGIA_CACHE_TTL)) {
        return res.json(cached.data);
      }

      const fetch = (await import('node-fetch')).default;
      const cheerio = await import('cheerio');
      
      let url = 'https://liturgia.cancaonova.com/pb/';
      if (isVigilia) {
        url += '?vigilia=true';
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      });
      
      const html = await response.text();
      const $ = cheerio.load(html);

      const hasVigilia = $('.vigilia-toggle').length > 0 || html.includes('vigilia=true');

      const abas = $('.nav-tabs li a').map((i, el) => {
        return {
          id: $(el).attr('href')?.replace('#', '') || `tab-${i}`,
          titulo: $(el).find('label').text().trim(),
          referencia: $(el).find('.referencia').text().trim()
        };
      }).get();
      
      const conteudos = $('.tab-content .tab-pane').map((i, el) => {
        const clone = $(el).clone();
        clone.find('iframe, script, style, .sintese, .embeds-audio, .audio-player').remove();
        const paragraphs = clone.find('p').map((j, p) => $(p).text().trim()).get().filter(p => p.length > 0);
        return {
          id: clone.attr('id') || `tab-${i}`,
          paragrafos: paragraphs.length > 0 ? paragraphs : [clone.text().trim().replace(/\s+/g, ' ')]
        };
      }).get();

      const result = abas.map(aba => {
        const conteudo = conteudos.find(c => c.id === aba.id);
        return {
          ...aba,
          paragrafos: conteudo ? conteudo.paragrafos : []
        };
      });

      const finalResponse = {
        liturgia: result,
        hasVigilia,
        isVigilia,
        data: new Date().toLocaleDateString('pt-BR')
      };

      cancaoNovaCache.set(dateKey, { data: finalResponse, timestamp: nowTime });
      res.json(finalResponse);
    } catch (error) {
      console.error('[LITURGIA-DIARIA] Erro:', error);
      res.status(500).json({ error: 'Falha ao buscar liturgia.' });
    }
  });

  app.get('/api/liturgia', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    try {
      const { date } = req.query;
      
      const cacheKey = (date && typeof date === 'string') ? `date_${date}` : 'today';
      const cached = liturgiaCache.get(cacheKey);
      const nowTime = Date.now();
      
      if (cached && (nowTime - cached.timestamp < LITURGIA_CACHE_TTL)) {
        console.log(`[LITURGIA] Retornando dados em cache para a chave: ${cacheKey}`);
        return res.json(cached.data);
      }

      // Get date in Brazil timezone (UTC-3)
      let now = new Date();
      let brTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
      let targetDate = brTime;
      
      if (date && typeof date === 'string') {
        const [day, month] = date.split('-').map(Number);
        if (!isNaN(day) && !isNaN(month)) {
          targetDate = new Date();
          targetDate.setDate(day);
          targetDate.setMonth(month - 1); // Month is 0-indexed
        }
      } else {
        // Regra Especial de Sábado: Após as 17:00, já usamos o evangelho de Domingo (Vigília)
        if (targetDate.getDay() === 6 && targetDate.getHours() >= 17) {
          targetDate = new Date(targetDate.getTime() + (24 * 60 * 60 * 1000));
        }
      }

      const day = targetDate.getDate().toString().padStart(2, '0');
      const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
      const year = targetDate.getFullYear();

      // Primeiro tentamos buscar do site oficial do Vatican News
      const vaticanDateUrl = `https://www.vaticannews.va/pt/palavra-do-dia/${year}/${month}/${day}.html`;
      const vaticanUrl = 'https://www.vaticannews.va/pt/palavra-do-dia.html';
      
      let referencia = 'Referência não encontrada';
      let texto = 'Texto não encontrado';
      let papasText = '';
      let successVatican = false;
      const liturgiaTabs: Array<{ id: string; titulo: string; referencia: string; paragrafos: string[] }> = [];

      try {
        const vaticanResponse = await fetch(vaticanDateUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        if (vaticanResponse.ok) {
          const vHtml = await vaticanResponse.text();
          const $ = cheerio.load(vHtml);
          
          const sections = $('section');
          sections.each((i, el) => {
            const heading = $(el).find('h1, h2, h3, h4').text().trim();
            const headingLower = heading.toLowerCase();
            
            if (headingLower.includes('leitura do dia')) {
              let currentTab: { id: string; titulo: string; referencia: string; paragrafos: string[] } | null = null;
              $(el).find('.section__content p').each((j, p) => {
                const text = $(p).text().trim();
                if (!text) return;
                const textLower = text.toLowerCase();

                if (textLower === 'primeira leitura' || textLower === '1ª leitura' || textLower.includes('1ª leitura')) {
                  if (currentTab) liturgiaTabs.push(currentTab);
                  currentTab = { id: 'tab-1leitura', titulo: '1ª Leitura', referencia: '', paragrafos: [] };
                } else if (textLower === 'segunda leitura' || textLower === '2ª leitura' || textLower.includes('2ª leitura')) {
                  if (currentTab) liturgiaTabs.push(currentTab);
                  currentTab = { id: 'tab-2leitura', titulo: '2ª Leitura', referencia: '', paragrafos: [] };
                } else if (textLower === 'salmo' || textLower.includes('salmo responsorial') || textLower.startsWith('salmo')) {
                  if (currentTab) liturgiaTabs.push(currentTab);
                  currentTab = { id: 'tab-salmo', titulo: 'Salmo Responsorial', referencia: '', paragrafos: [] };
                } else {
                  if (!currentTab) {
                    currentTab = { id: 'tab-1leitura', titulo: '1ª Leitura', referencia: '', paragrafos: [] };
                  }
                  if (!currentTab.referencia && currentTab.paragrafos.length < 2 && (text.length < 60 || textLower.includes('leitura') || /^\d+/.test(text))) {
                    if (currentTab.referencia) {
                      currentTab.referencia += ' ' + text;
                    } else {
                      currentTab.referencia = text;
                    }
                  }
                  currentTab.paragrafos.push(text);
                }
              });
              if (currentTab) liturgiaTabs.push(currentTab);
            } else if (headingLower.includes('evangelho')) {
              const pText: string[] = [];
              $(el).find('.section__content p').each((j, p) => {
                const t = $(p).text().trim();
                if (t) pText.push(t);
              });
              
              if (pText.length >= 2 && pText[1].length < 30) {
                 referencia = pText[0] + ' ' + pText[1];
              } else if (pText.length > 0) {
                 referencia = $(el).find('h1, h2, h3, h4').text().trim() + ' ' + pText[0];
              } else {
                 referencia = $(el).find('h1, h2, h3, h4').text().trim();
              }
              texto = pText.join('\n\n');
              successVatican = pText.length > 0;

              liturgiaTabs.push({
                id: 'tab-evangelho',
                titulo: 'Evangelho',
                referencia,
                paragrafos: pText
              });
            } else if (headingLower.includes('palavras dos papas') || headingLower.includes('papa')) {
              let pTextPapas: string[] = [];
              $(el).find('.section__content p').each((i, p) => {
                const t = $(p).text().trim();
                if (t) pTextPapas.push(t);
              });
              papasText = pTextPapas.join('\n\n');

              liturgiaTabs.push({
                id: 'tab-papa',
                titulo: 'O Pensamento do Papa',
                referencia: 'Vatican News',
                paragrafos: pTextPapas
              });
            }
          });
        }
      } catch (err) {
        console.error("Failed to parse Vatican news:", err);
      }

      // Se falhou em obter o evangelho do vaticano vamos usar o fallback
      if (!successVatican) {
        console.log('Utilizando API fallback...');
        const url = `https://liturgia.up.railway.app/${day}-${month}-${year}`;
        let response;
        let retries = 3;

        while (retries > 0) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); 

            response = await fetch(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
        
        if (response && response.ok) {
           const text = await response.text();
           try {
             const data = JSON.parse(text);
             if (data && data.evangelho) {
               referencia = data.evangelho.referencia || data.evangelho.titulo || referencia;
               const titulo = data.evangelho.titulo ? data.evangelho.titulo + '\n\n' : '';
               const textoEvangelho = data.evangelho.texto || '';
               texto = titulo + textoEvangelho;

               if (data.primeiraLeitura) {
                 liturgiaTabs.push({
                   id: 'tab-1leitura',
                   titulo: '1ª Leitura',
                   referencia: data.primeiraLeitura.referencia || '',
                   paragrafos: [data.primeiraLeitura.texto || '']
                 });
               }
               if (data.salmo) {
                 liturgiaTabs.push({
                   id: 'tab-salmo',
                   titulo: 'Salmo Responsorial',
                   referencia: data.salmo.referencia || '',
                   paragrafos: [data.salmo.texto || '']
                 });
               }
               if (data.segundaLeitura) {
                 liturgiaTabs.push({
                   id: 'tab-2leitura',
                   titulo: '2ª Leitura',
                   referencia: data.segundaLeitura.referencia || '',
                   paragrafos: [data.segundaLeitura.texto || '']
                 });
               }
               liturgiaTabs.push({
                 id: 'tab-evangelho',
                 titulo: 'Evangelho',
                 referencia,
                 paragrafos: textoEvangelho ? textoEvangelho.split('\n\n') : [texto]
               });
             }
           } catch {
             console.error("Response from liturgy API was not valid JSON:", text);
             referencia = 'Indisponível';
             texto = 'API de liturgia retornou um formato inválido.';
           }
        } else {
           referencia = 'Não disponível';
           texto = 'Não foi possível carregar a liturgia hoje.';
         }
      }
      
      const successResult = {
        evangelho: {
          referencia,
          texto,
          papasText,
          vaticanUrl: successVatican ? vaticanDateUrl : 'https://www.vaticannews.va/pt/palavra-do-dia.html'
        },
        liturgia: liturgiaTabs,
        hasVigilia: false,
        isVigilia: targetDate.getDay() === 0 && new Date().getDay() === 6,
        data: `${day}/${month}/${year}`
      };

      // Guardar no cache para as próximas chamadas rápidas
      liturgiaCache.set(cacheKey, { data: successResult, timestamp: nowTime });
      res.json(successResult);
    } catch (error) {
      console.error('Erro ao buscar liturgia:', error);
      res.json({
        evangelho: {
          referencia: 'Liturgia indisponível no momento',
          texto: 'Não foi possível carregar a liturgia diária. Por favor, tente novamente mais tarde.',
          vaticanUrl: 'https://www.vaticannews.va/pt/palavra-do-dia.html',
          papasText: ''
        }
      });
    }
  });


  app.post('/api/admin/conceder-excecao', async (req, res) => {
    const { telefone, horas } = req.body;
    if (!telefone || !horas) return res.status(400).json({ error: 'Telefone e horas são obrigatórios.' });

    try {
      await db.read();
      const cleanPhone = (p: string | null | undefined) => p ? p.replace(/\D/g, '') : '';
      const searchPhone = cleanPhone(telefone);
      
      const ministro = db.data.ministros.find(m => 
        (m.telefone && cleanPhone(m.telefone) === searchPhone) || 
        (m.telefoneConjuge && cleanPhone(m.telefoneConjuge) === searchPhone)
      );
      if (!ministro) return res.status(404).json({ error: 'Ministro não encontrado.' });

      const horasNum = parseFloat(horas);
      if (isNaN(horasNum)) return res.status(400).json({ error: 'Quantidade de horas inválida.' });
      const expiraEm = new Date(Date.now() + horasNum * 60 * 60 * 1000);
      
      ministro.excecaoAcessoAte = expiraEm.toISOString();
      ministro.disponibilidadeConfirmada = false; // Reset confirmation to allow editing
      await db.write();

      res.json({ 
        message: `Acesso concedido até ${expiraEm.toLocaleString('pt-BR')}`,
        ministro: ministro
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao conceder exceção.' });
    }
  });

  app.get('/api/admin/pending', async (req, res) => {
    let { paroquia } = req.query;
    if (paroquia === 'undefined' || paroquia === 'null') paroquia = undefined;

    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      await db.read();
      let pending = db.data.ministros.filter(m => m.aprovado === false);
      
      if (paroquia) {
        const qP = normalize(paroquia as string);
        pending = pending.filter(m => {
          if (!m.paroquia) return false;
          const mP = normalize(m.paroquia);
          return mP === qP;
        });
      }

      pending.sort((a, b) => a.nome.localeCompare(b.nome));
      res.json(pending);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar usuários pendentes.' });
    }
  });

  app.post('/api/admin/approve/:id', async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    try {
      await db.read();
      const ministro = db.data.ministros.find(m => m.id === parseInt(id));
      if (!ministro) return res.status(404).json({ error: 'Usuário não encontrado.' });
      
      ministro.aprovado = true;
      ministro.cadastroCompleto = false;
      if (role) {
        ministro.role = role;
      }

      // Se for aprovado como coordenação, vincula automaticamente à paróquia se ela existir
      if (role === 'coordenacao' && ministro.paroquia) {
        const paroquia = db.data.paroquias.find(p => p.nome === ministro.paroquia);
        if (paroquia) {
          // Atualiza o coordenador da paróquia se estiver vazio ou se o admin estiver aprovando este novo
          paroquia.coordenador = ministro.nome;
          paroquia.telefoneCoordenador = ministro.telefone;
        }
      }

      await db.write();
      res.json({ message: 'Usuário aprovado com sucesso!' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao aprovar usuário.' });
    }
  });

  app.post('/api/admin/reject/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await db.read();
      const index = db.data.ministros.findIndex(m => m.id === parseInt(id));
      if (index === -1) return res.status(404).json({ error: 'Usuário não encontrado.' });
      
      db.data.ministros.splice(index, 1);
      await db.write();
      res.json({ message: 'Usuário rejeitado e removido.' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao rejeitar usuário.' });
    }
  });

  app.get('/api/admin/coordinators', async (req, res) => {
    const { paroquia } = req.query;
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      await db.read();
      let coordinators = db.data.ministros.filter(m => ['coordenacao', 'vice_coordenacao'].includes(m.role) && m.aprovado === true);
      if (paroquia) {
        const qP = normalize(paroquia as string);
        coordinators = coordinators.filter(m => m.paroquia && normalize(m.paroquia) === qP);
      }
      coordinators.sort((a, b) => a.nome.localeCompare(b.nome));
      res.json(coordinators);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar coordenadores.' });
    }
  });

  app.delete('/api/admin/coordinators/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await db.read();
      const index = db.data.ministros.findIndex(m => m.id === parseInt(id));
      if (index === -1) return res.status(404).json({ error: 'Coordenador não encontrado.' });
      
      db.data.ministros.splice(index, 1);
      await db.write();
      res.json({ message: 'Coordenador excluído com sucesso!' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir coordenador.' });
    }
  });

  app.put('/api/admin/coordinators/:id', async (req, res) => {
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
      await db.read();
      const coord = db.data.ministros.find(m => m.id === parseInt(id));
      if (!coord) {
        return res.status(404).json({ error: 'Coordenador não encontrado.' });
      }

      const cleanName = (s: string) => s ? s.trim().replace(/\s+&\s+/g, ' e ') : s;

      if (nome !== undefined) {
        coord.nome = cleanName(nome);
        if (nomeExibicao === undefined) {
          coord.nomeExibicao = cleanName(nome);
        }
      }
      if (nomeExibicao !== undefined) coord.nomeExibicao = cleanName(nomeExibicao);
      if (telefone !== undefined) coord.telefone = telefone;
      if (senha !== undefined) {
        if (!isComplexPassword(senha)) {
          return res.status(400).json({ error: 'A senha do Coordenador deve ter pelo menos 6 caracteres, contendo letras maiúsculas, minúsculas e caracteres especiais.' });
        }
        coord.senha = senha;
      }
      if (tipo !== undefined) coord.tipo = tipo;
      
      if (tipo === 'casal') {
        if (nomeConjuge !== undefined) coord.nomeConjuge = cleanName(nomeConjuge);
        if (nomeExibicaoConjuge !== undefined) coord.nomeExibicaoConjuge = cleanName(nomeExibicaoConjuge);
        if (telefoneConjuge !== undefined) coord.telefoneConjuge = telefoneConjuge;
        if (senhaConjuge !== undefined) {
          if (!isComplexPassword(senhaConjuge)) {
            return res.status(400).json({ error: 'A senha do cônjuge do Coordenador deve ter pelo menos 6 caracteres, contendo letras maiúsculas, minúsculas e caracteres especiais.' });
          }
          coord.senhaConjuge = senhaConjuge;
        }
      } else {
        // Clear couple info if switched to individual
        coord.nomeConjuge = '';
        coord.nomeExibicaoConjuge = '';
        coord.telefoneConjuge = '';
        coord.senhaConjuge = '';
      }

      if (paroquia !== undefined) coord.paroquia = paroquia;

      await db.write();
      res.json({ message: 'Coordenador atualizado com sucesso!', coordinator: coord });
    } catch (error) {
      console.error('Erro ao atualizar coordenador:', error);
      res.status(500).json({ error: 'Erro ao atualizar coordenador.' });
    }
  });

  app.get('/api/admin/ministros', async (req, res) => {
    let { paroquia } = req.query;
    // Allow fetching ministers even if paroquia is not specified (e.g. for global admin)
    
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      await db.read();
      let ministros = (db.data.ministros || []).filter(m => m.aprovado === true && m.role !== 'admin');
      
      if (paroquia && paroquia !== 'undefined' && paroquia !== 'null') {
        const qP = normalize(paroquia as string);
        ministros = ministros.filter(m => m.paroquia && normalize(m.paroquia) === qP);
      }
      
      ministros.sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR", { sensitivity: "base" }));
      res.json(ministros);
    } catch (error) {
      console.error('Erro ao buscar ministros (admin):', error);
      res.status(500).json({ error: 'Erro ao buscar ministros.' });
    }
  });

  app.get('/api/admin/all-users', async (req, res) => {
    try {
      await db.read();
      const allUsers = [...db.data.ministros];
      allUsers.sort((a, b) => a.nome.localeCompare(b.nome));
      res.json(allUsers);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar todos os usuários.' });
    }
  });

  app.get('/api/admin/backup', async (req, res) => {
    try {
      // Force read to get the absolute latest from Firestore
      const adapter = db.adapter as any;
      const latestData = await adapter.read(true);
      if (latestData) {
        db.data = latestData;
      }
      
      const backupData = JSON.stringify(db.data, null, 2);
      const fileName = `backup_sistema_${new Date().toISOString().split('T')[0]}.json`;
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.send(backupData);
    } catch (error) {
      console.error('Erro ao gerar backup:', error);
      res.status(500).json({ error: 'Erro ao gerar arquivo de backup.' });
    }
  });

  app.post('/api/admin/restore', async (req, res) => {
    try {
      const backupData = req.body;
      if (!backupData || typeof backupData !== 'object') {
        return res.status(400).json({ error: 'Dados de backup inválidos.' });
      }
      
      // Basic validation - ensure we have the core collections
      if (!backupData.ministros && !backupData.disponibilidades) {
        return res.status(400).json({ error: 'O arquivo de backup não parece ser válido (faltam coleções principais).' });
      }

      console.log('Iniciando restauração de backup...');
      logDebug('Iniciando restauração de backup...');

      // 1. Define default structure to ensure all keys exist even if missing from backup
      const defaultDataStructure = {
        ministros: [],
        paroquias: [],
        disponibilidades: [],
        mensagens: [],
        config: { coordinatorEnabled: false, escalaPublicada: false, adminPassword: '999', disponibilidadeAberta: false },
        missasTemporarias: [],
        escalaGerada: {},
        comunhao: [],
        estoque: [],
        estoqueMovimentacoes: [],
        faltas: []
      };

      // 2. Clear current in-memory state and merge with backup
      db.data = { ...defaultDataStructure, ...backupData };
      
      // 3. Persist to Firestore
      await db.write();
      
      // 4. Force a cache refresh in the adapter to be absolutely sure
      const adapter = db.adapter as any;
      if (adapter.read) {
        await adapter.read(true);
      }

      // 5. Run migrations on the restored data to ensure it's compatible with current system
      await runMigrations(true);
      
      const stats = {
        ministros: db.data.ministros?.length || 0,
        paroquias: db.data.paroquias?.length || 0,
        disponibilidades: db.data.disponibilidades?.length || 0,
        config: !!db.data.config,
        escalaGerada: Object.keys(db.data.escalaGerada || {}).length
      };

      console.log('Sistema restaurado com sucesso:', stats);
      logDebug(`Sistema restaurado com sucesso: ${JSON.stringify(stats)}`);
      
      res.json({ 
        message: 'Sistema restaurado com sucesso!',
        stats
      });
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      logDebug(`Erro ao restaurar backup: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ error: 'Erro ao restaurar sistema: ' + (error instanceof Error ? error.message : String(error)) });
    }
  });

  app.get('/api/missas-temporarias', async (req, res) => {
    const { paroquia } = req.query;
    const paroquiaStr = paroquia ? String(paroquia).trim() : "";
    logDebug(`[DEBUG] GET /api/missas-temporarias recebido. Paróquia: '${paroquiaStr}'`);
    try {
      await db.read();
      const todasMissas = db.data.missasTemporarias || [];
      logDebug(`[DEBUG] Total de missas no banco: ${todasMissas.length}`);
      
      const MISSAS_PADRAO = [
        { id: 'padrao-sab-17', nome: 'Missa de Sábado', frequencia: 'semanal', diaSemana: '6', horario: '17:00', quantidade: 6, tipo: 'padrao' },
        { id: 'padrao-dom-07', nome: 'Missa de Domingo', frequencia: 'semanal', diaSemana: '0', horario: '07:30', quantidade: 5, tipo: 'padrao' },
        { id: 'padrao-dom-10', nome: 'Missa de Domingo', frequencia: 'semanal', diaSemana: '0', horario: '10:00', quantidade: 8, tipo: 'padrao' },
        { id: 'padrao-dom-19', nome: 'Missa de Domingo', frequencia: 'semanal', diaSemana: '0', horario: '19:00', quantidade: 8, tipo: 'padrao' },
      ];

      // Se não houver paróquia no banco, ou paroquiaStr for vaziio, usamos uma lógica permissiva
      // Filtrar as missas cadastradas para a paróquia
      const missasDaParoquia = todasMissas.filter(m => {
        const mPar = (m.paroquia && m.paroquia !== 'undefined') ? String(m.paroquia).trim() : '';
        if (paroquiaStr) {
          // Apenas retorna se a paróquia for explicitamente a mesma
          return mPar.toLowerCase() === paroquiaStr.toLowerCase();
        }
        // Se não tiver paróquia definida, considera como global (ou sem paróquia)
        return mPar === '';
      });

      const missasMescladas = [];
      
      // Adicionar missas padrão para todas as paróquias, aplicando as regras de override da paróquia atual
      MISSAS_PADRAO.forEach(mp => {
        const override = missasDaParoquia.find(m => 
          (m.tipo === 'padrao' || m.tipo === 'fixa' || (!m.tipo && m.frequencia === 'semanal')) && 
          m.horario === mp.horario &&
          m.diaSemana === mp.diaSemana &&
          !m.data // Não é uma sobrescrita de data única
        );
        
        if (override) {
          if (!override.deletada) {
            missasMescladas.push({ ...mp, ...override, paroquia: paroquiaStr || override.paroquia || 'Padrão' });
          }
        } else {
          missasMescladas.push({ ...mp, paroquia: paroquiaStr || 'Padrão' });
        }
      });

      // Adicionar as outras missas cadastradas
      missasDaParoquia.forEach(m => {
        if (m.deletada) return;
        
        const isDefaultOverride = MISSAS_PADRAO.some(mp => 
          m.horario === mp.horario && 
          m.diaSemana === mp.diaSemana && 
          (m.tipo === 'padrao' || m.tipo === 'fixa' || (!m.tipo && m.frequencia === 'semanal')) &&
          !m.data
        );
        if (!isDefaultOverride) {
          missasMescladas.push(m);
        }
      });

      logDebug(`[DEBUG] Missas retornadas após filtro e mesclagem: ${missasMescladas.length}`);
      res.json(missasMescladas);
    } catch (error) {
      logDebug(`[DEBUG] Erro ao buscar missas temporárias: ${error}`);
      res.status(500).json({ error: 'Erro ao buscar missas temporárias.' });
    }
  });

  app.post('/api/missas-temporarias', async (req, res) => {
    try {
      await db.read();
      if (!db.data.missasTemporarias) {
        db.data.missasTemporarias = [];
      }
      const novaMissa = {
        id: Date.now().toString(),
        ...req.body
      };
      db.data.missasTemporarias.push(novaMissa);
      await db.write();
      res.json(novaMissa);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar missa temporária.' });
    }
  });

  app.delete('/api/missas-temporarias/fixas', async (req, res) => {
    const { paroquia } = req.query;
    if (!paroquia) return res.status(400).json({ error: 'Paróquia é obrigatória.' });
    try {
      await db.read();
      if (!db.data.missasTemporarias) return res.status(404).json({ error: 'Nenhuma missa encontrada.' });
      
      db.data.missasTemporarias = db.data.missasTemporarias.filter(m => !(m.tipo === 'fixa' && m.paroquia === paroquia));
      await db.write();
      res.json({ message: 'Todas as missas fixas foram excluídas com sucesso!' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir missas fixas.' });
    }
  });

  app.delete('/api/missas-temporarias', async (req, res) => {
    const { paroquia } = req.query;
    if (!paroquia) return res.status(400).json({ error: 'Paróquia é obrigatória.' });
    try {
      await db.read();
      if (!db.data.missasTemporarias) return res.status(404).json({ error: 'Nenhuma missa encontrada.' });
      
      db.data.missasTemporarias = db.data.missasTemporarias.filter(m => m.paroquia !== paroquia);
      await db.write();
      res.json({ message: 'Todas as missas temporárias foram excluídas com sucesso!' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir todas as missas.' });
    }
  });

  app.delete('/api/missas-temporarias/:id', async (req, res) => {
    const { id } = req.params;
    const { paroquia, nome, horario } = req.query; // Passados via query para identificar a missa padrão
    try {
      await db.read();
      if (!db.data.missasTemporarias) db.data.missasTemporarias = [];
      
      const index = db.data.missasTemporarias.findIndex(m => m.id === id);
      
      if (index === -1) {
        // Se não encontrou, pode ser um ID padrão. Vamos criar um override marcando como deletada.
        if (nome && horario && paroquia) {
          const novaMissa = {
            id: Date.now().toString(),
            tipo: 'padrao',
            nome: String(nome),
            horario: String(horario),
            paroquia: String(paroquia),
            deletada: true
          };
          db.data.missasTemporarias.push(novaMissa);
          await db.write();
          return res.json({ message: 'Missa padrão excluída com sucesso!' });
        }
        return res.status(404).json({ error: 'Missa não encontrada.' });
      }
      
      db.data.missasTemporarias.splice(index, 1);
      await db.write();
      res.json({ message: 'Missa excluída com sucesso!' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir missa.' });
    }
  });

  app.put('/api/missas-temporarias/:id', async (req, res) => {
    const { id } = req.params;
    const body = req.body;
    let { quantidade } = body;
    
    // Converte quantidade para número se for string
    if (typeof quantidade === 'string') {
      quantidade = parseInt(quantidade);
    }

    logDebug(`[DEBUG] PUT /api/missas-temporarias/${id} recebido. Quantidade: ${quantidade}`);
    
    try {
      await db.read();
      if (!db.data.missasTemporarias) db.data.missasTemporarias = [];
      
      const index = db.data.missasTemporarias.findIndex(m => String(m.id) === String(id));
      
      if (index === -1) {
        logDebug(`[DEBUG] Missa com ID ${id} não encontrada. Verificando se é override necessário.`);
        const { nome, horario, paroquia, diaSemana, frequencia } = body;
        // Se não encontrou, pode ser um ID padrão (ex: sab-1900) que ainda não tem override
        // Precisamos criar um novo override
        if (nome && horario && paroquia) {
          const novaMissa = {
            id: Date.now().toString(),
            tipo: 'padrao',
            nome,
            horario,
            diaSemana,
            frequencia,
            quantidade,
            paroquia
          };
          db.data.missasTemporarias.push(novaMissa);
          await db.write();
          logDebug(`[DEBUG] Override criado para missa: ${id}`);
          return res.json(novaMissa);
        }
        return res.status(404).json({ error: 'Missa não encontrada e dados insuficientes para criar override.' });
      }
      
      if (typeof quantidade === 'number' && !isNaN(quantidade) && quantidade >= 0) {
        db.data.missasTemporarias[index] = {
          ...db.data.missasTemporarias[index],
          ...body,
          quantidade // Garante que a quantidade seja atualizada como número
        };
        await db.write();
        logDebug(`[DEBUG] Missa ${id} atualizada com sucesso.`);
        res.json(db.data.missasTemporarias[index]);
      } else {
        logDebug(`[DEBUG] Quantidade inválida: ${quantidade} (${typeof quantidade})`);
        res.status(400).json({ error: 'Quantidade inválida.' });
      }
    } catch (error) {
      console.error('Erro ao atualizar missa:', error);
      res.status(500).json({ error: 'Erro ao atualizar missa.' });
    }
  });

  app.post('/api/missas-temporarias/:id/toggle-data', async (req, res) => {
    const { id } = req.params;
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: 'Data é obrigatória.' });

    try {
      await db.read();
      if (!db.data.missasTemporarias) return res.status(404).json({ error: 'Nenhuma missa encontrada.' });
      
      const index = db.data.missasTemporarias.findIndex(m => m.id === id);
      if (index === -1) return res.status(404).json({ error: 'Missa não encontrada.' });
      
      const missa = db.data.missasTemporarias[index];
      if (!missa.datasInativas) missa.datasInativas = [];
      
      const dateIndex = missa.datasInativas.indexOf(data);
      if (dateIndex === -1) {
        missa.datasInativas.push(data);
      } else {
        missa.datasInativas.splice(dateIndex, 1);
      }
      
      await db.write();
      res.json(missa);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao alternar data inativa.' });
    }
  });

  // Paroquias API
  // Fidelis Unified Integration API (Everything together: coordinators + masses)
  app.get('/api/fidelis/integracao', async (req, res) => {
    const { paroquia } = req.query;
    const paroquiaStr = paroquia ? String(paroquia).trim() : "";
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      await db.read();
      
      const allCoordinators = db.data.fidelisCoordinators || [];
      const filteredCoordinators = paroquiaStr 
        ? allCoordinators.filter(c => c.paroquia && c.paroquia.toLowerCase() === paroquiaStr.toLowerCase())
        : allCoordinators;

      const todasMissas = db.data.missasTemporarias || [];
      const MISSAS_PADRAO = [
        { id: 'padrao-sab-17', nome: 'Missa de Sábado', frequencia: 'semanal', diaSemana: '6', horario: '17:00', quantidade: 6, tipo: 'padrao' },
        { id: 'padrao-dom-07', nome: 'Missa de Domingo', frequencia: 'semanal', diaSemana: '0', horario: '07:30', quantidade: 5, tipo: 'padrao' },
        { id: 'padrao-dom-10', nome: 'Missa de Domingo', frequencia: 'semanal', diaSemana: '0', horario: '10:00', quantidade: 8, tipo: 'padrao' },
        { id: 'padrao-dom-19', nome: 'Missa de Domingo', frequencia: 'semanal', diaSemana: '0', horario: '19:00', quantidade: 8, tipo: 'padrao' },
      ];

      const missasDaParoquia = todasMissas.filter(m => {
        const mPar = (m.paroquia && m.paroquia !== 'undefined') ? String(m.paroquia).trim() : '';
        if (paroquiaStr) {
          return mPar.toLowerCase() === paroquiaStr.toLowerCase();
        }
        return mPar === '';
      });

      const missasMescladas: any[] = [];
      MISSAS_PADRAO.forEach(mp => {
        const override = missasDaParoquia.find(m => 
          (m.tipo === 'padrao' || m.tipo === 'fixa' || (!m.tipo && m.frequencia === 'semanal')) && 
          m.horario === mp.horario &&
          m.diaSemana === mp.diaSemana &&
          !m.data
        );
        if (override) {
          if (!override.deletada) {
            missasMescladas.push({ ...mp, ...override, paroquia: paroquiaStr || override.paroquia || 'Padrão' });
          }
        } else {
          missasMescladas.push({ ...mp, paroquia: paroquiaStr || 'Padrão' });
        }
      });

      missasDaParoquia.forEach(m => {
        if (m.deletada) return;
        const isDefaultOverride = MISSAS_PADRAO.some(mp => 
          m.horario === mp.horario && 
          m.diaSemana === mp.diaSemana && 
          (m.tipo === 'padrao' || m.tipo === 'fixa' || (!m.tipo && m.frequencia === 'semanal')) &&
          !m.data
        );
        if (!isDefaultOverride) {
          missasMescladas.push(m);
        }
      });

      // Sanitization: Remove minister-related fields
      const sanitizedMissas = missasMescladas.map(m => {
        const { ministros, escala, responsavel, ...rest } = m;
        return rest;
      });

      res.json({
        sucesso: true,
        portal: "Portal do MECE (Portal de Ministros Extraordinários da Sagrada Comunhão)",
        paroquiaFiltro: paroquiaStr || "Todas",
        atualizadoEm: new Date().toISOString(),
        coordenadores: filteredCoordinators,
        missas: sanitizedMissas
      });
    } catch (error) {
      console.error('Erro na API unificada Fidelis:', error);
      res.status(500).json({ error: 'Erro ao gerar dados de integração unificada.' });
    }
  });

  // Fidelis Exclusive Schedule API (Protected by Token, returns ONLY schedule/missas without ministers)
  app.get('/api/fidelis/escala-exclusiva', async (req, res) => {
    const { token, paroquia } = req.query;
    const tokenHeader = req.headers['x-fidelis-token'];
    const validToken = 'fidelis_exclusivo_2026';

    if (token !== validToken && tokenHeader !== validToken) {
      return res.status(403).json({ 
        error: 'Acesso negado. Token de acesso exclusivo inválido ou ausente.',
        mensagem: 'Utilize o parâmetro ?token=fidelis_exclusivo_2026 ou o header x-fidelis-token.' 
      });
    }

    const paroquiaStr = paroquia ? String(paroquia).trim() : "";
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      await db.read();
      const todasMissas = db.data.missasTemporarias || [];
      
      const MISSAS_PADRAO = [
        { id: 'padrao-sab-17', nome: 'Missa de Sábado', frequencia: 'semanal', diaSemana: '6', horario: '17:00', quantidade: 6, tipo: 'padrao' },
        { id: 'padrao-dom-07', nome: 'Missa de Domingo', frequencia: 'semanal', diaSemana: '0', horario: '07:30', quantidade: 5, tipo: 'padrao' },
        { id: 'padrao-dom-10', nome: 'Missa de Domingo', frequencia: 'semanal', diaSemana: '0', horario: '10:00', quantidade: 8, tipo: 'padrao' },
        { id: 'padrao-dom-19', nome: 'Missa de Domingo', frequencia: 'semanal', diaSemana: '0', horario: '19:00', quantidade: 8, tipo: 'padrao' },
      ];

      const missasDaParoquia = todasMissas.filter(m => {
        const mPar = (m.paroquia && m.paroquia !== 'undefined') ? String(m.paroquia).trim() : '';
        if (paroquiaStr) {
          return mPar.toLowerCase() === paroquiaStr.toLowerCase();
        }
        return mPar === '';
      });

      const missasMescladas: any[] = [];
      MISSAS_PADRAO.forEach(mp => {
        const override = missasDaParoquia.find(m => 
          (m.tipo === 'padrao' || m.tipo === 'fixa' || (!m.tipo && m.frequencia === 'semanal')) && 
          m.horario === mp.horario &&
          m.diaSemana === mp.diaSemana &&
          !m.data
        );
        if (override) {
          if (!override.deletada) {
            missasMescladas.push({ ...mp, ...override, paroquia: paroquiaStr || override.paroquia || 'Padrão' });
          }
        } else {
          missasMescladas.push({ ...mp, paroquia: paroquiaStr || 'Padrão' });
        }
      });

      missasDaParoquia.forEach(m => {
        if (m.deletada) return;
        const isDefaultOverride = MISSAS_PADRAO.some(mp => 
          m.horario === mp.horario && 
          m.diaSemana === mp.diaSemana && 
          (m.tipo === 'padrao' || m.tipo === 'fixa' || (!m.tipo && m.frequencia === 'semanal')) &&
          !m.data
        );
        if (!isDefaultOverride) {
          missasMescladas.push(m);
        }
      });

      // Sanitization: Remove minister-related fields completely
      const sanitizedMissas = missasMescladas.map(m => {
        const { ministros, escala, responsavel, ...rest } = m;
        return rest;
      });

      res.json({
        sucesso: true,
        origem: "Portal do MECE - Escala Online Exclusiva para Fidelis",
        tokenAutorizado: true,
        paroquiaFiltro: paroquiaStr || "Todas",
        atualizadoEm: new Date().toISOString(),
        totalMissas: sanitizedMissas.length,
        escala: sanitizedMissas
      });
    } catch (error) {
      console.error('Erro ao buscar escala exclusiva Fidelis:', error);
      res.status(500).json({ error: 'Erro ao buscar escala exclusiva.' });
    }
  });

  // Fidelis Missas API (Public)
  app.get('/api/fidelis/missas', async (req, res) => {
    const { paroquia } = req.query;
    const paroquiaStr = paroquia ? String(paroquia).trim() : "";
    try {
      await db.read();
      const todasMissas = db.data.missasTemporarias || [];
      
      const MISSAS_PADRAO = [
        { id: 'padrao-sab-17', nome: 'Missa de Sábado', frequencia: 'semanal', diaSemana: '6', horario: '17:00', quantidade: 6, tipo: 'padrao' },
        { id: 'padrao-dom-07', nome: 'Missa de Domingo', frequencia: 'semanal', diaSemana: '0', horario: '07:30', quantidade: 5, tipo: 'padrao' },
        { id: 'padrao-dom-10', nome: 'Missa de Domingo', frequencia: 'semanal', diaSemana: '0', horario: '10:00', quantidade: 8, tipo: 'padrao' },
        { id: 'padrao-dom-19', nome: 'Missa de Domingo', frequencia: 'semanal', diaSemana: '0', horario: '19:00', quantidade: 8, tipo: 'padrao' },
      ];

      const missasDaParoquia = todasMissas.filter(m => {
        const mPar = (m.paroquia && m.paroquia !== 'undefined') ? String(m.paroquia).trim() : '';
        if (paroquiaStr) {
          return mPar.toLowerCase() === paroquiaStr.toLowerCase();
        }
        return mPar === '';
      });

      const missasMescladas: any[] = [];
      
      MISSAS_PADRAO.forEach(mp => {
        const override = missasDaParoquia.find(m => 
          (m.tipo === 'padrao' || m.tipo === 'fixa' || (!m.tipo && m.frequencia === 'semanal')) && 
          m.horario === mp.horario &&
          m.diaSemana === mp.diaSemana &&
          !m.data
        );
        
        if (override) {
          if (!override.deletada) {
            missasMescladas.push({ ...mp, ...override, paroquia: paroquiaStr || override.paroquia || 'Padrão' });
          }
        } else {
          missasMescladas.push({ ...mp, paroquia: paroquiaStr || 'Padrão' });
        }
      });

      missasDaParoquia.forEach(m => {
        if (m.deletada) return;
        
        const isDefaultOverride = MISSAS_PADRAO.some(mp => 
          m.horario === mp.horario && 
          m.diaSemana === mp.diaSemana && 
          (m.tipo === 'padrao' || m.tipo === 'fixa' || (!m.tipo && m.frequencia === 'semanal')) &&
          !m.data
        );
        if (!isDefaultOverride) {
          missasMescladas.push(m);
        }
      });

      // Sanitization: Remove minister-related fields
      const sanitizedMissas = missasMescladas.map(m => {
        const { ministros, escala, responsavel, ...rest } = m;
        return rest;
      });

      res.json(sanitizedMissas);
    } catch (error) {
      console.error('Erro ao buscar missas Fidelis:', error);
      res.status(500).json({ error: 'Erro ao buscar missas.' });
    }
  });

  // Fidelis Coordinators API

  app.get('/api/fidelis/coordenadores', async (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      await db.read();
      res.json(db.data.fidelisCoordinators || []);
    } catch (error) {
      console.error('Erro ao buscar coordenadores Fidelis:', error);
      res.status(500).json({ error: 'Erro ao buscar coordenadores Fidelis.' });
    }
  });

  app.post('/api/fidelis/coordenadores', async (req, res) => {
    try {
      await db.read();
      if (!db.data.fidelisCoordinators) db.data.fidelisCoordinators = [];
      const { nome, telefone, email, paroquia, cargo, tipo, nomeConjuge, telefoneConjuge, senha, status, observacoes } = req.body;
      if (!nome || !telefone || !paroquia) {
        return res.status(400).json({ error: 'Nome, telefone e paróquia são obrigatórios.' });
      }
      const novoCoordenador = {
        id: 'fidelis_coord_' + Date.now(),
        nome: String(nome).trim(),
        telefone: String(telefone).trim(),
        email: email ? String(email).trim() : '',
        paroquia: String(paroquia).trim(),
        cargo: (cargo === 'vice_coordenador' ? 'vice_coordenador' : 'coordenador') as 'coordenador' | 'vice_coordenador',
        tipo: (tipo === 'casal' ? 'casal' : 'individual') as 'individual' | 'casal',
        nomeConjuge: nomeConjuge ? String(nomeConjuge).trim() : '',
        telefoneConjuge: telefoneConjuge ? String(telefoneConjuge).trim() : '',
        senha: senha ? String(senha).trim() : '123456',
        status: (status === 'inativo' ? 'inativo' : 'ativo') as 'ativo' | 'inativo',
        observacoes: observacoes ? String(observacoes).trim() : '',
        createdAt: new Date().toISOString()
      };
      db.data.fidelisCoordinators.push(novoCoordenador);
      await db.write();
      res.status(201).json(novoCoordenador);
    } catch (error) {
      console.error('Erro ao cadastrar coordenador Fidelis:', error);
      res.status(500).json({ error: 'Erro ao cadastrar coordenador Fidelis.' });
    }
  });

  app.put('/api/fidelis/coordenadores/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.read();
      if (!db.data.fidelisCoordinators) db.data.fidelisCoordinators = [];
      const index = db.data.fidelisCoordinators.findIndex(c => c.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Coordenador Fidelis não encontrado.' });
      }
      const existing = db.data.fidelisCoordinators[index];
      const { nome, telefone, email, paroquia, cargo, tipo, nomeConjuge, telefoneConjuge, senha, status, observacoes } = req.body;
      db.data.fidelisCoordinators[index] = {
        ...existing,
        nome: nome !== undefined ? String(nome).trim() : existing.nome,
        telefone: telefone !== undefined ? String(telefone).trim() : existing.telefone,
        email: email !== undefined ? String(email).trim() : existing.email,
        paroquia: paroquia !== undefined ? String(paroquia).trim() : existing.paroquia,
        cargo: cargo !== undefined ? (cargo === 'vice_coordenador' ? 'vice_coordenador' : 'coordenador') : (existing.cargo || 'coordenador'),
        tipo: tipo !== undefined ? (tipo === 'casal' ? 'casal' : 'individual') : (existing.tipo || 'individual'),
        nomeConjuge: nomeConjuge !== undefined ? String(nomeConjuge).trim() : existing.nomeConjuge,
        telefoneConjuge: telefoneConjuge !== undefined ? String(telefoneConjuge).trim() : existing.telefoneConjuge,
        senha: senha !== undefined ? String(senha).trim() : existing.senha,
        status: status !== undefined ? (status === 'inativo' ? 'inativo' : 'ativo') : existing.status,
        observacoes: observacoes !== undefined ? String(observacoes).trim() : existing.observacoes
      };
      await db.write();
      res.json(db.data.fidelisCoordinators[index]);
    } catch (error) {
      console.error('Erro ao atualizar coordenador Fidelis:', error);
      res.status(500).json({ error: 'Erro ao atualizar coordenador Fidelis.' });
    }
  });

  app.delete('/api/fidelis/coordenadores/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.read();
      if (!db.data.fidelisCoordinators) db.data.fidelisCoordinators = [];
      const initialLen = db.data.fidelisCoordinators.length;
      db.data.fidelisCoordinators = db.data.fidelisCoordinators.filter(c => c.id !== id);
      if (db.data.fidelisCoordinators.length === initialLen) {
        return res.status(404).json({ error: 'Coordenador Fidelis não encontrado.' });
      }
      await db.write();
      res.json({ message: 'Coordenador Fidelis excluído com sucesso.' });
    } catch (error) {
      console.error('Erro ao excluir coordenador Fidelis:', error);
      res.status(500).json({ error: 'Erro ao excluir coordenador Fidelis.' });
    }
  });

  app.get('/api/paroquias', async (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      await db.read();
      const count = db.data.paroquias?.length || 0;
      logDebug(`[DEBUG /api/paroquias] Paróquias solicitadas. Count: ${count}`);
      res.json(db.data.paroquias || []);
    } catch (error) {
      console.error('Erro ao buscar paróquias:', error);
      res.status(500).json({ error: 'Erro ao buscar paróquias.' });
    }
  });

  app.post('/api/paroquias', async (req, res) => {
    try {
      await db.read();
      if (!db.data.paroquias) db.data.paroquias = [];
      const novaParoquia = {
        id: Date.now().toString(),
        ...req.body
      };
      db.data.paroquias.push(novaParoquia);

      // Sincroniza/Cria conta do Coordenador se os dados forem fornecidos
      const { coordenador, telefoneCoordenador, nome } = req.body;
      if (coordenador && telefoneCoordenador && nome) {
        if (!db.data.ministros) db.data.ministros = [];
        const clean = (num: string) => num ? num.replace(/\D/g, '') : '';
        const cleanTel = clean(telefoneCoordenador);
        
        const existing = db.data.ministros.find(m => clean(m.telefone) === cleanTel || (m.telefoneConjuge && clean(m.telefoneConjuge) === cleanTel));
        
        if (existing) {
          if (existing.role !== 'admin') existing.role = 'coordenacao';
          existing.aprovado = true;
          existing.paroquia = nome;
          if (coordenador) {
            existing.nome = coordenador;
            existing.nomeExibicao = coordenador;
          }
        } else {
          const novoId = (db.data.ministros.length > 0) ? Math.max(...db.data.ministros.map(m => m.id)) + 1 : 1;
          db.data.ministros.push({
            id: novoId,
            nome: coordenador,
            nomeExibicao: coordenador,
            telefone: telefoneCoordenador,
            paroquia: nome,
            senha: '123456', // senha padrão para acesso inicial
            tipo: 'individual',
            role: 'coordenacao',
            acessoCoordenacao: 'casal',
            aprovado: true,
            cadastroCompleto: false,
            incompatibilidades: []
          });
        }
      }

      await db.write();
      res.json(novaParoquia);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar paróquia.' });
    }
  });

  app.put('/api/paroquias/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await db.read();
      if (!db.data.paroquias) return res.status(404).json({ error: 'Nenhuma paróquia encontrada.' });
      const index = db.data.paroquias.findIndex(p => p.id === id);
      if (index === -1) return res.status(404).json({ error: 'Paróquia não encontrada.' });
      
      const antigaParoquia = db.data.paroquias[index];
      db.data.paroquias[index] = { ...antigaParoquia, ...req.body };

      // Sincroniza/Cria conta do Coordenador se os dados forem fornecidos/atualizados
      const { coordenador, telefoneCoordenador, nome } = req.body;
      const paroquiaNome = nome || antigaParoquia.nome;
      if (coordenador && telefoneCoordenador) {
        if (!db.data.ministros) db.data.ministros = [];
        const clean = (num: string) => num ? num.replace(/\D/g, '') : '';
        const cleanTel = clean(telefoneCoordenador);
        
        const existing = db.data.ministros.find(m => clean(m.telefone) === cleanTel || (m.telefoneConjuge && clean(m.telefoneConjuge) === cleanTel));
        
        if (existing) {
          if (existing.role !== 'admin') existing.role = 'coordenacao';
          existing.aprovado = true;
          existing.paroquia = paroquiaNome;
          if (coordenador) {
            existing.nome = coordenador;
            existing.nomeExibicao = coordenador;
          }
        } else {
          const novoId = (db.data.ministros.length > 0) ? Math.max(...db.data.ministros.map(m => m.id)) + 1 : 1;
          db.data.ministros.push({
            id: novoId,
            nome: coordenador,
            nomeExibicao: coordenador,
            telefone: telefoneCoordenador,
            paroquia: paroquiaNome,
            senha: '123456', // senha padrão para acesso inicial
            tipo: 'individual',
            role: 'coordenacao',
            acessoCoordenacao: 'casal',
            aprovado: true,
            cadastroCompleto: false,
            incompatibilidades: []
          });
        }
      }

      await db.write();
      res.json(db.data.paroquias[index]);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar paróquia.' });
    }
  });

  app.delete('/api/paroquias/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await db.read();
      if (!db.data.paroquias) return res.status(404).json({ error: 'Nenhuma paróquia encontrada.' });
      const index = db.data.paroquias.findIndex(p => p.id === id);
      if (index === -1) return res.status(404).json({ error: 'Paróquia não encontrada.' });
      db.data.paroquias.splice(index, 1);
      await db.write();
      res.json({ message: 'Paróquia excluída com sucesso!' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir paróquia.' });
    }
  });

  // Testers Endpoints (Closed Testing management)
  app.get('/api/testers', async (req, res) => {
    try {
      const { paroquia } = req.query;
      await db.read();
      let testers = db.data.testers || [];
      if (paroquia) {
        testers = testers.filter(t => t.paroquia === paroquia);
      }
      res.json(testers);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao buscar testadores: ' + err });
    }
  });

  app.post('/api/testers', async (req, res) => {
    try {
      const tester = req.body;
      await db.read();
      if (!db.data.testers) db.data.testers = [];
      
      if (!tester.id) {
        tester.id = Math.random().toString(36).substring(2, 9);
      }
      tester.dataAdicao = new Date().toISOString();
      
      db.data.testers.push(tester);
      await db.write();
      res.json({ success: true, tester });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao adicionar testador: ' + err });
    }
  });

  app.post('/api/testers/remove', async (req, res) => {
    try {
      const { id } = req.body;
      await db.read();
      if (db.data.testers) {
        db.data.testers = db.data.testers.filter(t => t.id !== id);
        await db.write();
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao remover testador: ' + err });
    }
  });

  app.post('/api/testers/toggle-confirm', async (req, res) => {
    try {
      const { id } = req.body;
      await db.read();
      if (db.data.testers) {
        const tester = db.data.testers.find(t => t.id === id);
        if (tester) {
          tester.confirmado = !tester.confirmado;
          await db.write();
          return res.json({ success: true, tester });
        }
      }
      res.status(404).json({ error: 'Testador não encontrado' });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao atualizar testador: ' + err });
    }
  });

  // Temporary fix endpoint for Santa Rita entry
  app.post('/api/admin/fix-escala-santa-rita', async (req, res) => {
    try {
      const paroquia = 'Paróquia Santa Rita de Cássia';
      if (!db.data || !db.data.escalaGerada || !db.data.escalaGerada[paroquia]) {
        return res.status(404).json({ error: 'No data found' });
      }

      const paroquiaEscala = db.data.escalaGerada[paroquia];
      let changed = false;

      Object.keys(paroquiaEscala).forEach(date => {
        Object.keys(paroquiaEscala[date]).forEach(horario => {
          const slot = paroquiaEscala[date][horario];
          if (slot.ministros && Array.isArray(slot.ministros)) {
            const newMinistros: string[] = [];
            let slotChanged = false;

            slot.ministros.forEach(m => {
              if (m === 'Cláudio e Shyrlei' || m === 'Claudio e Shyrlei') {
                newMinistros.push('Cláudio');
                newMinistros.push('Shyrlei');
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
        await db.write();
        return res.json({ status: 'ok', message: 'Correções aplicadas com sucesso.' });
      } else {
        return res.json({ status: 'ok', message: 'Nenhuma entrada incorreta encontrada.' });
      }
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Global error handler for API routes
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('[GLOBAL SERVER ERROR]', err);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: err.message || String(err)
    });
  });

  // 404 handler for API routes (prevent Vite SPA fallback or static file handler from returning index.html for unmatched API routes)
  app.all('/api/*', (req, res) => {
    console.warn(`[404 API NOT FOUND] ${req.method} ${req.originalUrl || req.path}`);
    res.status(404).json({ 
      error: 'Endpoint da API não encontrado',
      method: req.method,
      path: req.originalUrl || req.path 
    });
  });

  // Vite middleware for development (Moved to the end of routes)
  if (process.env.NODE_ENV !== 'production') {
    logDebug('[SERVER] Iniciando Vite em modo middleware...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    logDebug('[SERVER] Vite configurado.');
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    logDebug(`[SERVER] Modo produção. Servindo arquivos de: ${distPath}`);
    
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    logDebug(`[SERVER] Servidor ouvindo na porta ${PORT}`);

    // Trigger automatic reminders on startup and then periodically in the background
    console.log('[BACKGROUND LEMBRETE] Starting background reminder scheduler...');
    setTimeout(async () => {
      await triggerAllBackgroundReminders();
    }, 5000); // Wait 5 seconds for setup to finish

    setInterval(async () => {
      await triggerAllBackgroundReminders();
    }, 1000 * 60 * 15); // Run every 15 minutes
  });

  // Execute one-time fix for existing data
  setTimeout(async () => {
     try {
        console.log("[AUTO-FIX] Checking for incorrect couple entries...");
        const paroquia = 'Paróquia Santa Rita de Cássia';
        if (db.data && db.data.escalaGerada && db.data.escalaGerada[paroquia]) {
           const paroquiaEscala = db.data.escalaGerada[paroquia];
           let changed = false;
           Object.keys(paroquiaEscala).forEach(date => {
             Object.keys(paroquiaEscala[date]).forEach(horario => {
               const slot = paroquiaEscala[date][horario];
               if (slot.ministros && Array.isArray(slot.ministros)) {
                 const newMinistros: string[] = [];
                 let slotChanged = false;
                 slot.ministros.forEach(m => {
                   if (m === 'Cláudio e Shyrlei' || m === 'Claudio e Shyrlei') {
                     newMinistros.push('Cláudio');
                     newMinistros.push('Shyrlei');
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
             await db.write();
             console.log("[AUTO-FIX] Specific entry fixed and saved.");
           }
        }
     } catch (err) {
        console.error("[AUTO-FIX] Error:", err);
     }
  }, 10000); // Wait for DB to be fully ready
}

startServer();
