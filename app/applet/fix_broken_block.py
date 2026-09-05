with open('src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the broken gerar_escala block with the correct code
gerar_target = '''                  {subTab === "gerar_escala" && (
                    <div className="p-6 space-y-6">
                      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
                            <span>Coordenação</span>
                            <span>•</span>
                            <span>Ações de Escala</span>
                          </div>
                          <h2 className="text-xl font-black text-slate-900 tracking-tight">
                            Geração e Publicação da Escala
                          </h2>
                          <p className="text-xs text-slate-500 font-medium">
                            Abra o envio de disponibilidade, calcule as distribuições com motor inteligente, confira as missas e exporte o PDF.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* 1. Abrir/Fechar Disponibilidade */}
                        <button
                          onClick={handleToggleDisponibilidade}
                          className={`${disponibilidadeAberta ? "bg-blue-100 hover:bg-blue-200 text-blue-700" : "bg-blue-50/70 hover:bg-blue-100 text-slate-900 shadow-sm border border-blue-200"} p-5 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all group cursor-pointer`}
                        >
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${disponibilidadeAberta ? "bg-blue-200/50" : "bg-blue-100 text-blue-600"}`}
                          >
                            <Unlock className="w-6 h-6" />
                          </div>
                          <div className="text-center">
                            <h4 className="font-bold text-sm tracking-tight">
                              {disponibilidadeAberta
                                ? "Fechar Disponibilidade"
                                : "Abrir Disponibilidade"}
                            </h4>
                            <p
                              className={`text-[9px] font-bold uppercase ${disponibilidadeAberta ? "text-blue-600/70" : "text-slate-400"}`}
                            >
                              {manualOverride !== undefined
                                ? "Modo Manual"
                                : "Automático"}
                            </p>
                          </div>
                        </button>

                        {/* 2. Gerar Escala */}
                        <button
                          onClick={handleGerarEscala}
                          className="bg-slate-900 hover:bg-slate-800 text-white p-5 rounded-3xl shadow-lg shadow-slate-100 flex flex-col items-center justify-center gap-3 transition-all group cursor-pointer"
                        >
                          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Zap className="w-6 h-6 text-amber-400" />
                          </div>
                          <div className="text-center">
                            <h4 className="font-bold text-sm tracking-tight">
                              Gerar Escala
                            </h4>
                            <p className="text-[9px] text-white/50 font-bold uppercase">
                              Cálculo Inteligente
                            </p>
                          </div>
                        </button>

                        {/* 3. Visualizar Escala (conferência) */}
                        <button
                          onClick={handleAbrirConferencia}
                          className="bg-white hover:bg-slate-50 text-slate-900 p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3 transition-all group cursor-pointer"
                        >
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Calendar className="w-6 h-6" />
                          </div>
                          <div className="text-center">
                            <h4 className="font-bold text-sm tracking-tight text-blue-700">
                              Visualizar Escala (conferência)
                            </h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">
                              Painel de Conferência
                            </p>
                          </div>
                        </button>

                        {/* 4. Baixar PDF */}
                        <button
                          onClick={handleDownloadPDF}
                          className="bg-white hover:bg-slate-50 text-slate-900 p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3 transition-all group cursor-pointer"
                        >
                          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Download className="w-6 h-6" />
                          </div>
                          <div className="text-center">
                            <h4 className="font-bold text-sm tracking-tight">
                              Baixar PDF
                            </h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">
                              Exportar
                            </p>
                          </div>
                        </button>

                        {/* 5. Panorama */}
                        <button
                          onClick={setShowPanoramaModal ? () => setShowPanoramaModal(true) : () => {}}
                          className="bg-white hover:bg-slate-50 text-slate-900 p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3 transition-all group cursor-pointer"
                        >
                          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Eye className="w-6 h-6" />
                          </div>
                          <div className="text-center">
                            <h4 className="font-bold text-sm tracking-tight">
                              Panorama
                            </h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">
                              Visão Geral
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}'''

start_g = text.find('{subTab === "gerar_escala" && (')
end_g = text.find('{subTab === "editar_disponibilidade" && (', start_g)

if start_g != -1 and end_g != -1:
    text = text[:start_g] + gerar_target + '\n                  ' + text[end_g:]
    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Fixed gerar_escala section!")
else:
    print("Could not find boundaries")
