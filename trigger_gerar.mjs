fetch('http://localhost:3000/api/escala/gerar?paroquia=Par%C3%B3quia%20Santa%20Rita%20de%20C%C3%A1ssia&mes=6&ano=2026', { method: 'POST' })
.then(r => r.json())
.then(console.log)
.catch(console.error);
