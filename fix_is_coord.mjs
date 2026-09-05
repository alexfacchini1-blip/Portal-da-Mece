import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');
const lines = code.split('\n');

for (let i = 2800; i < 2900; i++) {
  if (lines[i].includes('const isCoordenador = isCoordenadorProp || isCoordenadorInitial;')) {
    lines[i] = lines[i].replace('const isCoordenador =', 'const isActualCoord =');
  }
}

for (let i = 17140; i < 17160; i++) {
  if (lines[i] && lines[i].includes('isCoordenador={isCoordenadorGlobal}')) {
     lines[i] = ''; // we added this line twice, just clear one
     break;
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'));
