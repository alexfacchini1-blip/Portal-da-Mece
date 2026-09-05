import React from "react";
import { ChevronLeft, ShieldCheck, Lock, Eye, FileText } from "lucide-react";

interface PrivacyViewProps {
  voltar?: () => void;
}

export const PrivacyView: React.FC<PrivacyViewProps> = ({ voltar }) => {
  return (
    <div className="bg-slate-50 min-h-screen w-full flex flex-col p-4 sm:p-8 font-sans">
      <div className="max-w-3xl mx-auto w-full space-y-8">
        <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Política de Privacidade
            </h1>
          </div>
          {voltar && (
            <button
              onClick={voltar}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </button>
          )}
        </div>

        <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-200 space-y-10">
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">1. Coleta de Informações</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-sm">
              Coletamos apenas as informações necessárias para a gestão das escalas litúrgicas e comunicação interna entre a coordenação e os ministros. Isso inclui seu nome, telefone, data de nascimento e vínculo paroquial.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">2. Uso das Informações</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-sm">
              Seus dados são utilizados exclusivamente para:
            </p>
            <ul className="list-disc list-inside text-slate-600 text-sm space-y-2 ml-2 font-medium">
              <li>Organização das escalas de celebrações.</li>
              <li>Envio de notificações sobre trocas e avisos paroquiais através do sistema.</li>
              <li>Identificação nas listas de ministros disponíveis para a comunidade.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">3. Proteção e Segurança</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-sm">
              Implementamos medidas de segurança para proteger seus dados contra acessos não autorizados. Suas senhas de acesso são restritas e o acesso ao painel administrativo é limitado exclusivamente aos coordenadores e administradores do sistema.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">4. Exclusão de Dados</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-sm">
              Você pode solicitar a exclusão de sua conta e de todos os dados associados a qualquer momento entrando em contato com a coordenação de sua paróquia ou através das configurações do seu perfil.
            </p>
          </section>

          <div className="pt-10 border-t border-slate-100 italic text-slate-400 text-[11px] text-center">
            Última atualização: 11 de Junho de 2026. <br />
            App: Escala de Ministros
          </div>
        </div>
      </div>
    </div>
  );
};
