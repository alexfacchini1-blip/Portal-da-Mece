export const getEasterDate = (year: number) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
};

export const getCalendarioLiturgico = (year: number) => {
  const easter = getEasterDate(year);
  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  const getDayName = (date: Date) => date.toLocaleDateString('pt-BR', { weekday: 'long' });

  const fixedFeasts = [
    { data: `${year}-01-01`, nome: 'Santa Maria, Mãe de Deus' },
    { data: `${year}-01-20`, nome: 'São Sebastião' },
    { data: `${year}-02-02`, nome: 'Apresentação do Senhor' },
    { data: `${year}-03-19`, nome: 'São José' },
    { data: `${year}-03-25`, nome: 'Anunciação do Senhor' },
    { data: `${year}-04-23`, nome: 'São Jorge' },
    { data: `${year}-05-01`, nome: 'São José Operário' },
    { data: `${year}-05-03`, nome: 'Santos Filipe e Tiago' },
    { data: `${year}-05-13`, nome: 'Nossa Senhora de Fátima' },
    { data: `${year}-05-14`, nome: 'São Matias' },
    { data: `${year}-05-22`, nome: 'Santa Rita de Cássia' },
    { data: `${year}-05-31`, nome: 'Visitação de Nossa Senhora' },
    { data: `${year}-06-11`, nome: 'São Barnabé' },
    { data: `${year}-06-13`, nome: 'Santo Antônio' },
    { data: `${year}-06-24`, nome: 'São João Batista' },
    { data: `${year}-06-29`, nome: 'São Pedro e São Paulo' },
    { data: `${year}-07-16`, nome: 'Nossa Senhora do Carmo' },
    { data: `${year}-07-25`, nome: 'São Tiago' },
    { data: `${year}-07-26`, nome: "Sant'Ana e São Joaquim" },
    { data: `${year}-08-08`, nome: 'São Domingos' },
    { data: `${year}-08-10`, nome: 'São Lourenço' },
    { data: `${year}-08-11`, nome: 'Santa Clara' },
    { data: `${year}-08-15`, nome: 'Assunção de Nossa Senhora' },
    { data: `${year}-08-24`, nome: 'São Bartolomeu' },
    { data: `${year}-09-08`, nome: 'Natividade de Nossa Senhora' },
    { data: `${year}-09-21`, nome: 'São Mateus' },
    { data: `${year}-09-27`, nome: 'São Vicente de Paulo' },
    { data: `${year}-09-29`, nome: 'São Miguel, São Gabriel e São Rafael' },
    { data: `${year}-09-30`, nome: 'São Jerônimo' },
    { data: `${year}-10-04`, nome: 'São Francisco de Assis' },
    { data: `${year}-10-12`, nome: 'Nossa Senhora Aparecida' },
    { data: `${year}-10-18`, nome: 'São Lucas' },
    { data: `${year}-10-28`, nome: 'São Simão e São Judas' },
    { data: `${year}-11-01`, nome: 'Todos os Santos' },
    { data: `${year}-11-02`, nome: 'Finados' },
    { data: `${year}-11-09`, nome: 'Dedicação da Basílica de Latrão' },
    { data: `${year}-11-17`, nome: 'Santa Isabel da Hungria' },
    { data: `${year}-11-22`, nome: 'Santa Cecília' },
    { data: `${year}-12-08`, nome: 'Imaculada Conceição' },
    { data: `${year}-12-13`, nome: 'Santa Luzia' },
    { data: `${year}-12-25`, nome: 'Natal do Senhor' },
    { data: `${year}-12-27`, nome: 'São João Evangelista' },
  ];

  const movableFeasts = [
    { data: formatDate(addDays(easter, -46)), nome: 'Quarta-feira de Cinzas' },
    { data: formatDate(addDays(easter, -7)), nome: 'Domingo de Ramos' },
    { data: formatDate(addDays(easter, -3)), nome: 'Quinta-feira Santa' },
    { data: formatDate(addDays(easter, -2)), nome: 'Sexta-feira Santa' },
    { data: formatDate(addDays(easter, -1)), nome: 'Sábado de Aleluia' },
    { data: formatDate(easter), nome: 'Domingo de Páscoa' },
    { data: formatDate(addDays(easter, 39)), nome: 'Ascensão do Senhor' },
    { data: formatDate(addDays(easter, 49)), nome: 'Pentecostes' },
    { data: formatDate(addDays(easter, 56)), nome: 'Santíssima Trindade' },
    { data: formatDate(addDays(easter, 60)), nome: 'Corpus Christi' },
  ];

  const allFeasts = [...fixedFeasts, ...movableFeasts];
  return allFeasts.map(feast => ({
    ...feast,
    dia: getDayName(new Date(feast.data + 'T00:00:00'))
  }));
};

export const getLiturgicalThemeDynamic = (dateString: string) => {
  const date = new Date(dateString + 'T12:00:00');
  const year = date.getFullYear();
  const easter = getEasterDate(year);
  
  const addDays = (d: Date, days: number) => {
    const res = new Date(d);
    res.setDate(res.getDate() + days);
    return res;
  };

  const ashWednesday = addDays(easter, -46);
  const palmSunday = addDays(easter, -7);
  const holyThursday = addDays(easter, -3);
  const goodFriday = addDays(easter, -2);
  const holySaturday = addDays(easter, -1);
  const pentecost = addDays(easter, 49);
  const trinitySunday = addDays(easter, 56);
  const corpusChristi = addDays(easter, 60);
  
  // Advento starts on the 4th Sunday before Christmas
  const christmas = new Date(year, 11, 25);
  const christmasDayOfWeek = christmas.getDay();
  const adventStart = addDays(christmas, -(christmasDayOfWeek + 21));
  
  // Baptism of the Lord is usually the Sunday after Jan 6
  const epiphany = new Date(year, 0, 6);
  const epiphanyDayOfWeek = epiphany.getDay();
  const baptismOfLord = addDays(epiphany, epiphanyDayOfWeek === 0 ? 7 : (7 - epiphanyDayOfWeek));

  const dStr = date.toISOString().split('T')[0];
  const palmStr = palmSunday.toISOString().split('T')[0];
  const friStr = goodFriday.toISOString().split('T')[0];
  const pentStr = pentecost.toISOString().split('T')[0];
  const thurStr = holyThursday.toISOString().split('T')[0];
  const satStr = holySaturday.toISOString().split('T')[0];
  const easterStr = easter.toISOString().split('T')[0];
  const trinityStr = trinitySunday.toISOString().split('T')[0];
  const corpusStr = corpusChristi.toISOString().split('T')[0];

  // Specific Days (Red)
  if (dStr === palmStr || dStr === friStr || dStr === pentStr) return 'red';
  
  // Specific Days (White/Gold)
  if (dStr === thurStr || dStr === satStr || dStr === easterStr || dStr === trinityStr || dStr === corpusStr) return 'white';

  // Seasons
  if (date >= ashWednesday && date < easter) return 'purple'; // Quaresma
  if (date >= easter && date <= pentecost) return 'white'; // Páscoa
  if (date >= adventStart && date < christmas) return 'purple'; // Advento
  if (date >= christmas || date <= baptismOfLord) return 'white'; // Natal

  return 'green'; // Tempo Comum
};

const formatDate = (date: Date) => date.toISOString().split('T')[0];
