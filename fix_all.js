import fs from 'fs';
let content = fs.readFileSync('src/components/LiderMissaCard.tsx', 'utf8');

// The rewrite will change classes to light mode explicitly for section 1 to 4
content = content.replace(/bg-slate-900\/80 p-4 rounded-xl border border-slate-800 mb-4 space-y-3/g, 'bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 space-y-3');
content = content.replace(/border-slate-800 pb-2/g, 'border-slate-200 pb-2');
content = content.replace(/text-slate-200/g, 'text-slate-700');

content = content.replace(/bg-slate-800 text-slate-700 hover:bg-red-950\/80 hover:text-red-300 hover:border-red-800 border border-slate-700/g, 'bg-white text-slate-700 hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-200');

content = content.replace(/text-red-400 uppercase tracking-widest bg-red-950 px-2 py-1 rounded-lg border border-red-800\/60/g, 'text-red-600 uppercase tracking-widest bg-red-50 px-2 py-1 rounded-lg border border-red-200');

content = content.replace(/border-red-900\/60/g, 'border-red-100');

// Section 2
content = content.replace(/bg-slate-900\/80 p-4 rounded-xl border border-slate-800 mb-4 space-y-2/g, 'bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 space-y-2');
content = content.replace(/text-amber-600/g, 'text-blue-500'); // make icons match a clean theme
content = content.replace(/text-blue-400/g, 'text-blue-500');

content = content.replace(/bg-slate-950\/90 border border-slate-800 rounded-xl px-3 py-2\.5 text-xs text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400/g, 'bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400');
content = content.replace(/bg-slate-950\/90 border border-slate-800 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 leading-relaxed/g, 'bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400 leading-relaxed');

// Section 4
content = content.replace(/bg-slate-900\/80 p-4 rounded-xl border border-slate-800 mb-5 space-y-2/g, 'bg-slate-50 p-4 rounded-xl border border-slate-200 mb-5 space-y-2');
content = content.replace(/bg-slate-950\/90 border border-slate-800 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-400 leading-relaxed/g, 'bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400 leading-relaxed');


fs.writeFileSync('src/components/LiderMissaCard.tsx', content);
console.log('done');
