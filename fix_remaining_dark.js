import fs from 'fs';
let content = fs.readFileSync('src/components/LiderMissaCard.tsx', 'utf8');

// The h3 Relatorio da Celebração
content = content.replace(/<h3 className="text-lg font-black text-white mt-0\.5">Relatório da Celebração<\/h3>/g, '<h3 className="text-lg font-black text-slate-900 mt-0.5">Relatório da Celebração</h3>');

// The Marcar Falta button
content = content.replace(/className="px-2\.5 py-1 bg-red-900 hover:bg-red-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"/g, 'className="px-2.5 py-1 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"');

// The Justificativa input
content = content.replace(/className="w-full bg-red-950\/80 border border-red-800 text-xs text-white placeholder-red-300\/50 rounded-lg px-3 py-1\.5 focus:outline-none focus:ring-1 focus:ring-red-400"/g, 'className="w-full bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"');

fs.writeFileSync('src/components/LiderMissaCard.tsx', content);
console.log('done');
