import util from 'util';

fetch('http://localhost:3000/api/disponibilidade?paroquia=Par%C3%B3quia%20Santa%20Rita%20de%20C%C3%A1ssia')
.then(r => r.json())
.then(data => {
  const valterDisp = data.filter(d => d.ministro_id === '25' || d.ministro_id === 25)[0];
  console.log("Valter Disp:", util.inspect(valterDisp.disponibilidade, { depth: null }));
})
.catch(console.error);
