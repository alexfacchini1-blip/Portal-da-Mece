const fs = require('fs');

async function main() {
  const urls = [
    '/pt/oracoes/a-vossa-protecao.html',
    '/pt/oracoes/acto-de-caridade.html',
    '/pt/oracoes/acto-de-contricao.html',
    '/pt/oracoes/alma-de-cristo.html',
    '/pt/oracoes/angelus--a-trindades-.html',
    '/pt/oracoes/ao-anjo-da-guarda.html',
    '/pt/oracoes/ato-de-consagracao-ao-imaculado-coracao-de-maria.html',
    '/pt/oracoes/ave-maria.html',
    '/pt/oracoes/benedictus.html',
    '/pt/oracoes/comunhao-spiritual.html',
    '/pt/oracoes/simbolo-dos-apostolos.html',
    '/pt/oracoes/dai-lhes--senhor--o-eterno-descanso.html',
    '/pt/oracoes/gloria-ao-pai.html',
    '/pt/oracoes/lembrai-vos.html',
    '/pt/oracoes/magnificat.html',
    '/pt/oracoes/oracao-a-sagrada-familia.html',
    '/pt/oracoes/oracao-a-sao-jose.html',
    '/pt/oracoes/pai-nosso.html',
    '/pt/oracoes/rainha-do-ceu-.html',
    '/pt/oracoes/rosario.html',
    '/pt/oracoes/salve-rainha.html',
    '/pt/oracoes/sao-miguel-arcanjo.html',
    '/pt/oracoes/te-deum.html',
    '/pt/oracoes/terco-da-divina-misericordia.html',
    '/pt/oracoes/vem--espirito-santo.html',
    '/pt/oracoes/veni-creator-spiritus.html'
  ];

  const prayers = [];
  
  for (const path of urls) {
    const res = await fetch('https://www.vaticannews.va' + path);
    const html = await res.text();
    
    let title = "";
    const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    if (titleMatch) {
      title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
    } else {
      title = path.split('/').pop().replace('.html', '').replace(/-/g, ' ');
    }
    
    let content = "";
    const bodyMatch = html.match(/"articleBody":\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
    if (bodyMatch) {
       content = JSON.parse('"' + bodyMatch[1] + '"').trim();
    } else {
       // fallback
       const pMatch = html.match(/<h1[^>]*>[\s\S]*?<\/h1>\s*<p>([\s\S]*?)<\/p>/);
       if (pMatch) {
         content = pMatch[1].replace(/<br\s*\/?>/ig, '\n').replace(/<[^>]+>/g, '').trim();
       }
    }
    
    content = content.replace(/\u00a0/g, ' '); // replace nbsp

    const id = path.split('/').pop().replace('.html', '');
    prayers.push({ id, title, content });
  }
  
  fs.writeFileSync('prayers_scraped.json', JSON.stringify(prayers, null, 2));
}

main().catch(console.error);
