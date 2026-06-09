import fs from 'fs';

const dbData = fs.readFileSync('db.json', 'utf8');
const db = JSON.parse(dbData);

const targetParoquia = 'Paróquia Santa Rita de Cássia';
const isPreview = false;
const config = db.config || {};
const escalaPublicadaPorParoquia = config.escalaPublicadaPorParoquia?.[targetParoquia];
const escalaPublicadaPorMes = (config.escalaPublicadaPorMes) || {};

const escalaCompleta = db.escalaGerada?.[targetParoquia] || {};
const escalaFiltrada = {};

const hoje = new Date();
const mesAtualStr = hoje.toISOString().substring(0, 7);

Object.keys(escalaCompleta).forEach(data => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return;
  const mes = data.substring(0, 7);
  
  const mesAtual = new Date();
  const proximoMes = new Date();
  proximoMes.setDate(1);
  proximoMes.setMonth(mesAtual.getMonth() + 1);
  
  const mesAtualString = mesAtual.toISOString().substring(0, 7);
  const proximoMesString = proximoMes.toISOString().substring(0, 7);

  if (mes === mesAtualString || mes === proximoMesString) {
    let isMesPublicado = false;
    // VERY IMPORTANT:
    if (escalaPublicadaPorMes[mes] !== undefined) {
      isMesPublicado = escalaPublicadaPorMes[mes];
    } else if (escalaPublicadaPorParoquia !== undefined) {
      isMesPublicado = escalaPublicadaPorParoquia;
    } else {
      isMesPublicado = config.escalaPublicada === true;
    }
    
    if (isMesPublicado) {
      escalaFiltrada[data] = escalaCompleta[data];
    }
  }
});

console.log('Filtrada:', Object.keys(escalaFiltrada));
console.log('Meses publicados na config:', escalaPublicadaPorMes);
