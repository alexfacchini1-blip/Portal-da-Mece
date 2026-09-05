import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const isLiderUser = useMemo\(\(\) => \{\s*if \(\!user\) return false;\s*\/\/\ 1\. Check profile flags\s*if \(user\.isLider \|\| user\.isLiderConjuge\) return true;\s*\/\/\ 2\. Check if ever listed as a leader in ANY mass in the current scale\s*if \(escala\) \{\s*const normalizeStr = \(s: string\) => s \? String\(s\)\.normalize\("NFD"\)\.replace\(\/\[\\u0300-\\u036f\]\/g, ""\)\.toLowerCase\(\)\.trim\(\) : "";\s*const currentUserNames = \[\s*user\.nome,\s*user\.nomeExibicao,\s*user\.nomeConjuge,\s*user\.nomeExibicaoConjuge,\s*user\.nomeExibicaoConjuge \|\| user\.nomeConjuge,\s*user\.nomeExibicao \|\| user\.nome\s*\]\.filter\(Boolean\)\.map\(normalizeStr\);/gs;

const replacement = `const isLiderUser = useMemo(() => {
    if (!user) return false;
    // 1. Check profile flags
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

content = content.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', content);

// WelcomeView.tsx
let wvContent = fs.readFileSync('src/components/WelcomeView.tsx', 'utf8');
const wvRegex = /const isLiderUser = useMemo\(\(\) => \{\s*\/\/\ 1\. Check profile flags\s*if \(user\.isLider \|\| user\.isLiderConjuge\) return true;\s*\/\/\ 2\. Check if ever listed as a leader in ANY mass in the current scale\s*if \(escala\) \{\s*const normalizeStr = \(s: string\) => s \? String\(s\)\.normalize\("NFD"\)\.replace\(\/\[\\u0300-\\u036f\]\/g, ""\)\.toLowerCase\(\)\.trim\(\) : "";\s*const currentUserNames = \[\s*user\.nome,\s*user\.nomeExibicao,\s*user\.nomeConjuge,\s*user\.nomeExibicaoConjuge,\s*user\.nomeExibicaoConjuge \|\| user\.nomeConjuge,\s*\/\/\ Supporting various fields\s*user\.nomeExibicao \|\| user\.nome\s*\]\.filter\(Boolean\)\.map\(normalizeStr\);/gs;

const wvReplacement = `const isLiderUser = useMemo(() => {
    // 1. Check profile flags
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

wvContent = wvContent.replace(wvRegex, wvReplacement);
fs.writeFileSync('src/components/WelcomeView.tsx', wvContent);
console.log('done');
