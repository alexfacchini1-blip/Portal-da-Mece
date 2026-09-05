
import db from './src/database';

const chatData = {
  "mensagens": [],
  "missasTemporarias": [
    {
      "data": "",
      "horario": "07:30",
      "tipo": "unica",
      "diaSemana": "0",
      "quantidade": "5",
      "id": "1774041708798",
      "nome": "Missa de Domingo"
    },
    {
      "nome": "Missa de Domingo",
      "id": "1774041738221",
      "quantidade": "5",
      "diaSemana": "0",
      "tipo": "unica",
      "horario": "07:30",
      "data": ""
    },
    {
      "quantidade": "8",
      "diaSemana": "0",
      "tipo": "unica",
      "horario": "10:00",
      "data": "",
      "nome": "Missa de Domingo",
      "id": "1774041819948"
    },
    {
      "diaSemana": "6",
      "frequencia": "semanal",
      "paroquia": "Paróquia Santa Rita de Cássia",
      "nome": "Missa de Sábado",
      "horario": "17:00",
      "data": "",
      "datasInativas": [
        "2026-04-04"
      ],
      "quantidade": "6",
      "id": "1774042473937"
    },
    {
      "diaSemana": "0",
      "quantidade": "5",
      "horario": "07:30",
      "data": "",
      "paroquia": "Paróquia Santa Rita de Cássia",
      "nome": "Missa de Domingo",
      "id": "1774042490116",
      "frequencia": "semanal"
    },
    {
      "data": "",
      "horario": "10:00",
      "diaSemana": "0",
      "quantidade": "8",
      "frequencia": "semanal",
      "id": "1774042502936",
      "paroquia": "Paróquia Santa Rita de Cássia",
      "nome": "Missa de Domingo"
    },
    {
      "nome": "Missa de Domingo",
      "paroquia": "Paróquia Santa Rita de Cássia",
      "id": "1774042517342",
      "frequencia": "semanal",
      "quantidade": "8",
      "diaSemana": "0",
      "horario": "19:00",
      "data": ""
    },
    {
      "data": "",
      "horario": "19:30",
      "diaMes": "22",
      "quantidade": 4,
      "id": "1774043219009",
      "diaSemana": "0",
      "frequencia": "mensal-data",
      "nome": "Missa e Oração da Coroa de Santa Rita",
      "paroquia": "Paróquia Santa Rita de Cássia"
    },
    {
      "quantidade": 4,
      "diaMes": "1",
      "horario": "19:30",
      "data": "2026-05-01",
      "id": "1776457832892",
      "diaSemana": "5",
      "paroquia": "Paróquia Santa Rita de Cássia",
      "nome": "Sagrado Coração de Jesus",
      "frequencia": "mensal-1"
    },
    {
      "id": "1776457906677",
      "diaMes": "1",
      "quantidade": 4,
      "horario": "19:30",
      "data": "",
      "paroquia": "Paróquia Santa Rita de Cássia",
      "nome": "Missa com a Benção do Santíssimo",
      "frequencia": "mensal-2",
      "diaSemana": "5"
    },
    {
      "diaSemana": "1",
      "nome": "Diária",
      "paroquia": "Paróquia São Cristóvão",
      "frequencia": "diaria",
      "diaMes": "1",
      "quantidade": 3,
      "horario": "07:00",
      "data": "2026-06-01",
      "id": "1778187519559"
    },
    {
      "diaSemana": "6",
      "paroquia": "Paróquia São Cristóvão",
      "nome": "Manhã",
      "frequencia": "semanal",
      "quantidade": "5",
      "diaMes": "1",
      "data": "2026-06-01",
      "horario": "07:00",
      "id": "1778189038388"
    },
    {
      "diaSemana": "6",
      "paroquia": "Paróquia São Cristóvão",
      "nome": "Tarde",
      "frequencia": "semanal",
      "quantidade": "6",
      "diaMes": "1",
      "horario": "17:00",
      "data": "",
      "id": "1778189060670"
    },
    {
      "nome": "Paroquia N. Sra. Carmo",
      "paroquia": "Paróquia São Cristóvão",
      "frequencia": "semanal",
      "diaSemana": "6",
      "id": "1778189085806",
      "quantidade": 2,
      "diaMes": "1",
      "horario": "19:00",
      "data": ""
    },
    {
      "nome": "Paróquia N. Sra. Rosário",
      "paroquia": "Paróquia São Cristóvão",
      "frequencia": "semanal",
      "diaSemana": "0",
      "id": "1778189153252",
      "quantidade": "2",
      "diaMes": "1",
      "data": "",
      "horario": "08:00"
    },
    {
      "id": "1778189181162",
      "horario": "10:00",
      "data": "",
      "diaMes": "1",
      "quantidade": "8",
      "frequencia": "semanal",
      "paroquia": "Paróquia São Cristóvão",
      "nome": "Manhã",
      "diaSemana": "0"
    },
    {
      "id": "1778189198854",
      "diaMes": "1",
      "quantidade": "6",
      "horario": "12:15",
      "data": "",
      "nome": "Tarde",
      "paroquia": "Paróquia São Cristóvão",
      "frequencia": "semanal",
      "diaSemana": "0"
    },
    {
      "frequencia": "semanal",
      "nome": "Noite",
      "paroquia": "Paróquia São Cristóvão",
      "diaSemana": "0",
      "id": "1778189211165",
      "horario": "19:00",
      "data": "",
      "diaMes": "1",
      "quantidade": "8"
    },
    {
      "paroquia": "Paróquia Santa Rita de Cássia",
      "nome": "Corpus Christi ",
      "frequencia": "temporaria",
      "diaSemana": "0",
      "id": "1779916524765",
      "diaMes": "1",
      "quantidade": "3",
      "horario": "07:30",
      "data": "2026-06-04"
    },
    {
      "nome": "Sábado",
      "paroquia": "Paróquia Teste",
      "frequencia": "semanal",
      "diaSemana": "6",
      "id": "1780961299119",
      "diaMes": "1",
      "quantidade": "2",
      "data": "2026-07-01",
      "horario": "17:00"
    },
    {
      "diaSemana": "0",
      "paroquia": "Paróquia Teste",
      "nome": "Domingo",
      "frequencia": "semanal",
      "quantidade": "3",
      "diaMes": "1",
      "data": "",
      "horario": "10:00",
      "id": "1780961311764"
    },
    {
      "diaSemana": "0",
      "frequencia": "mensal-data",
      "paroquia": "Paróquia Teste",
      "nome": "Exposição do Santissimo",
      "horario": "20:00",
      "data": "",
      "quantidade": "2",
      "diaMes": "15",
      "id": "1780961346040"
    }
  ],
  "estoqueMovimentacoes": [
    {
      "observacao": "Atualização do estoque",
      "id": "1779149216998",
      "usuario": "Alexandre",
      "data": "2026-05-19T00:06:56.998Z",
      "tipo": "saida",
      "itemId": "1779149144930",
      "quantidade": 3,
      "isEmbalagem": false,
      "paroquia": "Paróquia Santa Rita de Cássia",
      "quantidadeOriginal": 3
    },
    {
      "isEmbalagem": false,
      "quantidadeOriginal": 4,
      "paroquia": "Paróquia Santa Rita de Cássia",
      "tipo": "saida",
      "data": "2026-05-19T00:10:07.199Z",
      "itemId": "1779149297024",
      "quantidade": 4,
      "observacao": "Atualização do Estoque",
      "id": "1779149407199",
      "usuario": "Alexandre"
    },
    {
      "paroquia": "Paróquia Santa Rita de Cássia",
      "itemId": "1779153767981",
      "quantidade": 4,
      "tipo": "saida",
      "data": "2026-05-19T01:32:56.012Z",
      "id": "1779154376012",
      "horarioMissa": "22:00",
      "dataMissa": "2026-05-19",
      "quantidadeOriginal": 4,
      "isEmbalagem": false,
      "ministroResponsavel": "Alexandre",
      "usuario": "Alexandre",
      "observacao": "Atualização do Estoque"
    },
    {
      "id": "1779306746636",
      "tipo": "saida",
      "data": "2026-05-20T19:52:26.636Z",
      "itemId": "1779152756792",
      "quantidade": 1000,
      "paroquia": "Paróquia Santa Rita de Cássia",
      "observacao": "",
      "usuario": "Alexandre",
      "ministroResponsavel": "Sônia",
      "isEmbalagem": true,
      "quantidadeOriginal": 1,
      "dataMissa": "2026-05-19",
      "horarioMissa": "19:30"
    },
    {
      "paroquia": "Paróquia Santa Rita de Cássia",
      "id": "1779402316844",
      "data": "2026-05-21T22:25:16.844Z",
      "tipo": "saida",
      "quantidade": 1,
      "itemId": "1779153767981",
      "isEmbalagem": false,
      "quantidadeOriginal": 1,
      "dataMissa": "2026-05-21",
      "horarioMissa": "19:30",
      "observacao": "Triduo de Sta Eita",
      "usuario": "Alexandre",
      "ministroResponsavel": "Alexandre"
    },
    {
      "paroquia": "Paróquia Santa Rita de Cássia",
      "id": "1779402340134",
      "itemId": "1779153767981",
      "quantidade": 1,
      "tipo": "saida",
      "data": "2026-05-21T22:25:40.134Z",
      "quantidadeOriginal": 1,
      "isEmbalagem": false,
      "horarioMissa": "1930",
      "dataMissa": "2026-05-21",
      "usuario": "Alexandre",
      "observacao": "",
      "ministroResponsavel": "Alexandre"
    },
    {
      "isEmbalagem": false,
      "quantidadeOriginal": 1,
      "dataMissa": "2026-05-21",
      "horarioMissa": "19:30",
      "observacao": "",
      "usuario": "Alexandre",
      "ministroResponsavel": "Alexandre",
      "paroquia": "Paróquia Santa Rita de Cássia",
      "id": "1779402374272",
      "data": "2026-05-21T22:26:14.272Z",
      "tipo": "saida",
      "itemId": "1779153767981",
      "quantidade": 1
    },
    {
      "quantidade": 1,
      "itemId": "1779153767981",
      "data": "2026-05-22T01:13:01.444Z",
      "tipo": "saida",
      "id": "1779412381444",
      "paroquia": "Paróquia Santa Rita de Cássia",
      "ministroResponsavel": "Alexandre",
      "usuario": "Alexandre",
      "observacao": "",
      "horarioMissa": "19:30",
      "dataMissa": "2026-05-22",
      "quantidadeOriginal": 1,
      "isEmbalagem": false
    }
  ],
  "disponibilidades": [
    {
      "id": 1,
      "paroquia": "Paróquia Santa Rita de Cássia",
      "modo": "individual",
      "ministro_id": 21,
      "nomeMissa": "Missa com a Benção do Santíssimo",
      "data": "2026-05-08",
      "horario": "19:30"
    },
    {
      "horario": "19:30",
      "data": "2026-05-19",
      "id": 2,
      "modo": "individual",
      "paroquia": "Paróquia Santa Rita de Cássia",
      "nomeMissa": "1º Dia do Tríduo de Santa Rita",
      "ministro_id": 21
    },
    {
      "horario": "19:30",
      "data": "2026-05-20",
      "id": 3,
      "nomeMissa": "2º Dia do Tríduo de Santa Rita",
      "ministro_id": 21,
      "modo": "individual",
      "paroquia": "Paróquia Santa Rita de Cássia"
    },
    {
      "ministro_id": 21,
      "nomeMissa": "3º Dia do Tríduo de Santa Rita",
      "paroquia": "Paróquia Santa Rita de Cássia",
      "modo": "individual",
      "id": 4,
      "data": "2026-05-21",
      "horario": "19:30"
    }
  ],
  "comunhao": [],
  "trocas": [],
  "escalaGerada": {},
  "paroquias": [
    {
      "nome": "Paróquia Santa Rita de Cássia",
      "bairro": "Centro",
      "telefone2": "1499115-2878",
      "telefone1": "143223-5000",
      "estado": "SP",
      "id": "1772280333795",
      "status": "ativo",
      "endereco": "Rua São Gonçalo, ",
      "site": "https://santaritabauru.com.br/",
      "email": "santarita@bispadobauru.org.br",
      "cep": "17015-450",
      "coordenador": "Alexandre",
      "cnpj": "44.454.312/0024-37",
      "cidade": "Bauru",
      "numero": "3-54",
      "telefoneCoordenador": "14997865806",
      "padre": "Pe. Marcos Eduardo Pavan"
    }
  ],
  "config": {
    "horaAbertura": "06:00",
    "horaFechamento": "23:59",
    "adminPassword": "Aqamnsqa081%",
    "escalaPublicada": true,
    "disponibilidadeAberta": false,
    "coordinatorEnabled": false
  },
  "ministros": [
    {
      "role": "coordenacao",
      "disponibilidadeConfirmada": true,
      "nomeExibicao": "Alexandre",
      "nomeConjuge": "Priscila De Bortolli Facchini",
      "afastado": false,
      "cadastroCompleto": true,
      "telefoneConjuge": "(14) 99602-1377",
      "tempoMinisterio": "antigo",
      "telefone": "(14) 99786-5806",
      "aprovado": true,
      "nome": "Alexandre",
      "paroquia": "Paróquia Santa Rita de Cássia",
      "id": 1,
      "tipo": "casal",
      "senha": "888"
    }
  ],
  "estoque": []
};

async function restore() {
  console.log('Restaurando dados do chat...');
  await db.read();
  db.data = chatData as any;
  await db.write();
  console.log('Dados restaurados!');
}

restore();
