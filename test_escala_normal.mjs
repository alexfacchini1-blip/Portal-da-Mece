fetch('http://localhost:3000/api/escala?paroquia=Par%C3%B3quia%20Santa%20Rita%20de%20C%C3%A1ssia')
.then(r => r.json())
.then(data => {
  console.log("Returned dates:", Object.keys(data));
})
.catch(console.error);
