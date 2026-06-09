export interface User {
  nome: string;
  nomeExibicao?: string; // Como quer ser chamado
  nomeExibicaoConjuge?: string; // Como o cônjuge quer ser chamado
  telefone: string;
  tipo?: string; // 'individual' ou 'casal'
  nomeConjuge?: string;
  role?: 'ministro' | 'coordenacao' | 'admin';
  dataNascimento?: string;
  dataNascimentoConjuge?: string;
  paroquia?: string;
  senha?: string;
  senhaConjuge?: string;
  telefoneConjuge?: string;
  acessoCoordenacao?: 'casal' | 'ele' | 'ela';
  mensagem?: string;
  id?: number;
  aprovado?: boolean;
  podeAlterarEscala?: boolean;
  afastado?: boolean;
  afastadoConjuge?: boolean;
  cadastroCompleto?: boolean;
  tempoMinisterio?: 'antigo' | 'novo';
  tempoMinisterioConjuge?: 'antigo' | 'novo';
  incompatibilidades?: number[];
}

export interface DisponibilidadeSlot {
  dia: number;
  horario: string;
  tipo: 'missa' | 'escala';
}

export interface Disponibilidade {
  telefoneMinistro: string;
  mes: number;
  ano: number;
  disponibilidade: DisponibilidadeSlot[];
}

export interface EstoqueItem {
  id: string;
  item: string;
  quantidade: number; // Total em unidades
  quantidadeEmbalagens: number; // Total de caixas/pacotes
  unidadesPorEmbalagem: number; // Unidades dentro de cada caixa/pacote
  tipoEmbalagem: string; // Ex: 'Caixa', 'Pacote'
  unidadeMedida: string; // Ex: 'unidades', 'gramas', 'ml'
  paroquia: string;
  nivelMinimo?: number; // Nível mínimo para alerta
  nivelMinimoTipo?: 'embalagem' | 'unidade'; // Tipo do nível mínimo (unidades ou embalagens)
  ultimaAtualizacao: string;
  entradas?: number;
  saidas?: number;
}

export interface EstoqueMovimentacao {
  id: string;
  itemId: string;
  tipo: 'entrada' | 'saida';
  quantidade: number; // Sempre em unidades para facilitar cálculo
  isEmbalagem?: boolean;
  quantidadeOriginal?: number; // Valor informado pelo usuário (ex: 5 caixas)
  data: string;
  dataMissa?: string;
  horarioMissa?: string;
  ministroResponsavel?: string;
  usuario: string;
  paroquia: string;
  observacao?: string;
}
