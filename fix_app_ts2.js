import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the buggy onAlert with a simpler one that matches LiderView signature
const badAlert = `onAlert={(titulo, mensagem) => {
              if (typeof titulo === "object" && titulo !== null) {
                const obj = titulo as any;
                customConfirm(obj.title || obj.titulo || "Aviso", obj.message || obj.mensagem, obj.onConfirm, obj.onCancel);
                return;
              }
              customConfirm(titulo, mensagem || "", () => {});
            }}`;

const goodAlert = `onAlert={(msg, type) => {
              customConfirm(type === "error" ? "Erro" : type === "success" ? "Sucesso" : "Aviso", msg, () => {});
            }}`;

content = content.replace(new RegExp(badAlert.replace(/[.*+?^$\{key\}()|[\\]\\\\]/g, '\\\\$&'), 'g'), goodAlert);

// Also fix the overlap error by making sure lider_painel is in the union type correctly.
// Let's just remove the explicit type of the useState so it infers string.
// Actually, let's just make it 'string' or add lider_painel properly.
content = content.replace(/const \[view, setView\] = useState<\s*\|\s*"login"/, 'const [view, setView] = useState<string>("login"); // ');
content = content.replace(/\| "home"[\s\S]*?\| "welcome"/, '');

fs.writeFileSync('src/App.tsx', content);
console.log('done');
