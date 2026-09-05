const fs = require('fs');

const scraped = JSON.parse(fs.readFileSync('prayers_scraped.json', 'utf-8'));

// Some ids map to existing categories, let's try to map them
const categoryMap = {
  "pai-nosso": "diaria",
  "ave-maria": "mariana",
  "gloria-ao-pai": "diaria",
  "simbolo-dos-apostolos": "diaria",
  "salve-rainha": "mariana",
  "angelus--a-trindades-": "mariana",
  "rainha-do-ceu-": "mariana",
  "magnificat": "mariana",
  "ao-anjo-da-guarda": "diaria",
  "acto-de-contricao": "diaria",
  "veni-creator-spiritus": "espirito-santo",
  "alma-de-cristo": "diaria",
  "oracao-a-sao-jose": "outras",
  "vem--espirito-santo": "espirito-santo",
  "te-deum": "outras",
  "lembrai-vos": "mariana",
  "a-vossa-protecao": "mariana",
  "sao-miguel-arcanjo": "outras",
  "dai-lhes--senhor--o-eterno-descanso": "outras",
  "terco-da-divina-misericordia": "outras",
  "benedictus": "diaria"
};

const tsFileContent = `export interface Prayer {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  category: "diaria" | "mariana" | "espirito-santo" | "outras";
}

export const prayers: Prayer[] = ${JSON.stringify(scraped.map(p => ({
  id: p.id,
  title: p.title,
  content: p.content,
  category: categoryMap[p.id] || "outras"
})), null, 2)};
`;

fs.writeFileSync('src/data/prayers.ts', tsFileContent);
