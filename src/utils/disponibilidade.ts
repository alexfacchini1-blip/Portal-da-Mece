export interface StatusDisponibilidadeInfo {
  mensagem: {
    texto: string;
    tipo: 'info' | 'warning' | 'error' | 'success';
  } | null;
  diasRestantes: number | null;
  encerraHoje: boolean;
  statusCard: string;
  badgeCard: string;
  showPreAbertura: boolean;
}

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

/**
 * Retorna um objeto Date representando a data e hora atual no fuso horário de Brasília (America/Sao_Paulo).
 * Garante que comparações de dia, mês, ano e hora de abertura/fechamento sejam exatas
 * independentemente do fuso horário local do navegador ou servidor.
 */
export function getBrazilDate(date = new Date()): Date {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const map: Record<string, number> = {};
    for (const part of parts) {
      if (part.type !== 'literal') {
        map[part.type] = Number(part.value);
      }
    }
    const hour = map.hour === 24 ? 0 : map.hour;
    return new Date(map.year, map.month - 1, map.day, hour, map.minute, map.second);
  } catch (e) {
    return date;
  }
}

export function calcularStatusDisponibilidade({
  diaAbertura,
  horaAbertura,
  diaFechamento,
  horaFechamento,
  disponibilidadeAberta,
  manualOverride,
  hasSubmitted,
  mesAlvo,
  anoAlvo,
}: {
  diaAbertura?: number | '' | null;
  horaAbertura?: string | null;
  diaFechamento?: number | '' | null;
  horaFechamento?: string | null;
  disponibilidadeAberta?: boolean;
  manualOverride?: boolean;
  hasSubmitted?: boolean;
  mesAlvo?: number;
  anoAlvo?: number;
}): StatusDisponibilidadeInfo {
  const agora = getBrazilDate();
  const diaNumAbertura = Number(diaAbertura);
  const diaNumFechamento = Number(diaFechamento);

  const horaA = (horaAbertura && horaAbertura.trim().length > 0) ? horaAbertura : '00:00';
  const horaF = (horaFechamento && horaFechamento.trim().length > 0) ? horaFechamento : '23:59';
  const [hA, mA] = horaA.split(':').map((v) => Number(v) || 0);
  const [hF, mF] = horaF.split(':').map((v) => Number(v) || 0);

  const nomeMesAlvo = mesAlvo && mesAlvo >= 1 && mesAlvo <= 12 ? MESES[mesAlvo - 1] : '';

  // Sem agendamento automático configurado
  if (!diaNumAbertura || !diaNumFechamento) {
    const abertaSemAgendamento = manualOverride !== undefined ? manualOverride : !!disponibilidadeAberta;
    if (abertaSemAgendamento) {
      if (hasSubmitted) {
        return {
          mensagem: {
            texto: `Sua disponibilidade${nomeMesAlvo ? ` para ${nomeMesAlvo}` : ''} já foi enviada com sucesso!`,
            tipo: 'success',
          },
          diasRestantes: null,
          encerraHoje: false,
          statusCard: 'Enviado ✓',
          badgeCard: 'Enviado ✓',
          showPreAbertura: false,
        };
      }
      return {
        mensagem: {
          texto: `O período de envio da disponibilidade${nomeMesAlvo ? ` para ${nomeMesAlvo}` : ''} está aberto. Envie suas datas.`,
          tipo: 'info',
        },
        diasRestantes: null,
        encerraHoje: false,
        statusCard: 'Enviar datas',
        badgeCard: 'Aberto',
        showPreAbertura: false,
      };
    } else {
      return {
        mensagem: null,
        diasRestantes: null,
        encerraHoje: false,
        statusCard: 'Encerrado',
        badgeCard: '',
        showPreAbertura: false,
      };
    }
  }

  // Criação dos pontos de abertura e fechamento
  let dataAbertura = new Date(agora.getFullYear(), agora.getMonth(), diaNumAbertura, hA, mA, 0, 0);
  let dataFechamento = new Date(agora.getFullYear(), agora.getMonth(), diaNumFechamento, hF, mF, 59, 999);

  // Se dia de fechamento for menor que dia de abertura (ex: abre dia 20 e fecha dia 5 do mês seguinte)
  if (diaNumFechamento < diaNumAbertura) {
    if (agora.getDate() >= diaNumAbertura) {
      dataFechamento.setMonth(dataFechamento.getMonth() + 1);
    } else {
      dataAbertura.setMonth(dataAbertura.getMonth() - 1);
    }
  }

  const msAteFechamento = dataFechamento.getTime() - agora.getTime();
  const msAteAbertura = dataAbertura.getTime() - agora.getTime();

  // Caso: Pré-abertura (dentro de 3 dias antes da abertura)
  if (msAteAbertura > 0 && msAteAbertura <= 3 * 24 * 60 * 60 * 1000) {
    const diasParaAbrir = Math.ceil(msAteAbertura / (1000 * 60 * 60 * 24));
    return {
      mensagem: {
        texto: `A disponibilidade${nomeMesAlvo ? ` para ${nomeMesAlvo}` : ''} será aberta em breve (dia ${diaNumAbertura} às ${horaA}).`,
        tipo: 'info',
      },
      diasRestantes: null,
      encerraHoje: false,
      statusCard: `Abre dia ${diaNumAbertura}`,
      badgeCard: diasParaAbrir === 1 ? 'Abre amanhã' : `Abre em ${diasParaAbrir}d`,
      showPreAbertura: true,
    };
  }

  const estaNoPeriodo = agora >= dataAbertura && agora <= dataFechamento;
  const estaAberta = manualOverride !== undefined
    ? manualOverride
    : (estaNoPeriodo || disponibilidadeAberta === true);

  // Caso: Período de disponibilidade ABERTO
  if (estaAberta && msAteFechamento > 0) {
    const encerraHoje =
      dataFechamento.getFullYear() === agora.getFullYear() &&
      dataFechamento.getMonth() === agora.getMonth() &&
      dataFechamento.getDate() === agora.getDate();

    // Diferença em dias corridos inteiros a partir de hoje
    const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime();
    const fimFechamento = new Date(dataFechamento.getFullYear(), dataFechamento.getMonth(), dataFechamento.getDate()).getTime();
    const diffDias = Math.max(0, Math.round((fimFechamento - inicioHoje) / (1000 * 60 * 60 * 24)));

    if (encerraHoje) {
      if (hasSubmitted) {
        return {
          mensagem: {
            texto: `Sua disponibilidade${nomeMesAlvo ? ` para ${nomeMesAlvo}` : ''} já foi enviada com sucesso! O período de agendamento geral encerra hoje às ${horaF}.`,
            tipo: 'success',
          },
          diasRestantes: 0,
          encerraHoje: true,
          statusCard: `Enviado ✓ (encerra hoje)`,
          badgeCard: 'Enviado ✓',
          showPreAbertura: false,
        };
      } else {
        return {
          mensagem: {
            texto: `Atenção: A disponibilidade${nomeMesAlvo ? ` para ${nomeMesAlvo}` : ''} encerra hoje às ${horaF}! Por favor, selecione suas datas.`,
            tipo: 'warning',
          },
          diasRestantes: 0,
          encerraHoje: true,
          statusCard: `Encerra hoje às ${horaF}`,
          badgeCard: 'Encerra hoje!',
          showPreAbertura: false,
        };
      }
    } else if (diffDias === 1) {
      if (hasSubmitted) {
        return {
          mensagem: {
            texto: `Sua disponibilidade${nomeMesAlvo ? ` para ${nomeMesAlvo}` : ''} já foi enviada com sucesso! O período de envio encerra amanhã (dia ${diaNumFechamento} às ${horaF}).`,
            tipo: 'success',
          },
          diasRestantes: 1,
          encerraHoje: false,
          statusCard: `Enviado ✓ (encerra amanhã)`,
          badgeCard: 'Enviado ✓',
          showPreAbertura: false,
        };
      } else {
        return {
          mensagem: {
            texto: `Atenção: Resta 1 dia para o encerramento da disponibilidade${nomeMesAlvo ? ` para ${nomeMesAlvo}` : ''} (encerra amanhã, dia ${diaNumFechamento} às ${horaF}).`,
            tipo: 'warning',
          },
          diasRestantes: 1,
          encerraHoje: false,
          statusCard: `Encerra amanhã às ${horaF}`,
          badgeCard: 'Resta 1 dia',
          showPreAbertura: false,
        };
      }
    } else {
      if (hasSubmitted) {
        return {
          mensagem: {
            texto: `Sua disponibilidade${nomeMesAlvo ? ` para ${nomeMesAlvo}` : ''} já foi enviada com sucesso! O período encerra no dia ${diaNumFechamento} às ${horaF}.`,
            tipo: 'success',
          },
          diasRestantes: diffDias,
          encerraHoje: false,
          statusCard: `Enviado ✓ (encerra dia ${diaNumFechamento})`,
          badgeCard: 'Enviado ✓',
          showPreAbertura: false,
        };
      } else {
        return {
          mensagem: {
            texto: `Atenção: Restam ${diffDias} dias para o encerramento da disponibilidade${nomeMesAlvo ? ` para ${nomeMesAlvo}` : ''} (encerra dia ${diaNumFechamento} às ${horaF}).`,
            tipo: 'warning',
          },
          diasRestantes: diffDias,
          encerraHoje: false,
          statusCard: `Encerra em ${diffDias} dias (dia ${diaNumFechamento})`,
          badgeCard: `${diffDias} dias`,
          showPreAbertura: false,
        };
      }
    }
  }

  // Caso: Período encerrado (quando não está aberta ou já passou da hora de fechamento)
  if (!estaAberta || msAteFechamento <= 0) {
    const mesAtual = agora.getMonth() + 1;
    const anoAtual = agora.getFullYear();

    // Verifica se já mudou o mês:
    // 1) Se mesAlvo foi informado e o mês atual já alcançou ou passou o mês alvo:
    //    Ex: A disponibilidade enviada era para Outubro e agora já estamos no mês de Outubro
    const jaAlcancouMesAlvo = mesAlvo
      ? (anoAtual * 12 + mesAtual) >= ((anoAlvo || anoAtual) * 12 + mesAlvo)
      : false;

    // 2) Se o mês atual já é posterior ao mês em que ocorreu o fechamento:
    //    Ex: O fechamento ocorreu em Setembro e agora já virou o mês para Outubro
    const mudouMesAposFechamento =
      (anoAtual * 12 + mesAtual) > (dataFechamento.getFullYear() * 12 + (dataFechamento.getMonth() + 1));

    // Quando muda o mês, essa mensagem de encerramento do anexo SOME!
    // Assim que abrir novamente a disponibilidade para o próximo ciclo/mês, ela volta a abrir,
    // e assim sucessivamente.
    if (jaAlcancouMesAlvo || mudouMesAposFechamento) {
      return {
        mensagem: null,
        diasRestantes: 0,
        encerraHoje: false,
        statusCard: 'Encerrado',
        badgeCard: '',
        showPreAbertura: false,
      };
    }

    if (hasSubmitted) {
      return {
        mensagem: {
          texto: `Sua disponibilidade${nomeMesAlvo ? ` para ${nomeMesAlvo}` : ''} já foi enviada com sucesso! O agendamento está encerrado.`,
          tipo: 'success',
        },
        diasRestantes: 0,
        encerraHoje: false,
        statusCard: 'Enviado ✓',
        badgeCard: 'Enviado ✓',
        showPreAbertura: false,
      };
    }
    return {
      mensagem: {
        texto: `O período para envio do Agendamento Mensal de Disponibilidade${nomeMesAlvo ? ` para ${nomeMesAlvo}` : ''} foi encerrado no dia ${diaNumFechamento} às ${horaF}.`,
        tipo: 'info',
      },
      diasRestantes: 0,
      encerraHoje: false,
      statusCard: 'Encerrado',
      badgeCard: 'Encerrado',
      showPreAbertura: false,
    };
  }

  return {
    mensagem: null,
    diasRestantes: null,
    encerraHoje: false,
    statusCard: 'Enviar datas',
    badgeCard: '',
    showPreAbertura: false,
  };
}
