import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{\(targetUser\?\.isLider \|\| targetUser\?\.isLiderConjuge\) && \(/g;
const replacement = `{((targetUser?.tipo === 'casal' && targetUser?.isConjugeLogin) ? targetUser?.isLiderConjuge : targetUser?.isLider) && (`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', content);
console.log('done');
