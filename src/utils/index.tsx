import React from 'react';
import { Star } from 'lucide-react';
import { User } from '../types';

export const safeJson = async <T = any>(res: Response | null | undefined, fallback: T = null as any): Promise<T> => {
  if (!res || !res.ok) return fallback;
  try {
    const contentType = res.headers ? res.headers.get('content-type') : '';
    if (contentType && !contentType.includes('application/json') && !contentType.includes('+json')) {
      return fallback;
    }
    const text = await res.text();
    if (!text || !text.trim()) return fallback;
    return JSON.parse(text) as T;
  } catch (e) {
    return fallback;
  }
};

import apiFetch from './api';

export const safeFetchJson = async <T = any>(url: string, options?: RequestInit, fallback: T = null as any): Promise<T> => {
  try {
    const res = await apiFetch(url, options);
    return await safeJson<T>(res, fallback);
  } catch (e) {
    return fallback;
  }
};

export const formatCep = (v: string): string => {
  if (!v) return '';
  const digits = v.replace(/\D/g, '').slice(0, 8);
  if (digits.length > 5) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return digits;
};

export const fetchAddressByCep = async (cep: string): Promise<{ logradouro?: string; bairro?: string; localidade?: string; uf?: string } | null> => {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;
  try {
    const res = await apiFetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (res.ok) {
      const data = await res.json();
      if (!data.erro) {
        return {
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          localidade: data.localidade || '',
          uf: data.uf || '',
        };
      }
    }
  } catch (err) {
    console.error('Erro ao buscar CEP:', err);
  }
  return null;
};

export const formatPhone = (v: string): string => {
  if (!v) return '';
  let r = v.replace(/\D/g, '');
  if (r.length > 11) r = r.slice(0, 11);
  
  if (r.length > 10) {
    // (14) 99123-4567
    return `(${r.slice(0, 2)}) ${r.slice(2, 7)}-${r.slice(7)}`;
  } else if (r.length > 6) {
    // (14) 9123-4567
    return `(${r.slice(0, 2)}) ${r.slice(2, 6)}-${r.slice(6)}`;
  } else if (r.length > 2) {
    // (14) 9123
    return `(${r.slice(0, 2)}) ${r.slice(2)}`;
  } else if (r.length > 0) {
    // (14
    return `(${r}`;
  }
  return r;
};

export const toTitleCase = (str: string): string => {
  const prepositions = ['da', 'de', 'do', 'das', 'dos', 'e'];
  
  // Remove special characters, keeping letters, numbers, spaces, apostrophes, and hyphens
  const cleanedStr = str.replace(/[^a-zA-ZÀ-ÿ0-9\s'-]/g, '').replace(/\s+/g, ' ');

  return cleanedStr
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index !== 0 && prepositions.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .trimStart(); // Prevent leading spaces
};

export const hasCoordAccess = (user: User | null | undefined): boolean => {
  if (!user) return false;
  
  // Se for admin, sempre tem acesso
  if (user.role === 'admin') return true;

  const isCoordenadorRole = user.role === "coordenacao" || user.role === "vice_coordenacao" || (user.role && user.role.toLowerCase().includes("coordena"));
  
  // Se o role já não for de coordenação, não tem acesso
  if (!isCoordenadorRole) return false;

  // Se for casal, verifica a restrição de acesso adicional (redundância com o servidor)
  if (user.tipo === 'casal') {
    const acesso = user.acessoCoordenacao || 'casal';
    if (user.isConjugeLogin) {
      // Cônjuge (ela) só tem acesso se for 'casal' ou 'ela'
      return acesso === 'casal' || acesso === 'ela';
    } else {
      // Titular (ele) só tem acesso se for 'casal' ou 'ele'
      return acesso === 'casal' || acesso === 'ele';
    }
  }

  return true;
};

export const isCoordenadorOrVice = (user: User | null | undefined): boolean => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const r = (user.role || '').toLowerCase();
  return r === 'coordenacao' || r === 'vice_coordenacao' || r === 'coordenador' || r.includes('coordena') || Boolean((user as any).isCoordenador);
};

export const areMinistersOverlapping = (m1: any, m2: any): boolean => {
  if (!m1 || !m2) return false;

  // 1. Direct ID comparison if both have an ID
  if (m1.id !== undefined && m2.id !== undefined) {
    return String(m1.id) === String(m2.id);
  }

  // 2. Direct clean phone comparison (DDD + number)
  const cleanP = (p: any) => {
    if (!p) return '';
    const num = String(p).replace(/\D/g, '');
    return num.startsWith('55') && num.length > 11 ? num.slice(2) : num;
  };
  const phones1 = [cleanP(m1.telefone), cleanP(m1.telefoneConjuge)].filter(p => p.length >= 8);
  const phones2 = [cleanP(m2.telefone), cleanP(m2.telefoneConjuge)].filter(p => p.length >= 8);
  if (phones1.length > 0 && phones2.length > 0) {
    return phones1.some(p => phones2.includes(p));
  }

  // If one has phone or ID and the other also has phone or ID, and they did NOT match above,
  // DO NOT allow fuzzy name matching to link different ministers!
  if ((m1.id !== undefined || phones1.length > 0) && (m2.id !== undefined || phones2.length > 0)) {
    return false;
  }

  // 3. Name comparison using strict token matching
  const getNames = (m: any): string[] => {
    if (typeof m === 'string') return [normalizeMinisterText(m)];
    return [
      m.nome,
      m.nomeExibicao,
      m.nomeConjuge,
      m.nomeExibicaoConjuge,
      m.solicitanteNome,
      m.destinatarioNome,
      m.segundoDestinatarioNome
    ].filter(Boolean).map(normalizeMinisterText);
  };

  const names1 = getNames(m1);
  const names2 = getNames(m2);

  return names1.some(n1 => names2.some(n2 => matchMinisterNameTokens(n1, n2)));
};

export const normalizeMinisterText = (str: string | null | undefined): string => {
  if (!str) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\*/g, "")
    .replace(/[&/]/g, " e ")
    .replace(/\s+/g, " ")
    .trim();
};

export const matchMinisterNameTokens = (nameA: string, nameB: string): boolean => {
  if (!nameA || !nameB) return false;
  const cleanA = nameA.trim().toLowerCase();
  const cleanB = nameB.trim().toLowerCase();
  if (cleanA === cleanB) return true;

  const tokensA = cleanA.split(/\s+/).filter(Boolean);
  const tokensB = cleanB.split(/\s+/).filter(Boolean);
  if (tokensA.length === 0 || tokensB.length === 0) return false;

  // Exact match of all tokens
  if (tokensA.join(' ') === tokensB.join(' ')) return true;

  // CRITICAL: The first token (first name) MUST match!
  // Prevents "Antonio Carlos" from matching "Carlos", or "Carlos Gomes" from matching "Antonio Carlos"!
  if (tokensA[0] !== tokensB[0]) {
    return false;
  }

  // Both have 1 token and first tokens match (e.g. "carlos" and "carlos")
  if (tokensA.length === 1 && tokensB.length === 1) {
    return true;
  }

  // Both have at least 2 tokens (e.g. "Carlos Gomes" and "Carlos Gomes")
  if (tokensA.length >= 2 && tokensB.length >= 2) {
    const lastA = tokensA[tokensA.length - 1];
    const lastB = tokensB[tokensB.length - 1];
    if (lastA === lastB) {
      return true;
    }
    const minLen = Math.min(tokensA.length, tokensB.length);
    if (tokensA.slice(0, minLen).join(' ') === tokensB.slice(0, minLen).join(' ')) {
      return true;
    }
    return false;
  }

  // One side has 1 token and the other has >= 2 tokens (e.g. "Carlos" vs "Carlos Gomes")
  if (tokensA.length === 1 || tokensB.length === 1) {
    return true;
  }

  return false;
};

export const isMinisterMatchingUser = (
  escMin: any,
  user: User | null | undefined
): boolean => {
  if (!escMin || !user) return false;

  // 0. Parish Isolation: If both specify a parish, they MUST be from the same parish!
  if (typeof escMin === 'object' && escMin !== null && escMin.paroquia && user.paroquia) {
    const p1 = normalizeMinisterText(escMin.paroquia);
    const p2 = normalizeMinisterText(user.paroquia);
    if (p1 && p2 && p1 !== p2) return false;
  }

  const cleanP = (p: any) => {
    if (!p) return '';
    const num = String(p).replace(/\D/g, '');
    return num.startsWith('55') && num.length > 11 ? num.slice(2) : num;
  };
  const userPhones = [cleanP(user.telefone), cleanP(user.telefoneConjuge)].filter(p => p.length >= 8);

  // 1. Direct ID match if escMin has an ID
  if (typeof escMin === 'object' && escMin !== null) {
    if (escMin.id !== undefined && user.id !== undefined) {
      return String(escMin.id) === String(user.id);
    }
    // 2. Direct Phone match if escMin has a phone
    const escPhones = [cleanP(escMin.telefone), cleanP(escMin.telefoneConjuge)].filter(p => p.length >= 8);
    if (escPhones.length > 0 && userPhones.length > 0) {
      return escPhones.some(ep => userPhones.includes(ep));
    }
    // If escMin has an ID or phone and it did not match the user's ID or phone, NEVER match by name!
    if ((escMin.id !== undefined && user.id !== undefined) || (escPhones.length > 0 && userPhones.length > 0)) {
      return false;
    }
  }

  const rawName = (typeof escMin === 'object' && escMin !== null) ? (escMin.nome || '') : String(escMin);
  const normEscala = normalizeMinisterText(rawName);
  if (!normEscala || normEscala === 'nao definido' || normEscala === 'lider da missa' || normEscala === 'coordenacao') return false;

  const isCoupleSchedule = normEscala.includes(' e ');
  const isUserCasal = user.tipo === 'casal' || !!user.nomeConjuge;

  // Case A: Schedule entry is a couple (e.g. "Alexandre e Fernanda" or "Carlos e Mari")
  if (isCoupleSchedule) {
    // If the logged-in user is NOT a registered couple, they CANNOT match a couple on the scale!
    if (!isUserCasal) return false;

    const parts = normEscala.split(' e ').map(p => p.trim()).filter(Boolean);
    if (parts.length < 2) return false;

    const eleNames = [user.nome, user.nomeExibicao].filter(Boolean).map(normalizeMinisterText);
    const elaNames = [user.nomeConjuge, user.nomeExibicaoConjuge].filter(Boolean).map(normalizeMinisterText);

    const matchName = (part: string, names: string[]) => {
      return names.some(n => matchMinisterNameTokens(n, part));
    };

    const part1IsEle = matchName(parts[0], eleNames);
    const part2IsEla = matchName(parts[1], elaNames);

    const part1IsEla = matchName(parts[0], elaNames);
    const part2IsEle = matchName(parts[1], eleNames);

    return (part1IsEle && part2IsEla) || (part1IsEla && part2IsEle);
  }

  // Case B: Schedule entry is an individual (no " e ")
  let candidateUserNames: string[] = [];
  if (user.isConjugeLogin) {
    candidateUserNames = [user.nomeConjuge, user.nomeExibicaoConjuge].filter(Boolean).map(normalizeMinisterText);
  } else {
    candidateUserNames = [user.nome, user.nomeExibicao].filter(Boolean).map(normalizeMinisterText);
  }

  return candidateUserNames.some(uName => matchMinisterNameTokens(normEscala, uName));
};

export interface ScheduledWhoResult {
  label: string; // e.g. "Alexandre e Fernanda", "Alexandre", "Fernanda"
  fullLabel: string; // e.g. "Casal: Alexandre e Fernanda", "Escalado: Alexandre", "Escalada: Fernanda"
  type: 'casal' | 'ele' | 'ela' | 'individual';
  isCasalScheduled: boolean;
}

export const getScheduledWhoForUser = (
  assignOrMissa: any,
  user: User | null | undefined
): ScheduledWhoResult => {
  if (!assignOrMissa || !user) {
    return {
      label: '',
      fullLabel: '',
      type: 'individual',
      isCasalScheduled: false
    };
  }

  const isUserCasal = user.tipo === 'casal' || Boolean(user.nomeConjuge);
  const eleName = (user.nomeExibicao || user.nome || '').trim();
  const elaName = (user.nomeExibicaoConjuge || user.nomeConjuge || '').trim();

  // Se não for cadastro de casal, é o próprio ministro individual
  if (!isUserCasal) {
    const singleName = eleName || user.nome || 'Você';
    return {
      label: singleName,
      fullLabel: `Escalado(a): ${singleName}`,
      type: 'individual',
      isCasalScheduled: false
    };
  }

  const eleNames = [user.nome, user.nomeExibicao].filter(Boolean).map(normalizeMinisterText);
  const elaNames = [user.nomeConjuge, user.nomeExibicaoConjuge].filter(Boolean).map(normalizeMinisterText);

  const ministros: any[] = Array.isArray(assignOrMissa.ministros)
    ? assignOrMissa.ministros
    : (assignOrMissa.matchedName ? [assignOrMissa.matchedName] : []);

  let hasCoupleSlot = false;
  let hasEleSlot = false;
  let hasElaSlot = false;

  ministros.forEach((m: any) => {
    const rawName = (typeof m === 'object' && m !== null) ? (m.nome || '') : String(m || '');
    const norm = normalizeMinisterText(rawName);
    if (!norm || norm === 'nao definido' || norm === 'lider da missa' || norm === 'coordenacao') return;

    if (norm.includes(' e ')) {
      const parts = norm.split(' e ').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const p1Ele = eleNames.some(n => matchMinisterNameTokens(n, parts[0]));
        const p2Ela = elaNames.some(n => matchMinisterNameTokens(n, parts[1]));
        const p1Ela = elaNames.some(n => matchMinisterNameTokens(n, parts[0]));
        const p2Ele = eleNames.some(n => matchMinisterNameTokens(n, parts[1]));
        if ((p1Ele && p2Ela) || (p1Ela && p2Ele)) {
          hasCoupleSlot = true;
        }
      }
    } else {
      const matchEle = eleNames.some(n => matchMinisterNameTokens(norm, n));
      const matchEla = elaNames.some(n => matchMinisterNameTokens(norm, n));
      if (matchEle) hasEleSlot = true;
      if (matchEla) hasElaSlot = true;
    }
  });

  // Também verificar matchedName se já veio gravado no agendamento
  if (assignOrMissa.matchedName) {
    const normMatched = normalizeMinisterText(assignOrMissa.matchedName);
    if (normMatched.includes(' e ')) {
      const parts = normMatched.split(' e ').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const p1Ele = eleNames.some(n => matchMinisterNameTokens(n, parts[0]));
        const p2Ela = elaNames.some(n => matchMinisterNameTokens(n, parts[1]));
        const p1Ela = elaNames.some(n => matchMinisterNameTokens(n, parts[0]));
        const p2Ele = eleNames.some(n => matchMinisterNameTokens(n, parts[1]));
        if ((p1Ele && p2Ela) || (p1Ela && p2Ele)) {
          hasCoupleSlot = true;
        }
      }
    } else {
      if (eleNames.some(n => matchMinisterNameTokens(normMatched, n))) hasEleSlot = true;
      if (elaNames.some(n => matchMinisterNameTokens(normMatched, n))) hasElaSlot = true;
    }
  }

  const casalLabel = (eleName && elaName) ? `${eleName} e ${elaName}` : (eleName || elaName || 'Casal');

  // Caso 1: Ambos escalados (seja no mesmo slot de casal ou ambos em slots separados)
  if (hasCoupleSlot || (hasEleSlot && hasElaSlot)) {
    return {
      label: casalLabel,
      fullLabel: `Casal: ${casalLabel}`,
      type: 'casal',
      isCasalScheduled: true
    };
  }

  // Caso 2: Somente ele escalado
  if (hasEleSlot && !hasElaSlot) {
    return {
      label: eleName,
      fullLabel: `Escalado: ${eleName}`,
      type: 'ele',
      isCasalScheduled: false
    };
  }

  // Caso 3: Somente ela escalada
  if (hasElaSlot && !hasEleSlot) {
    return {
      label: elaName,
      fullLabel: `Escalada: ${elaName}`,
      type: 'ela',
      isCasalScheduled: false
    };
  }

  // Caso 4: Se veio pelo login do cônjuge
  if (user.isConjugeLogin) {
    return {
      label: elaName,
      fullLabel: `Escalada: ${elaName}`,
      type: 'ela',
      isCasalScheduled: false
    };
  }

  // Caso 5: Se logado pelo nome do cônjuge
  if (user.loggedInName) {
    const normLoggedIn = normalizeMinisterText(user.loggedInName);
    if (elaNames.some(n => matchMinisterNameTokens(normLoggedIn, n))) {
      return {
        label: elaName,
        fullLabel: `Escalada: ${elaName}`,
        type: 'ela',
        isCasalScheduled: false
      };
    }
  }

  // Se for casal mas só ele está no perfil/login padrão
  if (eleName && !elaName) {
    return {
      label: eleName,
      fullLabel: `Escalado: ${eleName}`,
      type: 'ele',
      isCasalScheduled: false
    };
  }

  // Se a missa não tem ' e ' no matchedName, assume quem está logado (ele)
  if (assignOrMissa.matchedName && !normalizeMinisterText(assignOrMissa.matchedName).includes(' e ')) {
    return {
      label: eleName,
      fullLabel: `Escalado: ${eleName}`,
      type: 'ele',
      isCasalScheduled: false
    };
  }

  // Fallback padrão se for comprovadamente agendamento de casal
  return {
    label: casalLabel,
    fullLabel: `Casal: ${casalLabel}`,
    type: 'casal',
    isCasalScheduled: true
  };
};

export const isCoupleSlot = (name: string): boolean => {
  const norm = String(name || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  return norm.includes(' e ') || norm.includes(' & ') || norm.includes(' / ');
};

export const splitCoupleNames = (name: string): [string, string] => {
  const parts = name.split(/\s+e\s+|\s+&\s+|\s+\/\s+/i).map(p => p.trim()).filter(Boolean);
  return [parts[0] || name, parts[1] || 'Cônjuge'];
};

export const doesMinisterMatchLeader = (minRaw: any, lidRaw: any): boolean => {
  if (!minRaw || !lidRaw) return false;
  const minStr = typeof minRaw === "string" ? minRaw.trim() : (minRaw.nome || minRaw.name || "").trim();
  const lidStr = typeof lidRaw === "string" ? lidRaw.trim() : (lidRaw.nome || lidRaw.name || "").trim();
  if (!minStr || !lidStr) return false;

  if (minStr.toLowerCase() === lidStr.toLowerCase()) return true;
  if (isMinisterLeader(minStr, lidStr)) return true;

  const normMin = normalizeMinisterText(minStr);
  const normLid = normalizeMinisterText(lidStr);
  if (!normMin || !normLid) return false;
  if (normMin === normLid) return true;

  // Check couple tokens (e.g. "Maurício e Juliana" with "Juliana")
  if (normMin.includes(" e ") || normMin.includes(" & ") || normMin.includes(" / ")) {
    const parts = normMin.split(/\s+(?:e|&|\/)\s+/).map((p) => p.trim()).filter(Boolean);
    for (const p of parts) {
      if (p === normLid) return true;
      const tokensP = p.split(/\s+/).filter(Boolean);
      const tokensL = normLid.split(/\s+/).filter(Boolean);
      if (tokensP.length > 0 && tokensL.length > 0 && tokensP[0] === tokensL[0]) return true;
    }
  }

  return false;
};

export const isMinisterLiderForUser = (
  lider: any,
  user: User | null | undefined,
  missaMinistros?: any[]
): boolean => {
  if (!lider || !user) return false;
  const rawLeader = typeof lider === 'object' && lider !== null ? (lider.nome || '') : String(lider);
  const normLider = normalizeMinisterText(rawLeader);
  if (!normLider || normLider === 'nao definido' || normLider === 'lider da missa' || normLider === 'coordenacao') return false;

  // 1. Helper for strict token matching
  const matchStrict = (a: string, b: string): boolean => {
    if (!a || !b) return false;
    const cleanA = a.trim();
    const cleanB = b.trim();
    if (cleanA === cleanB) return true;
    const tokensA = cleanA.split(/\s+/).filter(Boolean);
    const tokensB = cleanB.split(/\s+/).filter(Boolean);
    if (tokensA.length >= 2 && tokensB.length >= 2) {
      return tokensA[0] === tokensB[0] && tokensA[tokensA.length - 1] === tokensB[tokensB.length - 1];
    }
    if (tokensA.length === 1 && tokensB.length === 1) {
      return tokensA[0] === tokensB[0];
    }

    // Couple split helper: e.g. "mauricio e juliana" with "juliana"
    if (cleanA.includes(" e ") || cleanA.includes(" & ") || cleanA.includes(" / ")) {
      const partsA = cleanA.split(/\s+(?:e|&|\/)\s+/).map((p) => p.trim()).filter(Boolean);
      if (partsA.some((p) => matchStrict(p, cleanB))) return true;
    }
    if (cleanB.includes(" e ") || cleanB.includes(" & ") || cleanB.includes(" / ")) {
      const partsB = cleanB.split(/\s+(?:e|&|\/)\s+/).map((p) => p.trim()).filter(Boolean);
      if (partsB.some((p) => matchStrict(cleanA, p))) return true;
    }

    return false;
  };

  // 2. Determine target names for user
  const isLoggedAsConjuge = Boolean(user.tipo === 'casal' && user.isConjugeLogin);
  const targetNames = isLoggedAsConjuge
    ? [user.nomeConjuge, user.nomeExibicaoConjuge, user.nome, user.nomeExibicao].filter(Boolean).map(normalizeMinisterText)
    : [user.nome, user.nomeExibicao, user.nomeConjuge, user.nomeExibicaoConjuge].filter(Boolean).map(normalizeMinisterText);

  // Check direct name match with the designated celebration leader
  const directNameMatches = targetNames.some(name => matchStrict(normLider, name));

  // 3. Check role authorization: user flags, casal flags, cached records, coordination roles
  const userHasLeaderRole = isLoggedAsConjuge
    ? Boolean(user.isLiderConjuge || user.isLider || user.role === 'coordenacao' || user.role === 'vice_coordenacao' || user.role === 'admin' || (user as any).isActualCoord || (user as any).isCoordenador)
    : Boolean(user.isLider || user.isLiderConjuge || user.role === 'coordenacao' || user.role === 'vice_coordenacao' || user.role === 'admin' || (user as any).isActualCoord || (user as any).isCoordenador);

  let hasLeaderInCache = false;
  if (cachedMinistrosList && Array.isArray(cachedMinistrosList) && cachedMinistrosList.length > 0) {
    const minObj = cachedMinistrosList.find((m: any) => {
      if (user.id && m.id && String(m.id) === String(user.id)) return true;
      if (user.telefone && m.telefone && String(m.telefone) === String(user.telefone)) return true;
      const allNames = [m.nome, m.nomeExibicao, m.nomeConjuge, m.nomeExibicaoConjuge].filter(Boolean).map(normalizeMinisterText);
      return allNames.some(an => targetNames.some(tn => matchStrict(an, tn)));
    });
    if (minObj) {
      if (isLoggedAsConjuge) {
        hasLeaderInCache = Boolean(minObj.isLiderConjuge || minObj.isLider || minObj.role === 'coordenacao' || minObj.role === 'vice_coordenacao' || minObj.role === 'admin');
      } else {
        hasLeaderInCache = Boolean(minObj.isLider || minObj.isLiderConjuge || minObj.role === 'coordenacao' || minObj.role === 'vice_coordenacao' || minObj.role === 'admin');
      }
    }
  }

  // If the user's name matches the designated leader, or if they have leader role and match
  if (!userHasLeaderRole && !hasLeaderInCache && !directNameMatches) {
    return false;
  }

  // 4. If this celebration has a list of scheduled ministers, verify presence
  if (missaMinistros && Array.isArray(missaMinistros) && missaMinistros.length > 0) {
    const isScheduledInMass = missaMinistros.some(m => {
      if (isMinisterMatchingUser(m, user)) return true;
      const mNorm = normalizeMinisterText(typeof m === 'object' && m !== null ? m.nome : String(m));
      return targetNames.some(tn => matchStrict(mNorm, tn)) || matchStrict(mNorm, normLider);
    });
    if (!isScheduledInMass && !directNameMatches) {
      return false;
    }
  }

  return directNameMatches;
};

let cachedMinistrosList: any[] = [];

export const setCachedMinistros = (list: any[]) => {
  if (Array.isArray(list)) {
    cachedMinistrosList = list;
  }
};

export const getCachedMinistros = (): any[] => {
  return cachedMinistrosList;
};

export const fetchAndCacheMinistros = async (paroquia?: string): Promise<any[]> => {
  try {
    const url = paroquia 
      ? `/api/ministros?paroquia=${encodeURIComponent(paroquia)}`
      : `/api/ministros`;
    const res = await apiFetch(url);
    const data = await safeJson<any[]>(res, null);
    if (Array.isArray(data)) {
      cachedMinistrosList = data;
      return data;
    }
  } catch (e) {
    console.warn('Aviso ao buscar ministros para cache:', e);
  }
  return cachedMinistrosList;
};

export const isMinisterLeader = (
  minister: any,
  missaLider?: any,
  allMinistrosList?: any[]
): boolean => {
  if (!minister || !missaLider) return false;
  const rawMinisterName = typeof minister === 'object' && minister !== null ? (minister.nome || '') : String(minister);
  const normMin = normalizeMinisterText(rawMinisterName);
  if (!normMin || normMin === 'nao definido' || normMin === 'lider da missa' || normMin === 'coordenacao') return false;

  const rawLiderName = typeof missaLider === 'object' && missaLider !== null ? (missaLider.nome || '') : String(missaLider);
  const normLider = normalizeMinisterText(rawLiderName);
  if (!normLider || normLider === 'nao definido' || normLider === 'lider da missa' || normLider === 'coordenacao') return false;

  // 1. Direct ID match if minister and leader are objects with ID
  if (typeof minister === 'object' && minister !== null && typeof missaLider === 'object' && missaLider !== null) {
    if (minister.id !== undefined && missaLider.id !== undefined && String(minister.id) === String(missaLider.id)) {
      return true;
    }
  }

  // Helper: exact match or precise 2-word first+last token match (avoid 1-token prefix collision like Ana Neri vs Ana Cláudia)
  const matchStrict = (a: string, b: string): boolean => {
    if (!a || !b) return false;
    const cleanA = a.trim();
    const cleanB = b.trim();
    if (cleanA === cleanB) return true;
    const tokensA = cleanA.split(/\s+/).filter(Boolean);
    const tokensB = cleanB.split(/\s+/).filter(Boolean);
    if (tokensA.length >= 2 && tokensB.length >= 2) {
      return tokensA[0] === tokensB[0] && tokensA[tokensA.length - 1] === tokensB[tokensB.length - 1];
    }
    if (tokensA.length === 1 && tokensB.length === 1) {
      return tokensA[0] === tokensB[0];
    }
    return false;
  };

  // 2. Direct string match
  if (matchStrict(normMin, normLider)) {
    return true;
  }

  // 3. Search in minister registration list for precise spouse / display name matches
  const listToSearch = (allMinistrosList && Array.isArray(allMinistrosList) && allMinistrosList.length > 0)
    ? allMinistrosList
    : cachedMinistrosList;

  if (listToSearch && Array.isArray(listToSearch) && listToSearch.length > 0) {
    // Find registered minister object corresponding to this scheduled minister entry
    let matchedMinisterObj: any = null;

    if (typeof minister === 'object' && minister !== null && minister.id !== undefined) {
      matchedMinisterObj = listToSearch.find(m => String(m.id) === String(minister.id));
    }

    if (!matchedMinisterObj) {
      const minParts = normMin.split(' e ').map(p => p.trim()).filter(Boolean);
      if (minParts.length > 1) {
        matchedMinisterObj = listToSearch.find(m => {
          const eleNames = [m.nome, m.nomeExibicao].filter(Boolean).map(normalizeMinisterText);
          const elaNames = [m.nomeConjuge, m.nomeExibicaoConjuge].filter(Boolean).map(normalizeMinisterText);
          const p0Ele = eleNames.some(n => matchStrict(minParts[0], n));
          const p1Ela = elaNames.some(n => matchStrict(minParts[1], n));
          const p0Ela = elaNames.some(n => matchStrict(minParts[0], n));
          const p1Ele = eleNames.some(n => matchStrict(minParts[1], n));
          return (p0Ele && p1Ela) || (p0Ela && p1Ele);
        });
      } else {
        matchedMinisterObj = listToSearch.find(m => {
          const allNames = [m.nome, m.nomeExibicao, m.nomeConjuge, m.nomeExibicaoConjuge].filter(Boolean).map(normalizeMinisterText);
          return allNames.some(n => matchStrict(normMin, n));
        });
      }
    }

    if (matchedMinisterObj) {
      const eleNames = [matchedMinisterObj.nome, matchedMinisterObj.nomeExibicao].filter(Boolean).map(normalizeMinisterText);
      const elaNames = [matchedMinisterObj.nomeConjuge, matchedMinisterObj.nomeExibicaoConjuge].filter(Boolean).map(normalizeMinisterText);

      // If leader is the husband or wife
      if (eleNames.some(n => matchStrict(normLider, n)) || elaNames.some(n => matchStrict(normLider, n))) {
        return true;
      }

      // Also check if missaLider is an object with ID matching matchedMinisterObj
      if (typeof missaLider === 'object' && missaLider !== null && missaLider.id !== undefined) {
        if (String(matchedMinisterObj.id) === String(missaLider.id)) {
          return true;
        }
      }

      return false;
    }
  }

  // 4. Fallback if not found in DB list: if scheduled entry is a couple string "A e B" and normLider matches A or B strictly
  if (normMin.includes(' e ')) {
    const parts = normMin.split(' e ').map(p => p.trim()).filter(Boolean);
    for (const p of parts) {
      if (matchStrict(p, normLider)) return true;
    }
  }

  return false;
};

export const formatMinisterWithLeader = (
  minister: any,
  missaLider?: any,
  allMinistrosList?: any[]
): string => {
  const rawMinisterName = typeof minister === 'object' && minister !== null ? (minister.nome || '') : String(minister || '');
  if (!rawMinisterName) return '';
  if (!missaLider) return rawMinisterName;

  const rawLiderName = typeof missaLider === 'object' && missaLider !== null ? (missaLider.nome || '') : String(missaLider);
  const normLider = normalizeMinisterText(rawLiderName);
  if (!normLider || normLider === 'nao definido' || normLider === 'lider da missa' || normLider === 'coordenacao') {
    return rawMinisterName;
  }

  const matchStrict = (a: string, b: string): boolean => {
    if (!a || !b) return false;
    const cleanA = a.trim();
    const cleanB = b.trim();
    if (cleanA === cleanB) return true;
    const tokensA = cleanA.split(/\s+/).filter(Boolean);
    const tokensB = cleanB.split(/\s+/).filter(Boolean);
    if (tokensA.length >= 2 && tokensB.length >= 2) {
      return tokensA[0] === tokensB[0] && tokensA[tokensA.length - 1] === tokensB[tokensB.length - 1];
    }
    if (tokensA.length === 1 && tokensB.length === 1) {
      return tokensA[0] === tokensB[0];
    }
    return false;
  };

  const listToSearch = (allMinistrosList && Array.isArray(allMinistrosList) && allMinistrosList.length > 0)
    ? allMinistrosList
    : cachedMinistrosList;

  // Check if it is a couple (contains ' e ')
  const coupleParts = rawMinisterName.split(/\s+e\s+/);
  if (coupleParts.length === 2) {
    const part0 = coupleParts[0].trim().replace(/^\*\s*/, '');
    const part1 = coupleParts[1].trim().replace(/^\*\s*/, '');
    const norm0 = normalizeMinisterText(part0);
    const norm1 = normalizeMinisterText(part1);

    let part0IsLeader = false;
    let part1IsLeader = false;

    if (listToSearch && listToSearch.length > 0) {
      let matchedObj: any = null;
      if (typeof minister === 'object' && minister !== null && minister.id !== undefined) {
        matchedObj = listToSearch.find(m => String(m.id) === String(minister.id));
      }
      if (!matchedObj) {
        matchedObj = listToSearch.find(m => {
          const eleNames = [m.nome, m.nomeExibicao].filter(Boolean).map(normalizeMinisterText);
          const elaNames = [m.nomeConjuge, m.nomeExibicaoConjuge].filter(Boolean).map(normalizeMinisterText);
          const p0Ele = eleNames.some(n => matchStrict(norm0, n));
          const p1Ela = elaNames.some(n => matchStrict(norm1, n));
          const p0Ela = elaNames.some(n => matchStrict(norm0, n));
          const p1Ele = eleNames.some(n => matchStrict(norm1, n));
          return (p0Ele && p1Ela) || (p0Ela && p1Ele);
        });
      }

      if (matchedObj) {
        const eleNames = [matchedObj.nome, matchedObj.nomeExibicao].filter(Boolean).map(normalizeMinisterText);
        const elaNames = [matchedObj.nomeConjuge, matchedObj.nomeExibicaoConjuge].filter(Boolean).map(normalizeMinisterText);
        const p0IsEle = eleNames.some(n => matchStrict(norm0, n));
        const isEleLider = Boolean(matchedObj.isLider || matchedObj.role === 'coordenacao' || matchedObj.role === 'vice_coordenacao' || matchedObj.role === 'admin');
        const isElaLider = Boolean(matchedObj.isLiderConjuge || matchedObj.role === 'coordenacao' || matchedObj.role === 'vice_coordenacao' || matchedObj.role === 'admin');

        // If missaLider matches husband in DB
        if (eleNames.some(n => matchStrict(normLider, n))) {
          if (isEleLider) {
            if (p0IsEle) part0IsLeader = true;
            else part1IsLeader = true;
          }
        }
        // If missaLider matches wife in DB
        else if (elaNames.some(n => matchStrict(normLider, n))) {
          if (isElaLider) {
            if (p0IsEle) part1IsLeader = true;
            else part0IsLeader = true;
          }
        }
        // If missaLider is the couple itself or leader object has same ID
        else if (
          matchStrict(normLider, normalizeMinisterText(rawMinisterName)) ||
          (typeof missaLider === 'object' && missaLider !== null && String(missaLider.id) === String(matchedObj.id))
        ) {
          if (p0IsEle) {
            part0IsLeader = isEleLider;
            part1IsLeader = isElaLider;
          } else {
            part0IsLeader = isElaLider;
            part1IsLeader = isEleLider;
          }
        }
      }
    } else {
      if (matchStrict(norm0, normLider)) {
        part0IsLeader = true;
      }
      if (matchStrict(norm1, normLider)) {
        part1IsLeader = true;
      }
    }

    if (part1IsLeader && !part0IsLeader) {
      // Put the leader first: e.g. "* Priscila e Alexandre"
      return `* ${part1} e ${part0}`;
    }
    if (part0IsLeader && !part1IsLeader) {
      // Leader is already first: e.g. "* Alexandre e Priscila"
      return `* ${part0} e ${part1}`;
    }
    if (part0IsLeader && part1IsLeader) {
      return `* ${part0} e * ${part1}`;
    }
    return `${part0} e ${part1}`;
  }

  // Single minister
  const isLeader = isMinisterLeader(minister, missaLider, listToSearch);
  const cleanSingleName = rawMinisterName.replace(/^\*\s*/, '');
  return isLeader ? `* ${cleanSingleName}` : cleanSingleName;
};

export const renderMinisterWithStar = (
  minister: any,
  missaLider?: any,
  allMinistrosList?: any[],
  options?: { isSmall?: boolean; className?: string; lowercase?: boolean }
): React.ReactNode => {
  let formatted = '';
  if (typeof minister === 'string') {
    if (missaLider !== undefined) {
      formatted = formatMinisterWithLeader(minister, missaLider, allMinistrosList);
    } else {
      formatted = minister;
    }
  } else if (minister) {
    formatted = formatMinisterWithLeader(minister, missaLider, allMinistrosList);
  }

  if (!formatted) return null;

  if (!formatted.includes('*')) {
    const titleName = toTitleCase(formatted);
    return <span className={options?.className || ''}>{titleName}</span>;
  }

  const starSize = options?.isSmall ? 'w-2.5 h-2.5' : 'w-3 h-3';

  // Split by asterisk and render yellow star icon
  const parts = formatted.split('*');
  return (
    <span className={`inline-flex items-center gap-1 flex-wrap ${options?.className || ''}`}>
      {parts.map((part, pIdx) => {
        const trimmed = part.trim();
        if (pIdx === 0 && !trimmed) return null;
        const titleName = toTitleCase(trimmed);
        return (
          <React.Fragment key={pIdx}>
            {pIdx > 0 && (
              <Star
                className={`${starSize} fill-amber-400 text-amber-500 inline-block shrink-0 -mt-0.5`}
                aria-label="Líder da Celebração"
              />
            )}
            {titleName ? <span>{titleName}</span> : null}
          </React.Fragment>
        );
      })}
    </span>
  );
};

export const isWithinActiveWindow = (dateStr: string, isSubmitted: boolean = false): boolean => {
  if (!dateStr) return false;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const assignDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  assignDate.setHours(0, 0, 0, 0);

  const diffDays = Math.round((assignDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  // REGRA DO USUÁRIO: Não apagar enquanto o líder/responsável não enviar o relatório!
  // Se ainda não foi enviado e a celebração é nos próximos 2 dias ou já aconteceu (passado), NUNCA apaga.
  if (!isSubmitted && diffDays <= 2) {
    return true;
  }
  // Se já foi enviado, permanece visível por 2 dias após a celebração
  return diffDays >= -2 && diffDays <= 2;
};

export const ITENS_ESTOQUE_RELATORIO = [
  'Hóstia grande',
  'Hóstia média',
  'Hóstia comum',
  'Garrafa de vinho'
];

export const parseUsoEstoque = (texto: string): { selected: string[]; outro: string } => {
  if (!texto || typeof texto !== 'string') {
    return { selected: [], outro: '' };
  }
  const lower = texto.toLowerCase();
  const selected: string[] = [];

  ITENS_ESTOQUE_RELATORIO.forEach((item) => {
    const itemLower = item.toLowerCase();
    if (itemLower.includes('grande') && lower.includes('grande')) {
      selected.push(item);
    } else if (itemLower.includes('média') && (lower.includes('média') || lower.includes('media'))) {
      selected.push(item);
    } else if (itemLower.includes('comum') && lower.includes('comum')) {
      selected.push(item);
    } else if (itemLower.includes('vinho') && lower.includes('vinho')) {
      selected.push(item);
    }
  });

  const parts = texto.split(/[,;\n]+/).map(p => p.trim()).filter(Boolean);
  const outroParts = parts.filter(p => {
    const pLow = p.toLowerCase();
    const isGrande = pLow.includes('grande');
    const isMedia = pLow.includes('média') || pLow.includes('media');
    const isComum = pLow.includes('comum');
    const isVinho = pLow.includes('vinho');
    return !isGrande && !isMedia && !isComum && !isVinho;
  });

  return {
    selected,
    outro: outroParts.join(', ')
  };
};

export const formatUsoEstoque = (selected: string[], outro: string): string => {
  const parts = [...selected];
  if (outro && outro.trim()) {
    parts.push(outro.trim());
  }
  return parts.join(', ');
};



