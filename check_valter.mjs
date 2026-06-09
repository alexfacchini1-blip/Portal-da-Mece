import { readFileSync } from 'fs';
fetch('http://localhost:3000/api/admin/ministros?paroquia=Par%C3%B3quia%20Santa%20Rita%20de%20C%C3%A1ssia')
.then(r => r.json())
.then(ministros => {
    const valter = ministros.find(m => m.nome.toLowerCase().includes('valter') || (m.nomeConjuge && m.nomeConjuge.toLowerCase().includes('valter')));
    if (!valter) return;
    return fetch('http://localhost:3000/api/disponibilidade?paroquia=Par%C3%B3quia%20Santa%20Rita%20de%20C%C3%A1ssia')
      .then(r => r.json())
      .then(disps => {
         const hisDisps = disps.filter(d => String(d.ministro_id) === String(valter.id));
         console.log(hisDisps[0].disponibilidade);
      });
})
.catch(e => console.error(e));
