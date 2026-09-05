const fs = require('fs');

function fixIsLiderUser(content) {
  const regex = /const isLiderUser = useMemo\(\(\) => \{\s*if \(\!user\) return false;\s*\/\/\ 1\. Check profile flags\s*if \(user\.isLider \|\| user\.isLiderConjuge\) return true;\s*\/\/\ 2\. Check if ever listed as a leader in ANY mass in the current scale\s*if \(escala\) \{\s*const normalizeStr = \(s: string\) => s \? String\(s\)\.normalize\("NFD"\)\.replace\(\/\[\\u0300-\\u036f\]\/g, ""\)\.toLowerCase\(\)\.trim\(\) : "";\s*const currentUserNames = \[\s*user\.nome,\s*user\.nomeExibicao,\s*user\.nomeConjuge,\s*user\.nomeExibicaoConjuge,\s*user\.nomeExibicaoConjuge \|\| user\.nomeConjuge,\s*\/\/\ Supporting various fields\s*user\.nomeExibicao \|\| user\.nome\s*\]\.filter\(Boolean\)\.map\(normalizeStr\);/gs;

  const replacement = `const isLiderUser = useMemo(() => {
    if (!user) return false;
    
    // 1. Check profile flags strictly based on who is logged in
    const isLoggedAsConjuge = user.tipo === 'casal' && user.isConjugeLogin;
    if (isLoggedAsConjuge) {
      if (user.isLiderConjuge) return true;
    } else {
      if (user.isLider) return true;
    }
    
    // 2. Check if ever listed as a leader in ANY mass in the current scale
    if (escala) {
      const normalizeStr = (s: string) => s ? String(s).normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().trim() : "";
      
      let currentUserNames: string[] = [];
      if (isLoggedAsConjuge) {
        currentUserNames = [user.nomeConjuge, user.nomeExibicaoConjuge].filter(Boolean).map(normalizeStr);
      } else {
        currentUserNames = [user.nome, user.nomeExibicao].filter(Boolean).map(normalizeStr);
      }`;

  return content.replace(regex, replacement);
}

['src/App.tsx', 'src/components/WelcomeView.tsx'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = fixIsLiderUser(content);
  // for WelcomeView which doesn't have "if (!user) return false;" inside
  const regex2 = /const isLiderUser = useMemo\(\(\) => \{\s*\/\/\ 1\. Check profile flags\s*if \(user\.isLider \|\| user\.isLiderConjuge\) return true;\s*\/\/\ 2\. Check if ever listed as a leader in ANY mass in the current scale\s*if \(escala\) \{\s*const normalizeStr = \(s: string\) => s \? String\(s\)\.normalize\("NFD"\)\.replace\(\/\[\\u0300-\\u036f\]\/g, ""\)\.toLowerCase\(\)\.trim\(\) : "";\s*const currentUserNames = \[\s*user\.nome,\s*user\.nomeExibicao,\s*user\.nomeConjuge,\s*user\.nomeExibicaoConjuge,\s*user\.nomeExibicaoConjuge \|\| user\.nomeConjuge,\s*\/\/\ Supporting various fields\s*user\.nomeExibicao \|\| user\.nome\s*\]\.filter\(Boolean\)\.map\(normalizeStr\);/gs;
  
  const replacement2 = `const isLiderUser = useMemo(() => {
    if (!user) return false;
    // 1. Check profile flags strictly based on who is logged in
    const isLoggedAsConjuge = user.tipo === 'casal' && user.isConjugeLogin;
    if (isLoggedAsConjuge) {
      if (user.isLiderConjuge) return true;
    } else {
      if (user.isLider) return true;
    }
    
    // 2. Check if ever listed as a leader in ANY mass in the current scale
    if (escala) {
      const normalizeStr = (s: string) => s ? String(s).normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().trim() : "";
      
      let currentUserNames: string[] = [];
      if (isLoggedAsConjuge) {
        currentUserNames = [user.nomeConjuge, user.nomeExibicaoConjuge].filter(Boolean).map(normalizeStr);
      } else {
        currentUserNames = [user.nome, user.nomeExibicao].filter(Boolean).map(normalizeStr);
      }`;
  newContent = newContent.replace(regex2, replacement2);
  
  // App.tsx has another one without // Supporting various fields
  const regex3 = /const isLiderUser = useMemo\(\(\) => \{\s*if \(\!user\) return false;\s*\/\/\ 1\. Check profile flags\s*if \(user\.isLider \|\| user\.isLiderConjuge\) return true;\s*\/\/\ 2\. Check if ever listed as a leader in ANY mass in the current scale\s*if \(escala\) \{\s*const normalizeStr = \(s: string\) => s \? String\(s\)\.normalize\("NFD"\)\.replace\(\/\[\\u0300-\\u036f\]\/g, ""\)\.toLowerCase\(\)\.trim\(\) : "";\s*const currentUserNames = \[\s*user\.nome,\s*user\.nomeExibicao,\s*user\.nomeConjuge,\s*user\.nomeExibicaoConjuge,\s*user\.nomeExibicaoConjuge \|\| user\.nomeConjuge,\s*user\.nomeExibicao \|\| user\.nome\s*\]\.filter\(Boolean\)\.map\(normalizeStr\);/gs;
  newContent = newContent.replace(regex3, replacement);
  
  fs.writeFileSync(file, newContent);
});
console.log('done');
