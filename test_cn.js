const https = require('https');

https.get('https://liturgia.cancaonova.com/pb/?sDia=16&sMes=04&sAno=2026', (res) => {
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => {
    const idx = data.indexOf('Evangelho (');
    console.log(data.substring(idx - 100, idx + 200).replace(/\n/g, ' '));
  });
}).on("error", (err) => console.log("Error: " + err.message));
