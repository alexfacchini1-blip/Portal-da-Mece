import os

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update header label and icon in the subTab header
text = text.replace(
    '''                            {subTab === "gestao" && (
                              <Calendar className="w-5 h-5 text-blue-600" />
                            )}
                            {subTab === "editar_disponibilidade" && (
                              <Edit className="w-5 h-5 text-blue-600" />
                            )}''',
    '''                            {subTab === "gestao" && (
                              <Calendar className="w-5 h-5 text-blue-600" />
                            )}
                            {subTab === "gerar_escala" && (
                              <Zap className="w-5 h-5 text-blue-600" />
                            )}
                            {subTab === "editar_disponibilidade" && (
                              <Edit className="w-5 h-5 text-blue-600" />
                            )}'''
)

text = text.replace(
    '''                              {subTab === "gestao" && "Gestão de Escala"}
                              {subTab === "editar_disponibilidade" &&
                                "Editar Disponibilidade"}''',
    '''                              {subTab === "gestao" && "Gestão de Escala (Regras e Horários)"}
                              {subTab === "gerar_escala" && "Gerar Escala (Geração e Exportação)"}
                              {subTab === "editar_disponibilidade" &&
                                "Editar Disponibilidade"}'''
)

# 2. Update the Grid in Gestão da Escala to 6 items
old_grid_head = '<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">'
new_grid_head = '<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">'
text = text.replace(old_grid_head, new_grid_head)

old_opt_4 = '''                          {/* Option 4: Gestão de Escala */}
                          <button
                            onClick={() => setSubTab("gestao")}
                            className="flex flex-col items-center justify-center text-center p-4 rounded-2xl transition-all duration-300 relative border border-slate-200/80 hover:border-blue-400 bg-white hover:bg-blue-50/20 text-slate-800 cursor-pointer hover:shadow-lg hover:-translate-y-1 aspect-square"
                          >
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-2.5 transition-all duration-300 bg-blue-50 text-blue-600">
                              <Calendar className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <span className="text-[11px] sm:text-[13px] font-black leading-tight tracking-tight text-slate-900 line-clamp-2 px-1">
                              Gestão de Escala
                            </span>
                            <span className="text-[8px] sm:text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wider leading-none block">
                              Configurar
                            </span>
                          </button>'''

new_opt_4_and_5 = '''                          {/* Option 4: Gestão de Escala */}
                          <button
                            onClick={() => setSubTab("gestao")}
                            className="flex flex-col items-center justify-center text-center p-4 rounded-2xl transition-all duration-300 relative border border-slate-200/80 hover:border-blue-400 bg-white hover:bg-blue-50/20 text-slate-800 cursor-pointer hover:shadow-lg hover:-translate-y-1 aspect-square"
                          >
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-2.5 transition-all duration-300 bg-blue-50 text-blue-600">
                              <Calendar className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <span className="text-[11px] sm:text-[13px] font-black leading-tight tracking-tight text-slate-900 line-clamp-2 px-1">
                              Gestão de Escala
                            </span>
                            <span className="text-[8px] sm:text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wider leading-none block">
                              Configurar Regras
                            </span>
                          </button>
                          {/* Option 5: Gerar Escala */}
                          <button
                            onClick={() => setSubTab("gerar_escala")}
                            className="flex flex-col items-center justify-center text-center p-4 rounded-2xl transition-all duration-300 relative border border-slate-200/80 hover:border-blue-400 bg-white hover:bg-blue-50/20 text-slate-800 cursor-pointer hover:shadow-lg hover:-translate-y-1 aspect-square"
                          >
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-2.5 transition-all duration-300 bg-blue-50 text-blue-600">
                              <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500" />
                            </div>
                            <span className="text-[11px] sm:text-[13px] font-black leading-tight tracking-tight text-slate-900 line-clamp-2 px-1">
                              Gerar Escala
                            </span>
                            <span className="text-[8px] sm:text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wider leading-none block">
                              Geração e PDF
                            </span>
                          </button>'''

if old_opt_4 in text:
    text = text.replace(old_opt_4, new_opt_4_and_5)
    print("Option 4 and 5 replaced in menu!")

# Find Gestão Rápida Cards inside gestao view and extract it
marker_start = '{/* Gestão Rapida Cards */}'
marker_end = '{subTab === "editar_disponibilidade" && ('

idx1 = text.find(marker_start)
idx2 = text.find(marker_end)
print("idx1:", idx1, "idx2:", idx2)

if idx1 != -1 and idx2 != -1:
    gestao_rapida_code = text[idx1:idx2]
    # Remove it from gestao tab
    text_before = text[:idx1]
    text_after = text[idx2:]
    
    # Trim ending of gestao tab
    text_before = text_before.rstrip() + '\n                      </div>\n                    </>\n                  )}\n'
    
    # Create the dedicated subTab === "gerar_escala" view
    new_subtab_view = '''                  {subTab === "gerar_escala" && (
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
                          onClick={() => setShowPanoramaModal(true)}
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
                  )}\n'''

    text = text_before + new_subtab_view + text_after
    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print("App.tsx transformed successfully!")
