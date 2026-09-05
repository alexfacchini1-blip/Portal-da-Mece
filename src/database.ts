import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { FirestoreAdapter } from './firestore-adapter'

// Define a estrutura de dados
type Data = {
  ministros: { 
    id: number; 
    nome: string; 
    nomeExibicao?: string;
    nomeExibicaoConjuge?: string;
    telefone: string; 
    tipo?: string; 
    nomeConjuge?: string;
    dataNascimento?: string;
    dataNascimentoConjuge?: string;
    telefoneConjuge?: string;
    paroquia?: string;
    senha?: string;
    senhaConjuge?: string;
    role?: string;
    acessoCoordenacao?: string;
    aprovado?: boolean;
    excecaoAcessoAte?: string;
    disponibilidadeConfirmada?: boolean;
    afastado?: boolean;
    afastadoConjuge?: boolean;
    cadastroCompleto?: boolean;
    tempoMinisterio?: 'antigo' | 'novo';
    tempoMinisterioConjuge?: 'antigo' | 'novo';
    incompatibilidades?: number[];
    isTesoureiro?: boolean;
    isLider?: boolean;
    isLiderConjuge?: boolean;
    sessionToken?: string;
    sessionTokenConjuge?: string;
    isConjugeLogin?: boolean;
    loggedInName?: string;
    loginPhone?: string;
  }[];
  paroquias?: {
    id: string;
    nome: string;
    cnpj: string;
    coordenador: string;
    telefoneCoordenador: string;
    endereco?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    padre?: string;
    telefone1?: string;
    telefone2?: string;
    email?: string;
    site?: string;
    bloqueada?: boolean;
    status?: 'ativo' | 'bloqueado' | 'testes';
    dataBloqueio?: string;
  }[];
  disponibilidades: { 
    id: number; 
    ministro_id: string | number; 
    data: string; 
    horario?: string; 
    nomeMissa?: string; 
    modo?: string;
    telefone?: string;
    nome?: string;
    paroquia?: string;
  }[];
  mensagens?: { 
    id: number; 
    nome: string; 
    telefone: string; 
    destinatario_telefone?: string | null;
    texto: string; 
    data: string; 
    paroquia?: string;
    type?: string;
    lida?: boolean;
  }[];
  config?: { 
    coordinatorEnabled: boolean; 
    modoManutencao?: boolean;
    escalaPublicada?: boolean; 
    escalaPublicadaPorParoquia?: Record<string, boolean>;
    escalaPublicadaPorMes?: Record<string, Record<string, boolean>>;
    adminPassword?: string; 
    disponibilidadeAberta?: boolean;
    disponibilidadeAbertaPorParoquia?: Record<string, boolean>;
    diaAbertura?: number;
    horaAbertura?: string;
    diaFechamento?: number;
    horaFechamento?: string;
    agendamentoPorParoquia?: Record<string, {
      diaAbertura?: number | '';
      horaAbertura?: string;
      diaFechamento?: number | '';
      horaFechamento?: string;
    }>;
    limiteEscalacaoPorParoquia?: Record<string, number>;
    limiteNovosPorMissaPorParoquia?: Record<string, number | "livre">;
    regraDisponibilidadePorParoquia?: Record<string, "livre" | "regra2" | "regra3">;
    lastClearAvailabilityDate?: string;
    lembreteAutomaticoPorParoquia?: Record<string, boolean>;
  };
  missasTemporarias?: { 
    id: string; 
    data?: string; 
    horario: string; 
    nome: string; 
    quantidade?: number; 
    tipo?: string; 
    frequencia?: string; 
    diaSemana?: string; 
    paroquia?: string;
    datasInativas?: string[];
    deletada?: boolean;
  }[];
  escalaGerada?: Record<string, any>;
  comunhao?: {
    id: number;
    nomeIdoso: string;
    idade: number;
    cep?: string;
    numero?: string;
    endereco: string;
    bairro: string;
    cidade?: string;
    uf?: string;
    telefone: string;
    responsavel: string;
    telefoneResponsavel: string;
    clinicaRepouso?: string;
    ministro_id: number;
    dataCadastro: string;
    paroquia?: string;
  }[];
  estoque?: {
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
  }[];
  estoqueMovimentacoes?: {
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
  }[];
  trocas?: {
    id: string;
    paroquia: string;
    solicitanteId: number;
    solicitanteNome: string;
    solicitanteTelefone: string;
    missaOrigemData: string;
    missaOrigemHorario: string;
    missaOrigemMissa: string;
    tipo: 'direta' | 'substituto';
    destinatarioId: number;
    destinatarioNome: string;
    destinatarioTelefone: string;
    missaDestinoData?: string;
    missaDestinoHorario?: string;
    missaDestinoMissa?: string;
    status: 'pendente_destinatario' | 'pendente_coordenacao' | 'aprovado' | 'rejeitado_destinatario' | 'rejeitado_coordenacao';
    confirmadoSolicitante?: boolean;
    confirmadoDestinatario?: boolean;
    dataSolicitacao: string;
  }[];
  testers?: {
    id: string;
    email: string;
    nome: string;
    paroquia: string;
    confirmado?: boolean;
    dataAdicao: string;
  }[];
  financeiro?: {
    id: string;
    tipo: 'entrada' | 'saida';
    categoria: 'mensalidade' | 'outros';
    valor: number;
    data: string;
    ministroId?: number;
    ministroNome?: string;
    usuario: string;
    paroquia: string;
    descricao?: string;
    mesReferencia?: string;
    createdAt: string;
  }[];
  vapidKeys?: { publicKey: string; privateKey: string; };
  pushSubscriptions?: { endpoint: string; keys: { p256dh: string; auth: string; }; userId: number; paroquia?: string; }[];
  fidelisCoordinators?: {
    id: string;
    nome: string;
    telefone: string;
    email?: string;
    paroquia: string;
    cargo?: 'coordenador' | 'vice_coordenador';
    tipo?: 'individual' | 'casal';
    nomeConjuge?: string;
    telefoneConjuge?: string;
    senha?: string;
    status: 'ativo' | 'inativo';
    observacoes?: string;
    createdAt: string;
  }[];
  faltas?: {
    id: string;
    ministroId: string | number;
    ministroNome: string;
    quantidade?: number;
    tipoFalta?: string;
    telefone?: string;
    data: string;
    horario?: string;
    nomeMissa?: string;
    paroquia?: string;
    motivo?: string;
    justificativa?: string;
    registradoPor?: string;
    dataRegistro?: string;
    createdAt?: string;
  }[];
  relatoriosLider?: {
    id: string;
    paroquia: string;
    data: string;
    horario: string;
    liderNome: string;
    presencas?: Record<string, boolean>;
    faltasReportadas?: any[];
    usoEstoque?: string;
    observacoes?: string;
    updatedAt?: string;
  }[];
  eventos?: {
    id: string;
    titulo: string;
    data: string;
    horario?: string;
    tipo?: string;
    descricao?: string;
    paroquia?: string;
    criadoPor?: string;
    criadoPorAdmin?: boolean;
    createdAt?: string;
  }[];
}

// Configura o banco de dados
const defaultData: Data = { 
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
  trocas: [],
  testers: [],
  financeiro: [],
  pushSubscriptions: [],
  fidelisCoordinators: [],
  eventos: []
}

const adapter = new FirestoreAdapter<Data>('app_data', 'main_db')
const db = new Low<Data>(adapter as any, defaultData)

// Função para inicializar o banco de dados
export async function setupDatabase() {
  const fs = await import('fs');
  fs.writeFileSync('src/setup.log', `[SETUP] ${new Date().toISOString()} - Iniciando setup...\n`);
  console.log('Iniciando setup do banco de dados...');
  console.log('Verificando variáveis de ambiente do Firebase:');
  console.log(`- Project ID: ${process.env.VITE_FIREBASE_PROJECT_ID || 'NÃO DEFINIDO'}`);
  console.log(`- API Key: ${process.env.VITE_FIREBASE_API_KEY ? 'DEFINIDA (***)' : 'NÃO DEFINIDA'}`);

  try {
    fs.appendFileSync('src/setup.log', `[SETUP] ${new Date().toISOString()} - Iniciando leitura do Firestore...\n`);
    // Tentamos ler do Firestore
    let readSuccess = false;
    try {
      console.log('Tentando ler do Firestore (force read)...');
      // Use force: true to bypass any potential stale cache on boot
      const adapter = db.adapter as any;
      db.data = await adapter.read(true);
      fs.appendFileSync('src/setup.log', `[SETUP] ${new Date().toISOString()} - Leitura do Firestore concluída.\n`);
      readSuccess = true;
      if (db.data) {
        console.log(`Leitura do Firestore concluída. Ministros: ${db.data.ministros?.length || 0}`);
        fs.appendFileSync('src/setup.log', `[SETUP] ${new Date().toISOString()} - Ministros encontrados: ${db.data.ministros?.length || 0}\n`);
      } else {
        console.log('Firestore retornou dados nulos (documento não existe).');
        fs.appendFileSync('src/setup.log', `[SETUP] ${new Date().toISOString()} - Firestore retornou dados nulos.\n`);
      }
    } catch (readError: any) {
      console.error('ERRO CRÍTICO ao ler do Firestore durante setup:', readError);
      fs.appendFileSync('src/setup.log', `[SETUP] ${new Date().toISOString()} - Erro na leitura do Firestore: ${readError.message}\n`);
      // Se houve erro de permissão ou conexão, NÃO definimos db.data como null
      // para evitar que a lógica abaixo tente "inicializar" (e possivelmente sobrescrever) o banco.
      // Em vez disso, mantemos o estado atual (provavelmente defaultData na memória) mas marcamos como falha.
      readSuccess = false;
      db.data = defaultData; // Fallback to defaultData if read fails
    }
    
    // SÓ tentamos inicializar ou migrar se a leitura foi um SUCESSO e retornou null (documento não existe)
    if (readSuccess && db.data === null) {
      console.log('Banco de dados não encontrado no Firestore. Verificando migração local...');
      
      let localData: Data | null = null;
      try {
        const localAdapter = new JSONFile<Data>('db.json')
        const localDb = new Low<Data>(localAdapter, defaultData)
        await localDb.read()
        if (localDb.data && localDb.data.ministros && localDb.data.ministros.length > 0) {
          localData = localDb.data;
        }
      } catch (e) {
        console.log('Nenhum db.json encontrado para migração.');
      }

      if (localData) {
        db.data = localData;
        try {
          await db.write();
          console.log('Dados migrados do db.json para o Firestore com sucesso.');
        } catch (e) {
          console.error('Erro ao migrar dados para o Firestore:', e);
        }
      } else {
        db.data = defaultData;
        try {
          await db.write();
          console.log('Firestore inicializado com dados padrão (vazio).');
        } catch (e) {
          console.error('Erro ao inicializar Firestore com dados padrão:', e);
        }
      }
    } else if (!readSuccess) {
      console.error('AVISO: Setup do banco de dados incompleto devido a erro de leitura. O sistema pode estar operando com dados em branco na memória para evitar sobrescrever o Firestore.');
      // Tentamos carregar o que estiver na memória (defaultData) mas não escrevemos nada.
      db.data = defaultData;
    } else if (db.data && !db.data.ministros) {
      // Caso o documento exista mas esteja malformado
      db.data.ministros = [];
      try {
        await db.write();
        console.log('Estrutura de ministros inicializada no Firestore.');
      } catch (e) {
        console.error('Erro ao inicializar estrutura de ministros no Firestore:', e);
      }
    }
    
    console.log(`Banco de dados carregado. Total de ministros: ${db.data?.ministros?.length || 0}`);
    console.log(`Banco de dados carregado. Total de paróquias: ${db.data?.paroquias?.length || 0}`);
    
    if (db.data?.paroquias?.length === 0) {
      console.log('AVISO: O banco de dados de paróquias está VAZIO. Adicionando paróquias padrão para permitir o início do sistema.');
      db.data.paroquias = [
        { id: '1772280333795', nome: 'Paróquia Santa Rita de Cássia', cnpj: '44.454.312/0024-37', coordenador: 'Alexandre', telefoneCoordenador: '14997865806', estado: 'SP', cidade: 'Bauru', status: 'ativo' },
        { id: '1772281505207', nome: 'Paróquia São Cristóvão', cnpj: '00.000.000/0000-00', coordenador: 'Josué', telefoneCoordenador: '14999999999', estado: 'SP', cidade: 'Bauru', status: 'ativo' },
        { id: '1774922106968', nome: 'Paróquia Nossa Senhora das Graças', cnpj: '00.000.000/0000-00', coordenador: 'Fernanda e Celiomar', telefoneCoordenador: '14991133422', estado: 'SP', cidade: 'Bauru', status: 'ativo' }
      ];
      try {
        await db.write();
      } catch (e) {
        console.error('Erro ao salvar paróquias padrão no Firestore:', e);
      }
    }
    
    // Teste de conexão com o Firestore
    try {
      const { getDocFromCache, getDocFromServer } = await import('firebase/firestore');
      const adapter = db.adapter as any;
      if (adapter && adapter.docRef) {
        await getDocFromServer(adapter.docRef);
        console.log('Conexão com Firestore verificada com sucesso.');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error("ERRO CRÍTICO: O cliente Firestore está offline. Verifique a configuração do Firebase.");
      } else {
        console.warn('Aviso: Teste de conexão com Firestore falhou (pode ser normal se for a primeira execução ou se estiver usando cache):', error);
      }
    }

    if (db.data?.ministros?.length === 0) {
      console.log('AVISO: O banco de dados de ministros está VAZIO. Ninguém conseguirá logar até que novos cadastros sejam feitos.');
    }
  } catch (error) {
    console.error('Erro crítico ao inicializar banco de dados:', error);
    // Não sobrescrevemos db.data aqui para evitar perda de dados por erro de conexão
  }
}

export default db;
