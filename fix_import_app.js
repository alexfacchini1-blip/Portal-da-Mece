import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  'import { createPortal } from "react-dom";',
  'import { createPortal } from "react-dom";\nimport LiderView from "./components/LiderView";'
);

fs.writeFileSync('src/App.tsx', content);
console.log('done');
