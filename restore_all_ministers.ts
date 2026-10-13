import db from "./src/database.js";
import fs from "fs";

async function restore() {
  console.log("Iniciando restauração de todos os ministros...");
  await db.read();
  db.data.ministros = db.data.ministros || [];

  const gen = JSON.parse(fs.readFileSync("./generator_debug.json", "utf8"));
  const ministrosAtivos = gen.ministrosAtivos || [];

  console.log("Ministros atuais no DB:", db.data.ministros.length);
  console.log("Ministros no generator_debug:", ministrosAtivos.length);

  const existingMap = new Map();
  db.data.ministros.forEach(m => {
    existingMap.set(Number(m.id), m);
    existingMap.set(String(m.nome).toLowerCase().trim(), m);
  });

  let addedCount = 0;
  let updatedCount = 0;

  for (const gm of ministrosAtivos) {
    const id = Number(gm.id);
    const nome = gm.nome;
    const nomeKey = String(nome).toLowerCase().trim();

    if (existingMap.has(id)) {
      const existing = existingMap.get(id);
      existing.nome = existing.nome || nome;
      existing.tipo = existing.tipo || gm.tipo || "individual";
      existing.aprovado = existing.aprovado !== undefined ? existing.aprovado : true;
      existing.telefone = existing.telefone || "11999999999";
      existing.senha = existing.senha || "123456";
      existing.paroquia = existing.paroquia || gm.paroquia || "Paróquia Santa Rita de Cássia";
      updatedCount++;
    } else if (existingMap.has(nomeKey)) {
      const existing = existingMap.get(nomeKey);
      existing.tipo = existing.tipo || gm.tipo || "individual";
      existing.aprovado = existing.aprovado !== undefined ? existing.aprovado : true;
      existing.telefone = existing.telefone || "11999999999";
      existing.senha = existing.senha || "123456";
      existing.paroquia = existing.paroquia || gm.paroquia || "Paróquia Santa Rita de Cássia";
      updatedCount++;
    } else {
      const newMinister = {
        id: id,
        nome: nome,
        telefone: gm.telefone || "11999999999",
        tipo: gm.tipo || "individual",
        aprovado: true,
        senha: "123456",
        paroquia: gm.paroquia || "Paróquia Santa Rita de Cássia",
        role: "ministro",
        tempoMinisterio: id >= 52 ? "novo" : "antigo",
        acessoCoordenacao: "nao"
      };
      db.data.ministros.push(newMinister);
      existingMap.set(id, newMinister);
      existingMap.set(nomeKey, newMinister);
      addedCount++;
    }
  }

  await db.write();
  console.log(`Restauração concluída! Adicionados: ${addedCount}, Atualizados: ${updatedCount}. Total de ministros agora: ${db.data.ministros.length}`);
  
  // Wait 4 seconds for debounce write to complete
  await new Promise(resolve => setTimeout(resolve, 4000));
  console.log("Escrita finalizada com sucesso.");
}

restore().catch(err => {
  console.error("Erro na restauração:", err);
});
