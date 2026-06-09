import fetch from 'node-fetch';

async function run() {
  const url = 'http://localhost:3000/api/missas-temporarias?paroquia=' + encodeURIComponent('44.454.312/0027-80');
  const res = await fetch(url);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

run();
