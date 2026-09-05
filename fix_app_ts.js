import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  '| "welcome"',
  '| "welcome"\n    | "lider_painel"'
);

const newAlert = `onAlert={(titulo, mensagem) => {
              if (typeof titulo === "object" && titulo !== null) {
                const obj = titulo as any;
                customConfirm(obj.title || obj.titulo || "Aviso", obj.message || obj.mensagem, obj.onConfirm, obj.onCancel);
                return;
              }
              customConfirm(titulo, mensagem || "", () => {});
            }}`;

content = content.replace(/onAlert=\{handleAlert\}/g, newAlert);

fs.writeFileSync('src/App.tsx', content);
console.log('done');
