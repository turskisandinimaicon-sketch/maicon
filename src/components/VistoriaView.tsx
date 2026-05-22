import React, { useState, useEffect } from 'react';
import { Client, User } from '../types';
import { 
  CheckCircle, Play, CheckCircle2, Sliders, AlertTriangle, HelpCircle,
  ThumbsUp, UserCheck, Star, Sparkles, Clock, MapPin, KeyRound, AlertOctagon, ArrowUpRight
} from 'lucide-react';

interface VistoriaViewProps {
  currentOperator: User;
  clients: Client[];
  onCallNext: (operatorId: string, type: 'VISTORIA') => void;
  onUpdateOperatorStatus: (userId: string, status: string) => void;
  onFinishInspection: (clientId: string, data: { clientSatisfaction: number, satisfactionComment: string }) => void;
}

export default function VistoriaView({
  currentOperator,
  clients,
  onCallNext,
  onUpdateOperatorStatus,
  onFinishInspection
}: VistoriaViewProps) {
  // Encontrar se o operador tem algum cliente em 'EM_VISTORIA'atualmente
  const activeClient = clients.find(c => c.status === 'EM_VISTORIA' && c.vistoriadorId === currentOperator.id);
  
  // Clientes aptos restando na fila de vistoria de unidades
  const waitingCount = clients.filter(c => c.status === 'FILA_VISTORIA').length;

  // Estado do formulario de entrega final
  const [satisfaction, setSatisfaction] = useState(5);
  const [comment, setComment] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);

  // Relogio Timer para simular duração da Vistoria da unidade
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (activeClient) {
      interval = setInterval(() => {
        setSeconds(prev => {
          if (prev >= 59) {
            setMinutes(m => m + 1);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setMinutes(0);
      setSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeClient]);

  const handleFinishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient) return;

    onFinishInspection(activeClient.id, {
      clientSatisfaction: satisfaction,
      satisfactionComment: comment
    });

    // Reset local state
    setComment('');
    setSatisfaction(5);
    setIsFinishing(false);
    alert(`Processo concluído e chaves entregues com sucesso! WhatsApp disparado para ${activeClient.nome}.`);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      {/* Box Control de Disponibilidade do Vistoriador */}
      <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div className="space-y-1">
          <span className="text-xxs font-bold text-indigo-400 font-mono tracking-wider uppercase">Operador de Vistoria Técnico</span>
          <h2 className="text-lg font-bold font-sans">{currentOperator.name} — <span className="text-yellow-400">{currentOperator.deskNumber || 'Área Livre'}</span></h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Seu status atual na roleta:</span>
            <span className={`px-1.5 py-0.2 rounded-full font-extrabold text-[10px] ${
              currentOperator.status === 'DISPONIVEL' ? 'bg-emerald-500/20 text-emerald-400' :
              currentOperator.status === 'EM_VISTORIA' ? 'bg-purple-500/20 text-purple-400' :
              'bg-amber-500/20 text-amber-400'
            }`}>
              {currentOperator.status === 'DISPONIVEL' ? '● LIVRE (ENTROU NA ROLETA)' : 
               currentOperator.status === 'EM_VISTORIA' ? '● VISTORIANDO UNIDADE' : '● INDISPONÍVEL / EM PAUSA'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle de Disponibilidade */}
          <select
            value={currentOperator.status}
            onChange={(e) => onUpdateOperatorStatus(currentOperator.id, e.target.value)}
            className="bg-slate-850 text-xs py-2 px-3 rounded-lg border border-slate-700 text-white cursor-pointer font-semibold outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="DISPONIVEL">Estou Livre / Entrar Roleta</option>
            <option value="INDISPONIVEL">Pausar Distribuição Automática</option>
          </select>

          {/* Chamada Automática do Próximo Apt na Fila */}
          <button
            onClick={() => onCallNext(currentOperator.id, 'VISTORIA')}
            disabled={currentOperator.status !== 'DISPONIVEL' || activeClient !== undefined || waitingCount === 0}
            className={`px-4 py-2 font-bold text-xs rounded-lg inline-flex items-center gap-2 cursor-pointer transition-all ${
              activeClient !== undefined || currentOperator.status !== 'DISPONIVEL'
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : waitingCount === 0
                ? 'bg-slate-800 text-slate-400 hover:bg-slate-755 border border-slate-705'
                : 'bg-indigo-505 bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg'
            }`}
          >
            🔊 Chamar Próxima Unidade ({waitingCount})
          </button>
        </div>
      </div>

      {activeClient ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Lado Esquerdo: Dados da Unidade e Atendimento em Andamento */}
          <div className="md:col-span-8 bg-white rounded-xl border border-gray-150 p-5 space-y-6 shadow-xs">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-4 gap-2">
              <div>
                <span className="text-xxs bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded border border-purple-200 uppercase">Em Vistoria Conjunta</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{activeClient.nome}</h3>
                <span className="text-xs text-slate-500">{activeClient.empreendimento} • <span className="font-bold text-slate-800">{activeClient.bloco} - {activeClient.unidade}</span></span>
              </div>

              {/* Real-time walkthrough timer */}
              <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-center font-mono border border-slate-800 min-w-[120px]">
                <span className="text-xxs text-slate-500 block">Tempo Corrido</span>
                <span className="text-lg font-bold">
                  {minutes < 10 ? `0${minutes}` : minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                </span>
              </div>
            </div>

            {/* Informações se possui vistoriador próprio ou normal */}
            {activeClient.possuiVistoriadorProprio ? (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 space-y-2 text-xs">
                <span className="font-bold text-amber-900 block flex items-center gap-1">
                  ⭐ ATENÇÃO: Contratou Vistoriador Particular
                </span>
                <p className="text-amber-850">
                  O Proprietário contratou o profissional <strong>{activeClient.vistoriadorParticularNome}</strong> {activeClient.vistoriadorParticularCrea ? `(${activeClient.vistoriadorParticularCrea})` : ''} para assessorá-lo. 
                  Conduza os procedimentos com diligência especial ao responder questionamentos técnicos.
                </p>
              </div>
            ) : (
              <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 flex gap-2.5 text-xs text-indigo-800 items-baseline">
                <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <span className="font-bold block">Vistoriador do Condomínio Padrão</span>
                  <span>A vistoria está ocorrendo com nossa equipe interna técnica corporativa. Valide os revestimentos, infiltrações, portas e tomadas.</span>
                </div>
              </div>
            )}

            {/* Checklist Operacional Simplificada para o Vistoriador */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Passo-a-passo sugerido pelo laudo</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg flex gap-2">
                  <input type="checkbox" id="vcheck1" defaultChecked className="mt-0.5" />
                  <label htmlFor="vcheck1" className="cursor-pointer">
                    <span className="font-semibold text-slate-800 block">Acionamento Hidráulico</span>
                    <span className="text-[10px] text-gray-500 text-xxs">Chuveiros, torneiras e ralos</span>
                  </label>
                </div>
                
                <div className="p-3 bg-slate-50 rounded-lg flex gap-2">
                  <input type="checkbox" id="vcheck2" defaultChecked className="mt-0.5" />
                  <label htmlFor="vcheck2" className="cursor-pointer">
                    <span className="font-semibold text-slate-800 block">Testes Elétricos</span>
                    <span className="text-[10px] text-gray-500 text-xxs">Quadro elétrico e fiação</span>
                  </label>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg flex gap-2">
                  <input type="checkbox" id="vcheck3" defaultChecked className="mt-0.5" />
                  <label htmlFor="vcheck3" className="cursor-pointer">
                    <span className="font-semibold text-slate-800 block">Revestimentos e Pisos</span>
                    <span className="text-[10px] text-gray-500 text-xxs">Porcelanato e juntas internas</span>
                  </label>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg flex gap-2">
                  <input type="checkbox" id="vcheck4" defaultChecked className="mt-0.5" />
                  <label htmlFor="vcheck4" className="cursor-pointer">
                    <span className="font-semibold text-slate-800 block">Esquadrias e Pinturas</span>
                    <span className="text-[10px] text-gray-500 text-xxs">Aberturas, nivelamentos e acabamentos</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Observações da Vistoria */}
            <div className="pt-4 border-t border-gray-150 text-xs">
              <span className="font-semibold text-slate-800 block mb-1">Observações Operacionais Lançadas no Atendimento Documental:</span>
              <p className="bg-slate-50 p-3 rounded-lg text-slate-600 italic border border-slate-100">
                "{activeClient.observacoes || 'Nenhuma observação interna lançada pelo atendente.'}"
              </p>
            </div>

          </div>

          {/* Lado Direito: Finalização & Aceite de Entrega de Chaves */}
          <div className="md:col-span-4 bg-white rounded-xl border border-gray-150 p-4 shadow-xs space-y-4">
            
            {!isFinishing ? (
              <div className="text-center py-6 space-y-4">
                <div className="p-4 bg-purple-50 rounded-full border border-purple-100 max-w-fit mx-auto text-purple-600">
                  <KeyRound className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Vistoria Sem Pendências?</h4>
                  <p className="text-xxs text-gray-500 mt-1">Clique para registrar a conclusão técnica com o proprietário e liberar o chaveador.</p>
                </div>
                
                <button
                  onClick={() => setIsFinishing(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 px-3 rounded-lg text-xs cursor-pointer shadow-xs transition-colors"
                >
                  Concluir Entrega e Chaves
                </button>
              </div>
            ) : (
              <form onSubmit={handleFinishSubmit} className="space-y-4 text-xs animate-fade-in">
                <span className="font-bold text-slate-800 border-b border-gray-100 pb-2 block uppercase text-xxs">Conclusão do Processo</span>
                
                {/* Nota de Satisfação */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 block text-center">Pesquisa de Satisfação</label>
                  <div className="flex items-center justify-center gap-1.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSatisfaction(star)}
                        className="p-1 hover:scale-115 transition-all text-xl cursor-pointer"
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <span className="block text-center text-slate-500 text-xxs font-bold">Nota selecionada: {satisfaction} de 5</span>
                </div>

                {/* Comentário Satisfação */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Comentários Adicionais do Proprietário</label>
                  <textarea
                    rows={3}
                    placeholder="Feedback resumido colhido verbalmente com o comprador..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-xxs"
                  />
                </div>

                {/* Alerta de Automação */}
                <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded border border-emerald-150 text-[10px] leading-relaxed">
                  <strong>💡 Automação Automatizada Ativa:</strong> O sistema irá disparar um WhatsApp de imediato ao telefone do cliente contendo o contrato digital e o link do portal técnico.
                </div>

                {/* Submit */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFinishing(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-bold cursor-pointer transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-bold cursor-pointer shadow-sm transition-colors"
                  >
                    Gravar e Concluir
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>
      ) : (
        <div className="bg-slate-50 p-8 rounded-xl border border-dashed border-gray-250 flex flex-col items-center justify-center text-center h-[350px]">
          <div className="p-4 bg-white rounded-full shadow-xxs border border-gray-100 text-purple-500 mb-3 block">
            <Clock className="w-10 h-10" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Prédio Preparado p/ Vistoriadores</h3>
          <p className="text-xxs text-gray-500 max-w-sm mt-1">
            Defina seu status como <strong>"Estou Livre"</strong> e clique em <strong>"Chamar Próxima Unidade"</strong> para buscar o próximo morador da fila de vistorias aprovadas pela auditoria operacional.
          </p>
        </div>
      )}

    </div>
  );
}
