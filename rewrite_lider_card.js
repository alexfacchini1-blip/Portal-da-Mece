import fs from 'fs';
let content = fs.readFileSync('src/components/LiderMissaCard.tsx', 'utf8');

// The rewrite will change classes to light mode
content = content.replace(/className="bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 rounded-2xl p-5 md:p-6 text-white shadow-xl border border-blue-800\/80 my-4 relative overflow-hidden"/g, 'className="bg-white rounded-2xl p-5 md:p-6 text-slate-800 shadow-sm border border-slate-200 my-4 relative overflow-hidden"');

// Preview banner
content = content.replace(/className="mb-6 p-4 bg-amber-400\/10 border border-amber-400\/30 rounded-xl flex gap-3 text-amber-200"/g, 'className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-blue-900"');
content = content.replace(/className="w-5 h-5 text-amber-400 shrink-0 mt-0\.5"/g, 'className="w-5 h-5 text-blue-500 shrink-0 mt-0.5"');
content = content.replace(/<strong className="text-amber-400">/g, '<strong className="text-blue-700">');

// Remove decorative circles
content = content.replace(/<div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500\/10 rounded-full blur-2xl pointer-events-none"><\/div>/g, '');
content = content.replace(/<div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-500\/10 rounded-full blur-2xl pointer-events-none"><\/div>/g, '');

// Header Badge area
content = content.replace(/border-blue-800\/60/g, 'border-slate-100');
content = content.replace(/bg-amber-400\/20 text-amber-300 p-2 rounded-xl border border-amber-400\/30/g, 'bg-blue-50 text-blue-600 p-2 rounded-xl border border-blue-100');
content = content.replace(/text-amber-300/g, 'text-blue-600');
content = content.replace(/bg-amber-400 text-blue-950/g, 'bg-blue-100 text-blue-700');
content = content.replace(/text-emerald-300 border border-emerald-500\/40/g, 'text-emerald-700 border border-emerald-200');

// Titles
content = content.replace(/<h3 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">/g, '<h3 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">');
content = content.replace(/text-blue-200/g, 'text-slate-500');

// Notice box
content = content.replace(/bg-blue-900\/40 border border-blue-800\/60 rounded-xl text-blue-100/g, 'bg-slate-50 border border-slate-200 rounded-xl text-slate-600');
content = content.replace(/text-amber-400/g, 'text-amber-600'); // for the flag icon inside notice

// Faltas list
content = content.replace(/text-amber-300 text-xs font-bold uppercase tracking-widest/g, 'text-slate-700 text-xs font-bold uppercase tracking-widest');
content = content.replace(/bg-amber-400\/10 text-amber-300 border-amber-400\/20/g, 'bg-amber-50 text-amber-700 border-amber-200');

// Map rows
content = content.replace(/!hasFaltou\s*\?\s*"bg-slate-800\/40 border-slate-700\/40"\s*:\s*"bg-red-950\/40 border-red-800\/60 text-red-100"/g, '!hasFaltou ? "bg-white border-slate-200 hover:border-slate-300" : "bg-red-50 border-red-200 text-red-900"');
content = content.replace(/text-slate-100/g, 'text-slate-800');
content = content.replace(/bg-amber-400\/20 text-amber-300/g, 'bg-amber-100 text-amber-700');
content = content.replace(/border-amber-400\/30/g, 'border-amber-200');
content = content.replace(/text-slate-400/g, 'text-slate-500');
content = content.replace(/bg-red-500\/20 text-red-300 hover:bg-red-500\/30/g, 'bg-red-100 text-red-700 hover:bg-red-200');

// Inputs and textareas
content = content.replace(/bg-slate-900\/50 border border-slate-700 text-slate-100/g, 'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none');

// Sections
content = content.replace(/<ShieldCheck className="w-4 h-4 text-emerald-400" \/>/g, '<ShieldCheck className="w-4 h-4 text-emerald-500" />');
content = content.replace(/text-slate-300/g, 'text-slate-700');
content = content.replace(/text-amber-400/g, 'text-amber-500');

// Footer Button
content = content.replace(/bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500\/30/g, 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200');
content = content.replace(/bg-amber-400 hover:bg-amber-300 text-blue-950 shadow-amber-400\/20/g, 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20');
content = content.replace(/border-blue-950/g, 'border-white');

fs.writeFileSync('src/components/LiderMissaCard.tsx', content);
console.log('done');
