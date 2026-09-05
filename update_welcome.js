import fs from 'fs';

let content = fs.readFileSync('src/components/WelcomeView.tsx', 'utf8');

const regex = /\{\s*activeLeaderAssignment \? \(\s*<div className="space-y-4">\s*<div className="p-4 bg-amber-50\/40 border border-amber-100 rounded-2xl flex gap-3 text-amber-900">\s*<Info className="w-5 h-5 text-amber-600 shrink-0 mt-0\.5" \/>\s*<p className="text-xs text-slate-600 leading-relaxed font-sans">\s*Informe apenas as faltas clicando no botão <strong className="text-red-600">"Marcar Falta"<\/strong> ao lado do nome do ministro ausente\. Os demais estarão com presença confirmada por padrão\.\s*<\/p>\s*<\/div>\s*<LiderMissaCard\s*assign=\{activeLeaderAssignment\}\s*user=\{user\}\s*onAlert=\{onAlert\}\s*onReportSubmitted=\{\(dateStr, timeStr\) => \{\s*handleReportSubmitted\(dateStr, timeStr\);\s*setShowLiderModal\(false\);\s*\}\}\s*\/>\s*<\/div>\s*\) : \(\s*<div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-500">\s*<Flag className="w-8 h-8 text-slate-300 mx-auto mb-2" \/>\s*<p className="text-xs font-bold uppercase tracking-widest text-slate-400">\s*Você não está escalado como Líder neste final de semana\s*<\/p>\s*<p className="text-\[11px\] text-slate-400 mt-1">\s*O formulário de relatório ficará disponível automaticamente 2 dias antes da sua escala\.\s*<\/p>\s*<\/div>\s*\)\s*\}/gs;

const replacement = `
            {activeLeaderAssignment ? (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-2xl flex gap-3 text-amber-900">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">
                      Informe apenas as faltas clicando no botão <strong className="text-red-600">"Marcar Falta"</strong> ao lado do nome do ministro ausente. Os demais estarão com presença confirmada por padrão.
                    </p>
                  </div>

                  <LiderMissaCard
                    assign={activeLeaderAssignment}
                    user={user}
                    onAlert={onAlert}
                    onReportSubmitted={(dateStr, timeStr) => {
                      handleReportSubmitted(dateStr, timeStr);
                      setShowLiderModal(false);
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <LiderMissaCard
                    isPreview={true}
                    assign={{
                      date: new Date().toISOString().split('T')[0],
                      horario: "--:--",
                      nome: "Missa de Exemplo",
                      lider: user.nomeExibicao || user.nome,
                      ministros: []
                    }}
                    user={user}
                    onAlert={onAlert}
                  />
                </div>
              )}
`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/components/WelcomeView.tsx', content);
console.log('done');
