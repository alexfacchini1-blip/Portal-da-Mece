import * as cheerio from 'cheerio';

async function testScrape() {
  const url = 'https://www.vaticannews.va/pt/palavra-do-dia/2026/05/17.html';
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);

  let evangelhoRef = '';
  const sections = $('section');
  sections.each((i, el) => {
    const heading = $(el).find('h1, h2, h3').text().trim();
    if (heading.includes('Evangelho')) {
      const pText = [];
      $(el).find('.section__content p').each((j, p) => pText.push($(p).text().trim()));
      if (pText.length >= 2) {
         evangelhoRef = pText[0] + ' ' + pText[1];
      }
    }
  });

  console.log('REF:', evangelhoRef);
}

testScrape();
