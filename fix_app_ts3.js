import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const \[view, setView\] = useState<string>\("login"\); \/\/ [\s\S]*?\("welcome"\);/;
content = content.replace(regex, 'const [view, setView] = useState<string>("welcome");');

fs.writeFileSync('src/App.tsx', content);
console.log('done');
