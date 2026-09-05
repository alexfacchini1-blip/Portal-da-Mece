import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');
const lines = code.split('\n');

for (let i = 2880; i < 12000; i++) {
  if (lines[i] && lines[i].includes('isCoordenador')) {
     lines[i] = lines[i].replace(/isCoordenador/g, 'isActualCoord');
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'));
