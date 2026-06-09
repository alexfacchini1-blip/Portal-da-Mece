fetch('http://localhost:3000/api/config?paroquia=Par%C3%B3quia%20Santa%20Rita%20de%20C%C3%A1ssia')
.then(r => r.json())
.then(data => {
  console.log("Config:", data);
})
.catch(console.error);
