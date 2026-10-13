import { SANTOS_DATA, SantoItem } from '../components/SantosView';
import { getBrazilDate } from './disponibilidade';

export interface SantoDoDiaInfo {
  isDiaDeSanto: boolean;
  santoDoDia: SantoItem | null;
  todosSantosDoDia: SantoItem[];
}

const mesesMap: Record<string, number> = {
  janeiro: 1,
  fevereiro: 2,
  marco: 3,
  março: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
};

/**
 * Normaliza e verifica se um determinado Santo celebra sua festa no dia de referência (fuso horário do Brasil).
 */
export function isFestaSantoHoje(santo: SantoItem, referencia: Date = new Date()): boolean {
  if (!santo?.dataFesta) return false;
  const brDate = getBrazilDate(referencia);
  const diaAtual = brDate.getDate();
  const mesAtual = brDate.getMonth() + 1;

  const str = santo.dataFesta.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const match = str.match(/(\d{1,2})\s+de\s+([a-z]+)/);
  if (!match) return false;

  const diaFesta = parseInt(match[1], 10);
  const nomeMes = match[2];
  const mesFesta = mesesMap[nomeMes];

  return diaFesta === diaAtual && mesFesta === mesAtual;
}

/**
 * Normaliza string de data de festa (ex: "12 de Outubro", "03 de Outubro (Santos Mártires...)")
 * e compara com a data atual (dia e mês no Brasil).
 */
export function getSantoDoDia(referencia: Date = new Date()): SantoDoDiaInfo {
  const santosDeHoje = SANTOS_DATA.filter((santo) => isFestaSantoHoje(santo, referencia));

  return {
    isDiaDeSanto: santosDeHoje.length > 0,
    santoDoDia: santosDeHoje[0] || null,
    todosSantosDoDia: santosDeHoje,
  };
}
