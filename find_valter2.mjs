fetch('http://localhost:3000/api/admin/ministros?paroquia=Par%C3%B3quia%20Santa%20Rita%20de%20C%C3%A1ssia')
.then(r => r.json())
.then(data => {
  const valter = data.find(m => (m.nome && m.nome.includes('Valter')) || (m.nomeConjuge && m.nomeConjuge.includes('Valter')));
  console.log("Valter encontrado:", valter);
})
.catch(console.error);
