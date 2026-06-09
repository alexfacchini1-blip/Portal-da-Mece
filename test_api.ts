
async function test() {
  const url = 'http://localhost:3000/api/config?paroquia=' + encodeURIComponent('Paróquia Santa Rita de Cássia');
  const res = await fetch(url);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
test().catch(console.error);
