fetch('http://localhost:3000/api/escala?preview=true&paroquia=Par%C3%B3quia%20Santa%20Rita%20de%20C%C3%A1ssia')
.then(r => r.json())
.then(data => {
  const escala = data;
  let hasValter = false;
  Object.keys(escala).forEach(date => {
     if (!date.startsWith('2026-05')) return;
     Object.keys(escala[date]).forEach(horario => {
       const missa = escala[date][horario];
       if (missa && missa.ministros) {
        missa.ministros.forEach(m => {
           const name = m.nomeExibicao || m.nome || JSON.stringify(m);
           if (name.toLowerCase().includes('valter') || name.toLowerCase().includes('cristiane')) {
              console.log(`Valter/Cristiane in ${date} ${horario}`);
              hasValter = true;
           }
        });
       }
     });
  });
  if (!hasValter) console.log("Not found in GET /escala");
})
.catch(console.error);
