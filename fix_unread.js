import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /let isLider = \!\!\(user\.isLider \|\| user\.isLiderConjuge\);/g;
const replacement = `const isLoggedAsConjuge = user.tipo === 'casal' && user.isConjugeLogin;
    let isLider = isLoggedAsConjuge ? !!user.isLiderConjuge : !!user.isLider;`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', content);
console.log('done');
