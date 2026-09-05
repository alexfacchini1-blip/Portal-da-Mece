"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDatabase = setupDatabase;
var lowdb_1 = require("lowdb");
var node_1 = require("lowdb/node");
var firestore_adapter_1 = require("./firestore-adapter");
// Configura o banco de dados
var defaultData = {
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
    financeiro: []
};
var adapter = new firestore_adapter_1.FirestoreAdapter('app_data', 'main_db');
var db = new lowdb_1.Low(adapter, defaultData);
// Função para inicializar o banco de dados
function setupDatabase() {
    return __awaiter(this, void 0, void 0, function () {
        var fs, readSuccess, adapter_1, _a, readError_1, localData, localAdapter, localDb, e_1, e_2, e_3, e_4, e_5, _b, getDocFromCache, getDocFromServer, adapter_2, error_1, error_2;
        var _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        return __generator(this, function (_o) {
            switch (_o.label) {
                case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('fs'); })];
                case 1:
                    fs = _o.sent();
                    fs.writeFileSync('src/setup.log', "[SETUP] ".concat(new Date().toISOString(), " - Iniciando setup...\n"));
                    console.log('Iniciando setup do banco de dados...');
                    console.log('Verificando variáveis de ambiente do Firebase:');
                    console.log("- Project ID: ".concat(process.env.VITE_FIREBASE_PROJECT_ID || 'NÃO DEFINIDO'));
                    console.log("- API Key: ".concat(process.env.VITE_FIREBASE_API_KEY ? 'DEFINIDA (***)' : 'NÃO DEFINIDA'));
                    _o.label = 2;
                case 2:
                    _o.trys.push([2, 35, , 36]);
                    fs.appendFileSync('src/setup.log', "[SETUP] ".concat(new Date().toISOString(), " - Iniciando leitura do Firestore...\n"));
                    readSuccess = false;
                    _o.label = 3;
                case 3:
                    _o.trys.push([3, 5, , 6]);
                    console.log('Tentando ler do Firestore (force read)...');
                    adapter_1 = db.adapter;
                    _a = db;
                    return [4 /*yield*/, adapter_1.read(true)];
                case 4:
                    _a.data = _o.sent();
                    fs.appendFileSync('src/setup.log', "[SETUP] ".concat(new Date().toISOString(), " - Leitura do Firestore conclu\u00EDda.\n"));
                    readSuccess = true;
                    if (db.data) {
                        console.log("Leitura do Firestore conclu\u00EDda. Ministros: ".concat(((_c = db.data.ministros) === null || _c === void 0 ? void 0 : _c.length) || 0));
                        fs.appendFileSync('src/setup.log', "[SETUP] ".concat(new Date().toISOString(), " - Ministros encontrados: ").concat(((_d = db.data.ministros) === null || _d === void 0 ? void 0 : _d.length) || 0, "\n"));
                    }
                    else {
                        console.log('Firestore retornou dados nulos (documento não existe).');
                        fs.appendFileSync('src/setup.log', "[SETUP] ".concat(new Date().toISOString(), " - Firestore retornou dados nulos.\n"));
                    }
                    return [3 /*break*/, 6];
                case 5:
                    readError_1 = _o.sent();
                    console.error('ERRO CRÍTICO ao ler do Firestore durante setup:', readError_1);
                    fs.appendFileSync('src/setup.log', "[SETUP] ".concat(new Date().toISOString(), " - Erro na leitura do Firestore: ").concat(readError_1.message, "\n"));
                    // Se houve erro de permissão ou conexão, NÃO definimos db.data como null
                    // para evitar que a lógica abaixo tente "inicializar" (e possivelmente sobrescrever) o banco.
                    // Em vez disso, mantemos o estado atual (provavelmente defaultData na memória) mas marcamos como falha.
                    readSuccess = false;
                    db.data = defaultData; // Fallback to defaultData if read fails
                    return [3 /*break*/, 6];
                case 6:
                    if (!(readSuccess && db.data === null)) return [3 /*break*/, 20];
                    console.log('Banco de dados não encontrado no Firestore. Verificando migração local...');
                    localData = null;
                    _o.label = 7;
                case 7:
                    _o.trys.push([7, 9, , 10]);
                    localAdapter = new node_1.JSONFile('db.json');
                    localDb = new lowdb_1.Low(localAdapter, defaultData);
                    return [4 /*yield*/, localDb.read()];
                case 8:
                    _o.sent();
                    if (localDb.data && localDb.data.ministros && localDb.data.ministros.length > 0) {
                        localData = localDb.data;
                    }
                    return [3 /*break*/, 10];
                case 9:
                    e_1 = _o.sent();
                    console.log('Nenhum db.json encontrado para migração.');
                    return [3 /*break*/, 10];
                case 10:
                    if (!localData) return [3 /*break*/, 15];
                    db.data = localData;
                    _o.label = 11;
                case 11:
                    _o.trys.push([11, 13, , 14]);
                    return [4 /*yield*/, db.write()];
                case 12:
                    _o.sent();
                    console.log('Dados migrados do db.json para o Firestore com sucesso.');
                    return [3 /*break*/, 14];
                case 13:
                    e_2 = _o.sent();
                    console.error('Erro ao migrar dados para o Firestore:', e_2);
                    return [3 /*break*/, 14];
                case 14: return [3 /*break*/, 19];
                case 15:
                    db.data = defaultData;
                    _o.label = 16;
                case 16:
                    _o.trys.push([16, 18, , 19]);
                    return [4 /*yield*/, db.write()];
                case 17:
                    _o.sent();
                    console.log('Firestore inicializado com dados padrão (vazio).');
                    return [3 /*break*/, 19];
                case 18:
                    e_3 = _o.sent();
                    console.error('Erro ao inicializar Firestore com dados padrão:', e_3);
                    return [3 /*break*/, 19];
                case 19: return [3 /*break*/, 25];
                case 20:
                    if (!!readSuccess) return [3 /*break*/, 21];
                    console.error('AVISO: Setup do banco de dados incompleto devido a erro de leitura. O sistema pode estar operando com dados em branco na memória para evitar sobrescrever o Firestore.');
                    // Tentamos carregar o que estiver na memória (defaultData) mas não escrevemos nada.
                    db.data = defaultData;
                    return [3 /*break*/, 25];
                case 21:
                    if (!(db.data && !db.data.ministros)) return [3 /*break*/, 25];
                    // Caso o documento exista mas esteja malformado
                    db.data.ministros = [];
                    _o.label = 22;
                case 22:
                    _o.trys.push([22, 24, , 25]);
                    return [4 /*yield*/, db.write()];
                case 23:
                    _o.sent();
                    console.log('Estrutura de ministros inicializada no Firestore.');
                    return [3 /*break*/, 25];
                case 24:
                    e_4 = _o.sent();
                    console.error('Erro ao inicializar estrutura de ministros no Firestore:', e_4);
                    return [3 /*break*/, 25];
                case 25:
                    console.log("Banco de dados carregado. Total de ministros: ".concat(((_f = (_e = db.data) === null || _e === void 0 ? void 0 : _e.ministros) === null || _f === void 0 ? void 0 : _f.length) || 0));
                    console.log("Banco de dados carregado. Total de par\u00F3quias: ".concat(((_h = (_g = db.data) === null || _g === void 0 ? void 0 : _g.paroquias) === null || _h === void 0 ? void 0 : _h.length) || 0));
                    if (!(((_k = (_j = db.data) === null || _j === void 0 ? void 0 : _j.paroquias) === null || _k === void 0 ? void 0 : _k.length) === 0)) return [3 /*break*/, 29];
                    console.log('AVISO: O banco de dados de paróquias está VAZIO. Adicionando paróquias padrão para permitir o início do sistema.');
                    db.data.paroquias = [
                        { id: '1772280333795', nome: 'Paróquia Santa Rita de Cássia', cnpj: '44.454.312/0024-37', coordenador: 'Alexandre', telefoneCoordenador: '14997865806', estado: 'SP', cidade: 'Bauru', status: 'ativo' },
                        { id: '1772281505207', nome: 'Paróquia São Cristóvão', cnpj: '00.000.000/0000-00', coordenador: 'Josué', telefoneCoordenador: '14999999999', estado: 'SP', cidade: 'Bauru', status: 'ativo' },
                        { id: '1774922106968', nome: 'Paróquia Nossa Senhora das Graças', cnpj: '00.000.000/0000-00', coordenador: 'Fernanda e Celiomar', telefoneCoordenador: '14991133422', estado: 'SP', cidade: 'Bauru', status: 'ativo' }
                    ];
                    _o.label = 26;
                case 26:
                    _o.trys.push([26, 28, , 29]);
                    return [4 /*yield*/, db.write()];
                case 27:
                    _o.sent();
                    return [3 /*break*/, 29];
                case 28:
                    e_5 = _o.sent();
                    console.error('Erro ao salvar paróquias padrão no Firestore:', e_5);
                    return [3 /*break*/, 29];
                case 29:
                    _o.trys.push([29, 33, , 34]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('firebase/firestore'); })];
                case 30:
                    _b = _o.sent(), getDocFromCache = _b.getDocFromCache, getDocFromServer = _b.getDocFromServer;
                    adapter_2 = db.adapter;
                    if (!(adapter_2 && adapter_2.docRef)) return [3 /*break*/, 32];
                    return [4 /*yield*/, getDocFromServer(adapter_2.docRef)];
                case 31:
                    _o.sent();
                    console.log('Conexão com Firestore verificada com sucesso.');
                    _o.label = 32;
                case 32: return [3 /*break*/, 34];
                case 33:
                    error_1 = _o.sent();
                    if (error_1 instanceof Error && error_1.message.includes('the client is offline')) {
                        console.error("ERRO CRÍTICO: O cliente Firestore está offline. Verifique a configuração do Firebase.");
                    }
                    else {
                        console.warn('Aviso: Teste de conexão com Firestore falhou (pode ser normal se for a primeira execução ou se estiver usando cache):', error_1);
                    }
                    return [3 /*break*/, 34];
                case 34:
                    if (((_m = (_l = db.data) === null || _l === void 0 ? void 0 : _l.ministros) === null || _m === void 0 ? void 0 : _m.length) === 0) {
                        console.log('AVISO: O banco de dados de ministros está VAZIO. Ninguém conseguirá logar até que novos cadastros sejam feitos.');
                    }
                    return [3 /*break*/, 36];
                case 35:
                    error_2 = _o.sent();
                    console.error('Erro crítico ao inicializar banco de dados:', error_2);
                    return [3 /*break*/, 36];
                case 36: return [2 /*return*/];
            }
        });
    });
}
exports.default = db;
