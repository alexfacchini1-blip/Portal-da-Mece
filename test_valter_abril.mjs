fetch('http://localhost:3000/api/escala/gerar?paroquia=Par%C3%B3quia%20Santa%20Rita%20de%20C%C3%A1ssia&mes=4&ano=2026', { method: 'POST' })
.then(r => r.json())
.then(data => {
  let count = 0;
  Object.values(data.escala || data).forEach(dia => {
    Object.values(dia).forEach(missa => {
      missa.ministros.forEach(m => {
        if (m.includes('Valter')) count++;
      });
    });
  });
  console.log("Aparicoes do Valter em Abril após re-gerar:", count);
})
.catch(console.error);
