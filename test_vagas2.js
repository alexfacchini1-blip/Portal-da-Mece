const http = require('http');

http.get('http://127.0.0.1:3000/api/vagas?paroquia=Cristo%20Rei&mes=5&ano=2026', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("Vagas API response:", data);
  });
}).on('error', (err) => {
  console.error("Error:", err.message);
});
