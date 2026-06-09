import 'dotenv/config';
import fs from 'fs';
fs.appendFileSync('debug.log', `${new Date().toISOString()} - [BOOT] server.ts starting...\n`);
import * as cheerio from 'cheerio';
import express from 'express';
import db, { setupDatabase } from './src/database';
import path from 'path';
import { fileURLToPath } from 'url';

const logDebug = (msg: string) => {
  console.log(`${new Date().toISOString()} - ${msg}`);
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
                  existing.role = 'coordenacao';
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

async function startServer() {
  await setupDatabase();
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

      // 1. Clear availability on the 15th (existing logic)
      if (now.getDate() === 15) {
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
          console.log('[Cleanup] Clearing availability for past and current months...');
          const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          const nextMonthStr = nextMonthDate.toISOString().substring(0, 7);
          
          const beforeCount = (db.data.disponibilidades || []).length;
          db.data.disponibilidades = (db.data.disponibilidades || []).filter(d => {
            const dispMonth = d.data.substring(0, 7);
            return dispMonth >= nextMonthStr;
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

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/config', async (req, res) => {
    const { paroquia } = req.query;
    logDebug(`[DEBUG] GET /api/config - paroquia: ${paroquia}`);
    try {
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
          maxEscalacoes: config.limiteEscalacaoPorParoquia?.[targetParoquia] ?? 3
        };
        return res.json(mergedConfig);
      }

      res.json(config);
    } catch (error) {
      logDebug(`[ERROR] Erro ao buscar config: ${error}`);
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
      maxEscalacoes
    } = req.body;
    
    const targetParoquia = paroquia ? String(paroquia).trim() : null;
    logDebug(`[DEBUG] Received config update: paroquia=${targetParoquia}, disponibilidadeAberta=${disponibilidadeAberta}, maxEscalacoes=${maxEscalacoes}`);
    
    await db.read();
    if (!db.data.config) db.data.config = { coordinatorEnabled: false, escalaPublicada: false, disponibilidadeAberta: false, disponibilidadeAbertaPorParoquia: {} };
    if (!db.data.config.disponibilidadeAbertaPorParoquia) db.data.config.disponibilidadeAbertaPorParoquia = {};
    if (!db.data.config.escalaPublicadaPorParoquia) db.data.config.escalaPublicadaPorParoquia = {};
    if (!db.data.config.escalaPublicadaPorMes) db.data.config.escalaPublicadaPorMes = {};
    if (!db.data.config.limiteEscalacaoPorParoquia) db.data.config.limiteEscalacaoPorParoquia = {};
    
    if (targetParoquia && maxEscalacoes !== undefined) {
      db.data.config.limiteEscalacaoPorParoquia[targetParoquia] = maxEscalacoes === "libre" || maxEscalacoes === 99 || maxEscalacoes === "99" ? 99 : Number(maxEscalacoes);
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
    console.log(`Tentativa de login: Nome=${nome}, Telefone=${telefone}, Senha=${senha}`);
    try {
      await db.read();
      console.log(`Total de ministros no banco: ${db.data.ministros.length}`);
      
      const cleanPhone = (phone: string | null | undefined) => phone ? phone.replace(/\D/g, '') : '';
      const loginPhone = cleanPhone(telefone);
      console.log(`Telefone limpo para login: ${loginPhone}`);

      // Procura o ministro que corresponda ao telefone (comparando apenas dígitos)
      console.log('Ministros cadastrados (primeiros 5):', db.data.ministros.slice(0, 5).map(m => ({ nome: m.nome, telefone: m.telefone, telefoneConjuge: m.telefoneConjuge })));
      const ministro = db.data.ministros.find(m => 
        (m.telefone && cleanPhone(m.telefone) === loginPhone) || 
        (m.telefoneConjuge && cleanPhone(m.telefoneConjuge) === loginPhone)
      );
      
      if (!ministro) {
        console.log(`Login falhou: Ministro não encontrado para o telefone ${loginPhone}`);
        const debugInfo = {
          loginPhone,
          totalMinistros: db.data.ministros.length,
          samplePhones: db.data.ministros.slice(0, 5).map(m => cleanPhone(m.telefone))
        };
        return res.status(401).json({ error: 'Telefone ou senha inválidos.', data: { debugInfo } });
      }
      console.log(`Ministro encontrado: ${ministro.nome}`);

      // Verifica se o nome digitado corresponde ao nome de exibição ou nome principal (ou cônjuge)
      const inputNome = nome.toLowerCase().trim();
      const isPrincipal = (ministro.nomeExibicao && ministro.nomeExibicao.toLowerCase().trim() === inputNome) || 
                          (ministro.nome.toLowerCase().trim() === inputNome);
      
      const isConjuge = (ministro.nomeExibicaoConjuge && ministro.nomeExibicaoConjuge.toLowerCase().trim() === inputNome) || 
                        (ministro.nomeConjuge && ministro.nomeConjuge.toLowerCase().trim() === inputNome);

      // Verificação rigorosa: o nome deve corresponder ao telefone usado para o login
      const isEleLogin = cleanPhone(ministro.telefone) === loginPhone;
      const isElaLogin = cleanPhone(ministro.telefoneConjuge) === loginPhone;

      // Validação de senha por usuário
      // Se o nome corresponder ao titular, usa a senha do titular.
      // Se corresponder ao cônjuge, usa a senha do cônjuge (ou a do titular como fallback).
      const senhaCorreta = isConjuge && !isPrincipal ? (ministro.senhaConjuge || ministro.senha) : ministro.senha;

      const debugInfo = {
        inputNome,
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

      if (senha !== senhaCorreta) {
        return res.status(401).json({ error: 'Telefone ou senha inválidos.', data: { debugInfo } });
      }

      if (isEleLogin && !isPrincipal) {
        return res.status(401).json({ error: 'O nome informado não corresponde ao titular deste telefone.', data: { debugInfo } });
      }
      if (isElaLogin && !isConjuge) {
        return res.status(401).json({ error: 'O nome informado não corresponde ao cônjuge deste telefone.', data: { debugInfo } });
      }
      if (!isEleLogin && !isElaLogin) {
        // Fallback for cases where phone might be the same for both (though not ideal)
        if (!isPrincipal && !isConjuge) {
          return res.status(401).json({ error: 'O nome informado não corresponde ao cadastro.', data: { debugInfo } });
        }
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
      if (finalRole === 'coordenacao' && ministro.tipo === 'casal') {
        const acesso = ministro.acessoCoordenacao || 'casal';
        if (acesso === 'ele' && !isEleLogin) finalRole = 'ministro';
        if (acesso === 'ela' && !isElaLogin) finalRole = 'ministro';
      }

      userResponse.role = finalRole;

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
    try {
      await db.read();
      if (!db.data.config) db.data.config = { coordinatorEnabled: false, escalaPublicada: false, adminPassword: '999' };
      const adminPass = db.data.config.adminPassword || '999';
      console.log('Admin Login Attempt:', { receivedPassword: senha, storedPassword: adminPass });
      
      if (senha === adminPass) {
        res.json({ message: 'Login Admin bem-sucedido!', user: { nome: 'Admin', role: 'admin' } });
      } else {
        res.status(401).json({ error: 'Senha de administrador incorreta.' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Erro no login admin.' });
    }
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
    const { nome, nomeExibicao, nomeExibicaoConjuge, telefone, dataNascimento, nomeConjuge, dataNascimentoConjuge, telefoneConjuge, paroquia, senha, senhaConjuge, role, aprovado, acessoCoordenacao, tipo, afastado, afastadoConjuge, tempoMinisterio, tempoMinisterioConjuge, incompatibilidades } = req.body;
    console.log(`Tentativa de cadastro: Nome=${nome}, Telefone=${telefone}, Paróquia=${paroquia}`);

    if (!nome || !telefone || !senha || !paroquia) {
      console.log('Cadastro falhou: Campos obrigatórios ausentes.');
      return res.status(400).json({ error: 'Nome, telefone, senha e paróquia são obrigatórios.' });
    }

    try {
      await db.read();
      const existingMinistro = db.data.ministros.find(m => m.telefone === telefone);
      if (existingMinistro) {
        console.log(`Cadastro falhou: Ministro com telefone ${telefone} já existe.`);
        return res.status(409).json({ error: 'Ministro com este telefone já cadastrado.' });
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
        incompatibilidades: incompatibilidades || []
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
      if (ministro.telefoneConjuge && cleanPhone(ministro.telefoneConjuge) === searchPhone) {
        responseData.nome = ministro.nomeConjuge;
        responseData.telefone = ministro.telefoneConjuge;
        responseData.dataNascimento = ministro.dataNascimentoConjuge;
        responseData.nomeConjuge = ministro.nome;
        responseData.telefoneConjuge = ministro.telefone;
        responseData.dataNascimentoConjuge = ministro.dataNascimento;
      }

      res.json(responseData);
    } catch (error) {
      console.error('Erro ao buscar ministro:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.put('/api/ministros/:telefone', async (req, res) => {
    const { telefone } = req.params;
    const { nome, nomeExibicao, nomeExibicaoConjuge, nomeConjuge, dataNascimento, dataNascimentoConjuge, paroquia, senha, senhaConjuge, telefone: novoTelefone, telefoneConjuge, tipo, role, acessoCoordenacao, afastado, afastadoConjuge, tempoMinisterio, tempoMinisterioConjuge, incompatibilidades } = req.body;

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
      if (novoTelefone && novoTelefone !== telefone) {
        const existing = db.data.ministros.find(m => m.telefone === novoTelefone);
        if (existing) {
          return res.status(409).json({ error: 'Telefone já cadastrado para outro ministro.' });
        }
        ministro.telefone = novoTelefone;
      }
      if (nomeConjuge !== undefined) ministro.nomeConjuge = cleanName(nomeConjuge);
      if (dataNascimento !== undefined) ministro.dataNascimento = dataNascimento;
      if (dataNascimentoConjuge !== undefined) ministro.dataNascimentoConjuge = dataNascimentoConjuge;
      if (paroquia !== undefined) ministro.paroquia = paroquia;
      if (senha !== undefined) ministro.senha = senha;
      if (senhaConjuge !== undefined) ministro.senhaConjuge = senhaConjuge;
      if (telefoneConjuge !== undefined) ministro.telefoneConjuge = telefoneConjuge;
      if (tipo !== undefined) ministro.tipo = tipo;
      if (role !== undefined) ministro.role = role;
      if (acessoCoordenacao !== undefined) ministro.acessoCoordenacao = acessoCoordenacao;
      if (afastado !== undefined) ministro.afastado = afastado;
      if (afastadoConjuge !== undefined) ministro.afastadoConjuge = afastadoConjuge;
      if (tempoMinisterio !== undefined) ministro.tempoMinisterio = tempoMinisterio;
      if (tempoMinisterioConjuge !== undefined) ministro.tempoMinisterioConjuge = tempoMinisterioConjuge;
      if (incompatibilidades !== undefined) ministro.incompatibilidades = incompatibilidades;

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

      const newPassword = Math.floor(100 + Math.random() * 900).toString(); // 3-digit password
      
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

  if (diaAbertura && horaAbertura && diaFechamento && horaFechamento) {
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
    const isCoordenadorRequest = isCoordenador === true || role === 'admin' || role === 'coordenador' || role === 'coordenacao' || role.includes('coordena');
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
        if (ministro.nome !== nome) ministro.nome = nome;
        if (tipo) ministro.tipo = tipo;
        if (nomeConjuge) ministro.nomeConjuge = nomeConjuge;
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
        : `${new Date().getFullYear()}-${String(new Date().getMonth() + 2 > 12 ? new Date().getMonth() - 10 : new Date().getMonth() + 2).padStart(2, '0')}`;

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
        let isCasal = disp.modo === 'casal';
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
          } else if (disp.modo === 'ela') {
            nomeExibicao = ministro.nomeExibicaoConjuge || ministro.nomeConjuge;
          } else if (disp.modo === 'ele') {
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
      const allMissas = db.data.missasTemporarias || []; // Contém fixas e temporárias

      // Missas Padrão (Hardcoded para garantir que sempre existam, caso não tenham sido sobrescritas)
      const MISSAS_PADRAO = [
        { id: 'padrao-sab-17', nome: 'Missa de Sábado', frequencia: 'semanal', diaSemana: '6', horario: '17:00', quantidade: 6, tipo: 'padrao' },
        { id: 'padrao-dom-07', nome: 'Missa de Domingo', frequencia: 'semanal', diaSemana: '0', horario: '07:30', quantidade: 5, tipo: 'padrao' },
        { id: 'padrao-dom-10', nome: 'Missa de Domingo', frequencia: 'semanal', diaSemana: '0', horario: '10:00', quantidade: 8, tipo: 'padrao' },
        { id: 'padrao-dom-19', nome: 'Missa de Domingo', frequencia: 'semanal', diaSemana: '0', horario: '19:00', quantidade: 8, tipo: 'padrao' },
      ];

      // Mesclar missas padrão apenas se não houver paróquia específica (manter consistência com o GET)
      const missas = [];
      
      if (!targetParoquia) {
        // Se por algum motivo não tiver paróquia, usa o comportamento legado
        MISSAS_PADRAO.forEach(mp => {
          const override = allMissas.find(m => {
            const missaParoquia = (m.paroquia && m.paroquia !== 'undefined') ? String(m.paroquia).trim() : '';
            return missaParoquia === '' &&  m.nome === mp.nome && m.horario === mp.horario && !m.data;
          });
          
          if (override) {
            if (!override.deletada) missas.push({ ...mp, ...override, paroquia: 'Padrão' });
          } else {
            missas.push({ ...mp, paroquia: 'Padrão' });
          }
        });
      }

      // Adicionar as outras missas cadastradas no banco (fixas e temporárias)
      allMissas.forEach(m => {
        if (m.deletada) return; // Ignora as marcadas como deletadas
        const missaParoquia = (m.paroquia && m.paroquia !== 'undefined') ? String(m.paroquia).trim() : '';
        
        if (targetParoquia) {
          // STRICT CNPJ SEPARATION: A missa DEVE pertencer a esta paróquia
          if (missaParoquia.toLowerCase() === targetParoquia.toLowerCase()) {
            missas.push(m);
          }
        } else {
          // Lógica global (fallback legado)
          if (missaParoquia === '') {
            const isOverride = MISSAS_PADRAO.some(mp => mp.nome === m.nome && mp.horario === m.horario && !m.data);
            if (!isOverride) missas.push(m);
          }
        }
      });

      console.log(`[POST /api/escala/gerar] Missas encontradas para a paróquia: ${missas.length}`);
      if (missas.length < 10) {
        console.log(`[POST /api/escala/gerar] Nomes das missas: ${missas.map(m => `${m.nome} (${m.horario})`).join(', ')}`);
      }

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
        const d = new Date(Date.UTC(year, month, day));
        
        // Let's use Monday as start of week.
        const dayOfWeek = (d.getUTCDay() + 6) % 7; // 0 (Mon) to 6 (Sun)
        d.setUTCDate(d.getUTCDate() - dayOfWeek + 3);
        const firstThursday = d.getTime();
        d.setUTCMonth(0, 1);
        if (d.getUTCDay() !== 4) {
          d.setUTCMonth(0, 1 + ((4 - d.getUTCDay()) + 7) % 7);
        }
        const weekNum = 1 + Math.ceil((firstThursday - d.getTime()) / 604800000);
        return `${d.getUTCFullYear()}-W${weekNum}`;
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
              
              if (slots[slotKey] && prevSlot.ministros && Array.isArray(prevSlot.ministros)) {
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
                      const peso = matchedMin.tipo === 'casal' ? 2 : 1;
                      if (slots[slotKey].ocupacao + peso <= slots[slotKey].quantidade) {
                        slots[slotKey].ministros.push({
                          id: mId,
                          nome: pmNome,
                          modo: peso === 2 ? 'casal' : 'individual',
                          telefone: matchedMin.telefone || ''
                        });
                        
                        registrarEscalacaoNoDia(dt, mId, pmNome);
                        contagemMinistro[mId]++;
                        slots[slotKey].ocupacao += peso;
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

      function tentarPreencher(maxEscalacoesPermitidas: number, ignorarRestricoes = false, ignorarRegraDaSemana = false) {
        let alocouAlguem = false;
        
        // Sort slots by scarcity (number of candidates available vs needed spots)
        // This ensures dates with few availability get prioritized (like 07/06 missing people)
        const currentOrder = [...chavesSlots].sort((a, b) => {
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

          // Shuffle candidates radically EVERY round for EVERY slot
          const candidatesToTest = [...slot.candidatos].map(d => {
            const m = ministros.find(min => String(min.id) === String(d.ministro_id));
            let p = 1;
            if (d.modo === 'casal' || (m?.tipo === 'casal' && d.modo !== 'ele' && d.modo !== 'ela')) p = 2;
            return { ...d, peso: p };
          }).sort((a: any, b: any) => {
            const mIdA = String(a.ministro_id);
            const mIdB = String(b.ministro_id);
            const countA = contagemMinistro[mIdA] || 0;
            const countB = contagemMinistro[mIdB] || 0;
            
            // 1. Fairness first
            if (countA !== countB) return countA - countB;

            // 2. Vulnerability/Flexibility with probabilistic jitter for rotation:
            // Instead of absolute strict ordering by total availabilities, we add a randomized jitter.
            // This ensures we still prioritize highly constrained ministers (vulnerable),
            // but also allows other available ministers to rotate in when clicking "Zerar Mês".
            const flexA = (dispCount[mIdA] || 0) + (randomTieBreaker[mIdA] * 4);
            const flexB = (dispCount[mIdB] || 0) + (randomTieBreaker[mIdB] * 4);
            if (Math.abs(flexA - flexB) > 0.01) return flexA - flexB;
            
            // 3. Weight tie-break: Prioritize heavier units (couples) to fill larger gaps first
            if (a.peso !== b.peso) return b.peso - a.peso;
            
            // 4. Absolute precise randomness
            return (randomTieBreaker[mIdA] || 0) - (randomTieBreaker[mIdB] || 0);
          });

          for (const disp of candidatesToTest) {
            if (slot.ocupacao >= slot.quantidade) break;

            const mId = String(disp.ministro_id);
            const ministro = ministros.find(m => String(m.id) === mId);
            if (!ministro) continue;

            const modo = disp.modo || 'individual';
            const peso = disp.peso;

            // Define display name early for duplicate checks
            let nomeExib = ministro.nomeExibicao || ministro.nome;
            if (peso === 2) {
              nomeExib = `${ministro.nomeExibicao || ministro.nome} e ${ministro.nomeExibicaoConjuge || ministro.nomeConjuge}`;
            } else if (modo === 'ela') {
              nomeExib = ministro.nomeExibicaoConjuge || ministro.nomeConjuge;
            }

            // --- THE GATES (STRICT ORDER) ---

            // 1. Capacity Gate
            if (contagemMinistro[mId] >= maxEscalacoesPermitidas && !ignorarRestricoes) continue;
            if (slot.ocupacao + peso > slot.quantidade) continue;

            // 2. DUPLICATION GATE (ABSOLUTE RIGOR - NEVER IGNORED)
            if (isJaEscaladoNoDia(slot.data, mId, nomeExib)) continue;

            // 3. SEQUENCE GATE (SAT/SUN - ABSOLUTE RIGOR - NEVER IGNORED)
            const { prevStr, nextStr } = getAdjacentDateStrings(slot.data);
            if (isJaEscaladoNoDia(prevStr, mId, nomeExib) || isJaEscaladoNoDia(nextStr, mId, nomeExib)) continue;

            // 3.5. WEEK PROTECT GATE
            if (!ignorarRegraDaSemana && isJaEscaladoNaSemana(slot.data, mId)) continue;

            // 4. NEW vs EXPERIENCED PROTECTION (RELAXABLE)
            const isNovoTitular = ministro.tempoMinisterio === 'novo';
            const isNovoConjuge = ministro.tempoMinisterioConjuge === 'novo';
            const isNovoCandidato = peso === 1 ? (modo === 'ela' ? isNovoConjuge : isNovoTitular) : (isNovoTitular || isNovoConjuge);

            if (isNovoCandidato && !ignorarRestricoes) {
              const currentNovos = (slot.novosCount || 0);
              if (currentNovos >= 2) continue;
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

      // COORDENADOR CONFIGURABLE LIMIT
      const limitConfig = db.data.config?.limiteEscalacaoPorParoquia?.[targetParoquia] ?? 3;
      console.log(`[POST /api/escala/gerar] Limite configurado de escalações por ministro: ${limitConfig}`);

      // ROUNDS FOR ROTATION
      // Try to give everyone up to Math.min(3, limitConfig) times WITHOUT violating the week rule. This is the main fill logic.
      const initialLimit = Math.min(3, limitConfig);
      for (let l = 1; l <= initialLimit; l++) {
        tentarPreencher(l, false, false);
      }

      // Still missing spots? Let's try up to limitConfig times without week rule violation
      for (let l = initialLimit + 1; l <= limitConfig; l++) {
        tentarPreencher(l, false, false);
      }

      // Now we have holes. We strictly need to fill them, we relax the WEEK rule but NOT the max times yet!
      for (let l = 1; l <= initialLimit; l++) {
        tentarPreencher(l, false, true);
      }

      // Now let's try up to limitConfig with relax on the week rule
      for (let l = initialLimit + 1; l <= limitConfig; l++) {
        tentarPreencher(l, false, true);
      }

      // Cleanup final relaxando as restrições de experiência e a regra da semana
      tentarPreencher(99, true, true); 

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
      Object.values(slots).forEach((slot: any) => {
        if (!escalaFinal[slot.data]) escalaFinal[slot.data] = {};
        
        if (!escalaFinal[slot.data][slot.horario]) {
          escalaFinal[slot.data][slot.horario] = {
            ministros: [],
            nome: slot.nome,
            limiteManual: slot.quantidade
          };
        }
        
        slot.ministros.forEach(m => {
          escalaFinal[slot.data][slot.horario].ministros.push(m.nome);
        });
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
          
          if (mes === mesAtualStr || isMesPublicado) {
            escalaFiltrada[data] = escalaCompleta[data];
          }
        }
      });
      
      console.log(`[GET /api/escala] escalaFiltrada keys (mesAtualStr=${mesAtualStr}): ${Object.keys(escalaFiltrada).length}, isPreview: ${isPreview}, targetParoquia: ${targetParoquia}, !!escalaPublicadaPorParoquia=${!!escalaPublicadaPorParoquia}, config.escalaPublicada=${db.data.config.escalaPublicada}`);
      res.json(escalaFiltrada);
    } catch (error) {
      console.error('Erro ao buscar escala:', error);
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
    const { paroquia, ministroId } = req.query;
    if (!paroquia) {
      return res.status(400).json({ error: 'Paróquia é obrigatória.' });
    }
    try {
      await db.read();
      let trocas = db.data.trocas || [];
      
      // Filter by paroquia
      const targetParoquia = String(paroquia).trim().toLowerCase();
      trocas = trocas.filter(t => t.paroquia.trim().toLowerCase() === targetParoquia);
      
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
      missaDestinoMissa
    } = req.body;

    if (!solicitanteId || !paroquia || !missaOrigemData || !missaOrigemHorario || !tipo || !destinatarioId) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    try {
      await db.read();
      if (!db.data.trocas) db.data.trocas = [];

      const {
        solicitanteSubMembro,
        destinatarioSubMembro,
        segundoDestinatarioId,
        segundoDestinatarioNome,
        segundoDestinatarioTelefone
      } = req.body;

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
        confirmadoSolicitante: false,
        confirmadoDestinatario: false,
        dataSolicitacao: new Date().toISOString(),
        solicitanteSubMembro: solicitanteSubMembro || 'ambos',
        destinatarioSubMembro: destinatarioSubMembro || 'ambos',
        segundoDestinatarioId: segundoDestinatarioId ? Number(segundoDestinatarioId) : undefined,
        segundoDestinatarioNome: segundoDestinatarioNome ? String(segundoDestinatarioNome) : undefined,
        segundoDestinatarioTelefone: segundoDestinatarioTelefone ? String(segundoDestinatarioTelefone) : undefined
      };

      db.data.trocas.push(novaTroca);
      await db.write();

      // Enviar mensagem automática no sistema para registrar que houve uma solicitação
      if (!db.data.mensagens) db.data.mensagens = [];
      const msgTexto = `⚠️ [Solicitação de Troca] O ministro ${solicitanteNome} solicitou troca para a missa do dia ${missaOrigemData.split('-').reverse().join('/')} às ${missaOrigemHorario} com o ministro ${destinatarioNome}.`;
      
      db.data.mensagens.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        nome: 'Sistema',
        telefone: '0000000000',
        destinatario_telefone: destinatarioTelefone || null,
        texto: msgTexto,
        data: new Date().toLocaleString('pt-BR'),
        paroquia: String(paroquia),
        type: 'direct',
        lida: false
      });
      await db.write();

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

      if (resposta === 'aceitar') {
        troca.status = 'pendente_coordenacao';
      } else {
        troca.status = 'rejeitado_destinatario';
      }

      await db.write();
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
      if (troca.status !== 'pendente_coordenacao') {
        return res.status(400).json({ error: 'Essa troca não está pendente de aprovação da coordenação.' });
      }

      if (resposta === 'rejeitar') {
        troca.status = 'rejeitado_coordenacao';
        await db.write();
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
          const slotMinistros = slot.ministros || [];
          
          const solMin = db.data.ministros.find(m => Number(m.id) === Number(solicitanteId));
          const destMin = db.data.ministros.find(m => Number(m.id) === Number(destinatarioId));
          
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
                  slotMinistros[matchIndex] = destDisplayName ? `${destDisplayName} e ${esposaName}` : esposaName;
                } else {
                  if (destDisplayName) {
                      slotMinistros[matchIndex] = destDisplayName;
                  } else {
                      slotMinistros.splice(matchIndex, 1);
                  }
                }
                console.log(`[TROCA PARCIAL] Marido substituído. Novo valor: ${slotMinistros[matchIndex] || 'REMOVIDO'}`);
              } else if (subMembro === 'esposa') {
                const hasMarido = originalStr && (
                  normalize(originalStr).includes(normalize(maridoName)) ||
                  (solMin.nome && normalize(originalStr).includes(normalize(solMin.nome))) ||
                  (solMin.nomeExibicao && normalize(originalStr).includes(normalize(solMin.nomeExibicao)))
                );
                if (hasMarido) {
                  slotMinistros[matchIndex] = destDisplayName ? `${maridoName} e ${destDisplayName}` : maridoName;
                } else {
                  if (destDisplayName) {
                      slotMinistros[matchIndex] = destDisplayName;
                  } else {
                      slotMinistros.splice(matchIndex, 1);
                  }
                }
                console.log(`[TROCA PARCIAL] Esposa substituída. Novo valor: ${slotMinistros[matchIndex] || 'REMOVIDO'}`);
              }
            } else {
              // FULL SWAP / STANDARD SWAP - ORIGIN
              if (tAny.segundoDestinatarioNome && matchIndex !== -1) {
                // Replacing a couple with two individuals
                slotMinistros.splice(matchIndex, 1, destDisplayName, tAny.segundoDestinatarioNome);
                console.log(`[TROCA DUPLA] Casal substituído por dois individuais: ${destDisplayName} e ${tAny.segundoDestinatarioNome}`);
              } else {
                if (matchIndex !== -1) {
                  slotMinistros[matchIndex] = destDisplayName;
                  console.log(`[TROCA PADRÃO] Substituído index ${matchIndex} por ${destDisplayName}`);
                } else {
                  slotMinistros.push(destDisplayName);
                  console.log(`[TROCA FORÇADA] Solicitante não localizado no slot. Forçando adição: ${destDisplayName}`);
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
            const slotMinistrosDest = slotDest.ministros || [];

            const solMin = db.data.ministros.find(m => Number(m.id) === Number(solicitanteId));
            const destMin = db.data.ministros.find(m => Number(m.id) === Number(destinatarioId));

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

              // Solicitante Display Name (who is taking the destination slot)
              const tAny = troca as any;
              let solDisplayName = solMin ? (solMin.nomeExibicao || solMin.nome) : "";
              if (solMin && solMin.tipo === 'casal' && (!tAny.solicitanteSubMembro || tAny.solicitanteSubMembro === 'ambos')) {
                solDisplayName = `${solMin.nomeExibicao || solMin.nome} e ${solMin.nomeExibicaoConjuge || solMin.nomeConjuge}`;
              } else if (solMin && solMin.tipo === 'casal' && tAny.solicitanteSubMembro === 'marido') {
                solDisplayName = solMin.nomeExibicao || solMin.nome;
              } else if (solMin && solMin.tipo === 'casal' && tAny.solicitanteSubMembro === 'esposa') {
                solDisplayName = solMin.nomeExibicaoConjuge || solMin.nomeConjuge;
              }

              const destSubMembro = tAny.destinatarioSubMembro || 'ambos'; // 'ambos' | 'marido' | 'esposa'

              if (destMin.tipo === 'casal' && destSubMembro !== 'ambos' && matchIndexDest !== -1) {
                // PARTIAL COUPLE SWAP - DESTINATION
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
                    slotMinistrosDest[matchIndexDest] = solDisplayName ? `${solDisplayName} e ${esposaName}` : esposaName;
                  } else {
                    if (solDisplayName) {
                        slotMinistrosDest[matchIndexDest] = solDisplayName;
                    } else {
                        slotMinistrosDest.splice(matchIndexDest, 1);
                    }
                  }
                  console.log(`[TROCA PARCIAL - DEST] Marido substituído. Novo valor: ${slotMinistrosDest[matchIndexDest] || 'REMOVIDO'}`);
                } else if (destSubMembro === 'esposa') {
                  const hasMarido = originalStr && (
                    normalize(originalStr).includes(normalize(maridoName)) ||
                    (destMin.nome && normalize(originalStr).includes(normalize(destMin.nome))) ||
                    (destMin.nomeExibicao && normalize(originalStr).includes(normalize(destMin.nomeExibicao)))
                  );
                  if (hasMarido) {
                    slotMinistrosDest[matchIndexDest] = solDisplayName ? `${maridoName} e ${solDisplayName}` : maridoName;
                  } else {
                    if (solDisplayName) {
                        slotMinistrosDest[matchIndexDest] = solDisplayName;
                    } else {
                        slotMinistrosDest.splice(matchIndexDest, 1);
                    }
                  }
                  console.log(`[TROCA PARCIAL - DEST] Esposa substituída. Novo valor: ${slotMinistrosDest[matchIndexDest] || 'REMOVIDO'}`);
                }
              } else {
                // FULL SWAP - DESTINATION
                if (matchIndexDest !== -1) {
                  slotMinistrosDest[matchIndexDest] = solDisplayName;
                  console.log(`[TROCA PADRÃO DEST] Substituído index ${matchIndexDest} por ${solDisplayName}`);
                } else {
                  slotMinistrosDest.push(solDisplayName);
                  console.log(`[TROCA FORÇADA DEST] Destinatário não localizado no slot. Forçando adição: ${solDisplayName}`);
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
        texto: `✅ [Troca Aprovada] A coordenação aprovou a sua troca para a missa do dia ${missaOrigemData.split('-').reverse().join('/')} às ${missaOrigemHorario}. O ministro ${troca.destinatarioNome} agora está escalado em seu lugar!`,
        data: new Date().toLocaleString('pt-BR'),
        paroquia: String(paroquia),
        type: 'direct',
        lida: false
      });
      await db.write();

      res.json(troca);
    } catch (error) {
      console.error('Erro ao responder como coordenador:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
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
      
      const isOlderThan3Days = (dateStr: string) => {
        const msgDate = new Date(dateStr);
        const diffTime = Math.abs(agora.getTime() - msgDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 3;
      };

      // Filter messages that are not older than 3 days AND match paroquia AND match type (if provided)
      const activeMessages = db.data.mensagens.filter(msg => {
        if (isOlderThan3Days(msg.data)) return false;
        if (paroquia && msg.paroquia !== paroquia) return false;
        
        const msgType = msg.type || 'broadcast';
        const requestedType = (type as string) || 'broadcast';
        
        if (requestedType === 'private') {
          // Only return private messages for this specific user
          if (msgType !== 'private') return false;
          if (req.query.telefone && msg.destinatario_telefone !== req.query.telefone) {
            console.log(`[GET /api/mensagens] Private message dropped: msg.destinatario_telefone (${msg.destinatario_telefone}) !== req.query.telefone (${req.query.telefone})`);
            return false;
          }
          return true;
        }
        
        // If it's a minister requesting broadcast messages, also include private messages for them
        if (requestedType === 'broadcast') {
          // Include if it's a broadcast OR if it's a private message for this minister's phone
          const isPrivateForUser = msgType === 'private' && req.query.telefone && String(msg.destinatario_telefone) === String(req.query.telefone);
          if (msgType === 'broadcast' || isPrivateForUser) return true;
          
          if (msgType === 'private') {
             const logMsg = `[GET /api/mensagens] Private message dropped in broadcast request: msg.destinatario_telefone (${msg.destinatario_telefone}) !== req.query.telefone (${req.query.telefone})\n`;
             console.log(logMsg);
             fs.appendFileSync('src/msg.log', logMsg);
          }
          return false;
        }

        if (msgType !== requestedType) return false;

        return true;
      });
      console.log(`[GET /api/mensagens] Returning ${activeMessages.length} messages for paroquia=${paroquia}, type=${type}, telefone=${req.query.telefone}`);
      
      // If some messages were filtered out due to age, we could update the DB
      // We only remove old messages, not messages from other parishes (they might be valid for others)
      const validMessages = db.data.mensagens.filter(msg => !isOlderThan3Days(msg.data));
      
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
      
      const aniversariantesList = ministrosFiltrados.map(m => {
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

      res.json({
        totalMinistros,
        totalDisponibilidades,
        totalAniversariantes: aniversariantesList.length,
        pendingApprovals,
        aniversariantesList,
        lowStockCount
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  const liturgiaCache = new Map<string, { data: any, timestamp: number }>();
  const LITURGIA_CACHE_TTL = 1000 * 60 * 60 * 2; // 2 horas

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
            const heading = $(el).find('h1, h2, h3').text().trim().toLowerCase();
            
            if (heading.includes('evangelho')) {
              const pText: string[] = [];
              $(el).find('.section__content p').each((j, p) => { pText.push($(p).text().trim()); });
              
              if (pText.length >= 2) {
                 referencia = pText[0] + ' ' + pText[1];
              } else if (pText.length > 0) {
                 referencia = $(el).find('h1, h2, h3').text().trim() + ' ' + pText[0];
              } else {
                 referencia = $(el).find('h1, h2, h3').text().trim();
              }
              texto = pText.join('\n\n');
              successVatican = pText.length > 0;
            }
            
            if (heading.includes('as palavras dos') || heading.includes('palavras do papa') || heading.includes('papa francisco')) {
              let pTextPapas: string[] = [];
              $(el).find('.section__content p').each((i, p) => { pTextPapas.push($(p).text().trim()); });
              papasText = pTextPapas.join('\n\n');
            }
          });
        }
      } catch (err) {
        console.error("Failed to parse Vatican news:", err);
      }

      // Se falhou em obter o evangelho do vaticano vamo usar o fallback
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
           const data = await response.json();
           if (data && data.evangelho) {
             referencia = data.evangelho.referencia || data.evangelho.titulo || referencia;
             const titulo = data.evangelho.titulo ? data.evangelho.titulo + '\n\n' : '';
             const textoEvangelho = data.evangelho.texto || '';
             texto = titulo + textoEvangelho;
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
        }
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

  app.get('/api/ministros/aniversariantes', async (req, res) => {
    let { paroquia } = req.query;
    if (paroquia === 'undefined' || paroquia === 'null') paroquia = undefined;

    try {
      await db.read();
      const agora = new Date();
      const mesAtual = agora.getMonth() + 1; // 1-12

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

  app.get('/api/admin/pending', async (req, res) => {
    let { paroquia } = req.query;
    if (paroquia === 'undefined' || paroquia === 'null') paroquia = undefined;

    try {
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
      await db.read();
      let coordinators = db.data.ministros.filter(m => m.role === 'coordenacao' && m.aprovado === true);
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
      if (senha !== undefined) coord.senha = senha;
      if (tipo !== undefined) coord.tipo = tipo;
      
      if (tipo === 'casal') {
        if (nomeConjuge !== undefined) coord.nomeConjuge = cleanName(nomeConjuge);
        if (nomeExibicaoConjuge !== undefined) coord.nomeExibicaoConjuge = cleanName(nomeExibicaoConjuge);
        if (telefoneConjuge !== undefined) coord.telefoneConjuge = telefoneConjuge;
        if (senhaConjuge !== undefined) coord.senhaConjuge = senhaConjuge;
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
    if (paroquia === 'undefined' || paroquia === 'null') paroquia = undefined;

    try {
      await db.read();
      const ministros: any[] = [];
      const qP = paroquia ? normalize(paroquia as string) : null;
      console.log(`[DEBUG] Fetching ministers for paroquia: '${paroquia}', normalized: '${qP}'`);
      
      (db.data.ministros || []).forEach(m => {
        if (m.aprovado !== true || m.role === 'admin') return;
        if (qP) {
          if (!m.paroquia) {
            console.log(`[DEBUG] Minister ${m.nome} has no paroquia`);
            return;
          }
          const mP = normalize(m.paroquia);
          if (mP !== qP) {
            console.log(`[DEBUG] Minister ${m.nome} paroquia '${m.paroquia}' (normalized '${mP}') does not match '${qP}'`);
            return;
          }
        }
        
        // Add the minister
        ministros.push(m);
      });
      
      ministros.sort((a, b) => a.nome.localeCompare(b.nome));
      res.json(ministros);
    } catch (error) {
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
        estoqueMovimentacoes: []
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
      
      // Adicionar missas padrão (apenas se não houver paróquia específica)
      if (!paroquiaStr) {
        MISSAS_PADRAO.forEach(mp => {
          const override = missasDaParoquia.find(m => 
            (m.tipo === 'padrao' || m.tipo === 'fixa') && 
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
      }

      // Adicionar as outras missas cadastradas
      missasDaParoquia.forEach(m => {
        if (m.deletada) return;
        
        // Se houver paróquia específica, apenas adiciona as missas da paróquia sem tentar mesclar com default
        if (paroquiaStr) {
            missasMescladas.push(m);
            return;
        }

        const isDefaultOverride = MISSAS_PADRAO.some(mp => 
          m.horario === mp.horario && 
          m.diaSemana === mp.diaSemana && 
          (m.tipo === 'padrao' || m.tipo === 'fixa') &&
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
  app.get('/api/paroquias', async (req, res) => {
    try {
      await db.read();
      res.json(db.data.paroquias || []);
    } catch (error) {
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
          existing.role = 'coordenacao';
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
          existing.role = 'coordenacao';
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

  // Vite middleware for development
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
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    logDebug(`[SERVER] Servidor ouvindo na porta ${PORT}`);
  });
}

startServer();
