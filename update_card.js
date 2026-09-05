import fs from 'fs';
let content = fs.readFileSync('src/components/LiderMissaCard.tsx', 'utf8');

// Add isPreview to the interface
content = content.replace(/interface LiderMissaCardProps \{/, 'interface LiderMissaCardProps {\n  isPreview?: boolean;');

// Extract the prop
content = content.replace(/onReportSubmitted \}\) => \{/, 'onReportSubmitted, isPreview = false }) => {');

// Add the banner and conditionally hide team members
content = content.replace(/return \(\s*<div className="bg-gradient-to-br/, `return (
    <div className="bg-gradient-to-br`);

const renderTopReplacement = `
  return (
    <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 rounded-2xl p-5 md:p-6 text-white shadow-xl border border-blue-800/80 my-4 relative overflow-hidden">
      {isPreview && (
        <div className="mb-6 p-4 bg-amber-400/10 border border-amber-400/30 rounded-xl flex gap-3 text-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs font-medium leading-relaxed font-sans">
            <strong className="text-amber-400">MODO DE VISUALIZAÇÃO:</strong> Você não está escalado como Líder neste final de semana. Aproveite para conhecer o formulário! O botão de enviar está desativado.
          </p>
        </div>
      )}
`;

content = content.replace(/return \(\s*<div className="bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 rounded-2xl p-5 md:p-6 text-white shadow-xl border border-blue-800\/80 my-4 relative overflow-hidden">/, renderTopReplacement);

// Hide section 1 if isPreview
const section1Regex = /\{\/\* 1\. Faltas \*\/\}\s*<div className="space-y-3">/;
content = content.replace(section1Regex, `
        {/* 1. Faltas */}
        {!isPreview && (
          <div className="space-y-3">
`);

const section2Regex = /\{\/\* 2\. Trocas não informadas \*\/\}/;
content = content.replace(section2Regex, `
          </div>
        )}
        
        {/* 2. Trocas não informadas */}
`);

// Disable submit button
const btnClassRegex = /className=\{\`px-5 py-2\.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg \$\{/g;
content = content.replace(btnClassRegex, `className={\`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg \${isPreview ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'} \${`);

const btnDisabledRegex = /disabled=\{loading\}/g;
content = content.replace(btnDisabledRegex, 'disabled={loading || isPreview}');

fs.writeFileSync('src/components/LiderMissaCard.tsx', content);
console.log('done');
