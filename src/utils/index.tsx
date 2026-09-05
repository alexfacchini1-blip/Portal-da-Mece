import React from 'react';
import { Star } from 'lucide-react';
import { User } from '../types';

export const safeJson = async <T = any>(res: Response, fallback: T = null as any): Promise<T> => {
  if (!res || !res.ok) return fallback;
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return fallback;
  }
  try {
    return await res.json();
  } catch (e) {
    return fallback;
  }
};

export const safeFetchJson = async <T = any>(url: string, options?: RequestInit, fallback: T = null as any): Promise<T> => {
  try {
    const res = await fetch(url, options);
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
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
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

export const areMinistersOverlapping = (m1: any, m2: any): boolean => {
  if (!m1 || !m2) return false;

  // Same ID
  if (m1.id !== undefined && m2.id !== undefined && String(m1.id) === String(m2.id)) {
    return true;
  }

  // Same phone number
  const phone1 = m1.telefone ? String(m1.telefone).replace(/\D/g, '') : '';
  const phone2 = m2.telefone ? String(m2.telefone).replace(/\D/g, '') : '';
  if (phone1 && phone2 && phone1.length >= 8 && phone1 === phone2) {
    return true;
  }

  // Extract name tokens
  const getTokens = (m: any): string[] => {
    const rawList = [
      m.nome,
      m.nomeExibicao,
      m.nomeConjuge,
      m.nomeExibicaoConjuge,
      m.solicitanteNome,
      m.destinatarioNome,
      m.segundoDestinatarioNome
    ].filter(Boolean);

    const tokens = new Set<string>();
    for (const str of rawList) {
      const norm = String(str)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const parts = norm.split(/[\s&,/]+/);
      for (const p of parts) {
        const cleaned = p.replace(/[^a-z0-9]/g, "");
        if (cleaned.length >= 3 && !["dos", "das", "com", "sem", "paroquia"].includes(cleaned)) {
          tokens.add(cleaned);
        }
      }
    }
    return Array.from(tokens);
  };

  const tokens1 = getTokens(m1);
  const tokens2 = getTokens(m2);

  return tokens1.some((t1) => tokens2.includes(t1));
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

export const isMinisterMatchingUser = (
  escMin: any,
  user: User | null | undefined
): boolean => {
  if (!escMin || !user) return false;

  // 1. Direct ID match if escMin has an ID
  if (typeof escMin === 'object' && escMin !== null) {
    if (escMin.id !== undefined && user.id !== undefined && String(escMin.id) === String(user.id)) {
      return true;
    }
  }

  const rawName = (typeof escMin === 'object' && escMin !== null) ? (escMin.nome || '') : String(escMin);
  const normEscala = normalizeMinisterText(rawName);
  if (!normEscala || normEscala === 'nao definido' || normEscala === 'lider da missa' || normEscala === 'coordenacao') return false;

  const isCoupleSchedule = normEscala.includes(' e ');
  const isUserCasal = user.tipo === 'casal' || !!user.nomeConjuge;

  const matchSingle = (nameA: string, nameB: string): boolean => {
    if (!nameA || !nameB) return false;
    const cleanA = nameA.trim();
    const cleanB = nameB.trim();
    if (cleanA === cleanB) return true;

    const tokensA = cleanA.split(/\s+/).filter(Boolean);
    const tokensB = cleanB.split(/\s+/).filter(Boolean);

    // Both have at least 2 tokens (e.g. "Alexandre Facchini" and "Alexandre Borelli Facchini")
    if (tokensA.length >= 2 && tokensB.length >= 2) {
      const firstMatch = tokensA[0] === tokensB[0];
      const lastMatch = tokensA[tokensA.length - 1] === tokensB[tokensB.length - 1];
      if (firstMatch && lastMatch) {
        return true;
      }
    }

    // Both are 1 token exact match
    if (tokensA.length === 1 && tokensB.length === 1) {
      return tokensA[0] === tokensB[0];
    }

    return false;
  };

  // Case A: Schedule entry is a couple (e.g. "Alexandre e Fernanda" or "Carlos e Ana")
  if (isCoupleSchedule) {
    // If the logged-in user is NOT a registered couple, they CANNOT match a couple on the scale!
    if (!isUserCasal) return false;

    const parts = normEscala.split(' e ').map(p => p.trim()).filter(Boolean);
    if (parts.length < 2) return false;

    const eleNames = [user.nome, user.nomeExibicao].filter(Boolean).map(normalizeMinisterText);
    const elaNames = [user.nomeConjuge, user.nomeExibicaoConjuge].filter(Boolean).map(normalizeMinisterText);

    const matchName = (part: string, names: string[]) => {
      return names.some(n => matchSingle(n, part));
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
  } else if (isUserCasal && !user.isConjugeLogin) {
    candidateUserNames = [user.nome, user.nomeExibicao, user.nomeConjuge, user.nomeExibicaoConjuge].filter(Boolean).map(normalizeMinisterText);
  } else {
    candidateUserNames = [user.nome, user.nomeExibicao].filter(Boolean).map(normalizeMinisterText);
  }

  return candidateUserNames.some(uName => matchSingle(normEscala, uName));
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

  // 1. User MUST have leader permission or coordination role
  const isLoggedAsConjuge = Boolean(user.tipo === 'casal' && user.isConjugeLogin);
  const userHasLeaderRole = isLoggedAsConjuge
    ? Boolean(user.isLiderConjuge || user.role === 'coordenacao' || user.role === 'vice_coordenacao' || user.role === 'admin')
    : Boolean(user.isLider || user.role === 'coordenacao' || user.role === 'vice_coordenacao' || user.role === 'admin');

  if (!userHasLeaderRole) {
    return false;
  }

  // 2. If this Mass has a list of scheduled ministers, the user MUST be scheduled in this Mass!
  if (missaMinistros && Array.isArray(missaMinistros) && missaMinistros.length > 0) {
    const isScheduledInMass = missaMinistros.some(m => isMinisterMatchingUser(m, user));
    if (!isScheduledInMass) {
      return false;
    }
  }

  // 3. Direct ID match if leader is an object with ID
  if (typeof lider === 'object' && lider !== null && lider.id !== undefined && user.id !== undefined) {
    return String(lider.id) === String(user.id);
  }

  // 4. Helper for strict token matching
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

  // 5. Match against specific logged-in user name
  let targetNames: string[] = [];
  if (isLoggedAsConjuge) {
    targetNames = [user.nomeConjuge, user.nomeExibicaoConjuge].filter(Boolean).map(normalizeMinisterText);
  } else if (user.tipo === 'casal') {
    const candidateNames: string[] = [];
    if (user.isLider || user.role === 'coordenacao' || user.role === 'vice_coordenacao' || user.role === 'admin') {
      candidateNames.push(...[user.nome, user.nomeExibicao].filter(Boolean) as string[]);
    }
    if (user.isLiderConjuge || user.role === 'coordenacao' || user.role === 'vice_coordenacao' || user.role === 'admin') {
      candidateNames.push(...[user.nomeConjuge, user.nomeExibicaoConjuge].filter(Boolean) as string[]);
    }
    if (candidateNames.length === 0) {
      candidateNames.push(...[user.nome, user.nomeExibicao, user.nomeConjuge, user.nomeExibicaoConjuge].filter(Boolean) as string[]);
    }
    targetNames = candidateNames.map(normalizeMinisterText);
  } else {
    targetNames = [user.nome, user.nomeExibicao].filter(Boolean).map(normalizeMinisterText);
  }

  return targetNames.some(name => matchStrict(normLider, name));
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
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        cachedMinistrosList = data;
        return data;
      }
    }
  } catch (e) {
    console.error('Erro ao buscar ministros para cache:', e);
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
    // If we have a list of ministers, check if this minister is actually a leader
    const listToSearch = (allMinistrosList && Array.isArray(allMinistrosList) && allMinistrosList.length > 0)
      ? allMinistrosList
      : cachedMinistrosList;

    if (listToSearch && listToSearch.length > 0) {
      const obj = listToSearch.find(m => {
        const allNames = [m.nome, m.nomeExibicao, m.nomeConjuge, m.nomeExibicaoConjuge].filter(Boolean).map(normalizeMinisterText);
        return allNames.some(n => matchStrict(normMin, n));
      });
      if (obj) {
        const isEle = [obj.nome, obj.nomeExibicao].filter(Boolean).map(normalizeMinisterText).some(n => matchStrict(normMin, n));
        const isEla = [obj.nomeConjuge, obj.nomeExibicaoConjuge].filter(Boolean).map(normalizeMinisterText).some(n => matchStrict(normMin, n));
        if (isEle && (obj.isLider || obj.role === 'coordenacao' || obj.role === 'vice_coordenacao' || obj.role === 'admin')) return true;
        if (isEla && (obj.isLiderConjuge || obj.role === 'coordenacao' || obj.role === 'vice_coordenacao' || obj.role === 'admin')) return true;
        return false;
      }
    }
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

      const isEleLider = Boolean(matchedMinisterObj.isLider || matchedMinisterObj.role === 'coordenacao' || matchedMinisterObj.role === 'vice_coordenacao' || matchedMinisterObj.role === 'admin');
      const isElaLider = Boolean(matchedMinisterObj.isLiderConjuge || matchedMinisterObj.role === 'coordenacao' || matchedMinisterObj.role === 'vice_coordenacao' || matchedMinisterObj.role === 'admin');

      // If leader is the husband
      if (eleNames.some(n => matchStrict(normLider, n))) {
        return isEleLider;
      }
      // If leader is the wife
      if (elaNames.some(n => matchStrict(normLider, n))) {
        return isElaLider;
      }

      // Also check if missaLider is an object with ID matching matchedMinisterObj
      if (typeof missaLider === 'object' && missaLider !== null && missaLider.id !== undefined) {
        if (String(matchedMinisterObj.id) === String(missaLider.id)) {
          return isEleLider || isElaLider;
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

  if (options?.lowercase) {
    formatted = formatted.toLowerCase();
  }

  if (!formatted.includes('*')) {
    return <span>{formatted}</span>;
  }

  const starSize = options?.isSmall ? 'w-2.5 h-2.5' : 'w-3 h-3';

  // Split by asterisk and render yellow star icon
  const parts = formatted.split('*');
  return (
    <span className={`inline-flex items-center gap-1 flex-wrap ${options?.className || ''}`}>
      {parts.map((part, pIdx) => {
        const trimmed = part.trim();
        if (pIdx === 0 && !trimmed) return null;
        return (
          <React.Fragment key={pIdx}>
            {pIdx > 0 && (
              <Star
                className={`${starSize} fill-amber-400 text-amber-500 inline-block shrink-0 -mt-0.5`}
                aria-label="Líder da Celebração"
              />
            )}
            {trimmed ? <span>{trimmed}</span> : null}
          </React.Fragment>
        );
      })}
    </span>
  );
};



