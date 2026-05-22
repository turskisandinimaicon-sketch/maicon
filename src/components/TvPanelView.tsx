import React, { useEffect, useState } from 'react';
import { CallLog, Client } from '../types';
import { 
  Tv, Volume2, Users, ArrowBigRightDash, 
  DoorClosed, Clock, Sparkles, AlertCircle, Building2
} from 'lucide-react';

interface TvPanelViewProps {
  activeCalls: CallLog[];
  clients: Client[];
}

export default function TvPanelView({ activeCalls, clients }: TvPanelViewProps) {
  const currentCall = activeCalls.find(c => c.status === 'CHAMANDO') || activeCalls[0];
  const previousCalls = activeCalls.filter(c => c.id !== currentCall?.id).slice(0, 4);

  const waitingAtendCount = clients.filter(c => c.status === 'FILA_ATENDIMENTO').length;
  const waitingVistCount = clients.filter(c => c.status === 'FILA_VISTORIA').length;

  const [blink, setBlink] = useState(false);
  const [audioPlayed, setAudioPlayed] = useState(false);

  // Efeito sonoro fake / piscar quando muda a chamada
  useEffect(() => {
    if (currentCall) {
      setBlink(true);
      
      // Simulação auditiva usando o oscilador do navegador para som de chamada hospitalar "ding-dong" de fato!
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Ding (High note)
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        gain1.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc1.start();
        osc1.stop(audioCtx.currentTime + 0.4);

        // Dong (Lower note after 0.25 seconds)
        setTimeout(() => {
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(392.00, audioCtx.currentTime); // G4
          gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
          osc2.start();
          osc2.stop(audioCtx.currentTime + 0.5);
        }, 250);

      } catch (e) {
        console.log("Audio ding simulado", e);
      }

      const timerIdx = setTimeout(() => {
        setBlink(false);
      }, 3500);

      return () => clearTimeout(timerIdx);
    }
  }, [currentCall?.id]);

  return (
    <div className="bg-slate-950 text-white min-h-[90vh] flex flex-col justify-between p-6">
      
      {/* Header do Painel */}
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-600/20 text-rose-500 rounded-lg">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight uppercase">Painel de Chamadas Integradas</h1>
            <span className="text-[10px] text-gray-400 font-mono">Evento Geral de Entrega de Unidades</span>
          </div>
        </div>

        {/* Live Indicator */}
        <div className="flex items-center gap-4">
          <div className="text-right text-xxs text-gray-400">
            <span className="block font-bold text-slate-300">Residencial Canto das Flores</span>
            <span>22 de Maio de 2026</span>
          </div>
          <span className="bg-rose-600/30 text-rose-400 font-bold text-[10px] px-2.5 py-1 rounded border border-rose-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            ONLINE
          </span>
        </div>
      </div>

      {/* Grid Central */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 flex-1 items-stretch">
        
        {/* Bloco Esquerdo: Chamada Principal (Super Destacada) */}
        <div className="lg:col-span-8 flex flex-col justify-center items-center">
          {currentCall ? (
            <div className={`w-full h-full bg-slate-900/45 rounded-2xl border-2 flex flex-col justify-between p-10 transition-all text-center ${
              blink 
                ? 'bg-indigo-950 border-indigo-500 shadow-indigo-100/10 scale-[1.01] animate-pulse' 
                : 'border-slate-800'
            }`}>
              
              <div className="flex items-center justify-center gap-2 text-indigo-400">
                <Volume2 className="w-6 h-6 animate-bounce" />
                <span className="text-sm font-bold uppercase tracking-widest font-mono">Chamando Agora</span>
              </div>

              <div className="py-8 space-y-4">
                <h2 className="text-4xl sm:text-5.5xl font-black font-sans text-slate-100 tracking-tight leading-none uppercase max-w-2xl mx-auto break-words select-none">{currentCall.clienteNome}</h2>
                <div className="text-3xl font-black text-rose-500 tracking-normal select-none uppercase">
                  UNIDADE {currentCall.unidade}
                </div>
              </div>

              {/* Destino guichê */}
              <div className="bg-slate-900 border border-slate-850 py-5 px-8 rounded-xl max-w-md mx-auto w-full">
                <span className="text-[11px] text-gray-500 block uppercase font-mono">Dirija-se ao local</span>
                <span className="text-3xl font-black text-emerald-400 animate-pulse">{currentCall.localDestino}</span>
                <span className="text-xxs text-gray-400 block mt-1">Conferência Técnica / {currentCall.responsavelNome}</span>
              </div>

            </div>
          ) : (
            <div className="w-full h-full bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-10">
              <span className="text-gray-600 block text-sm">Aguardando chamada de compradores...</span>
              <span className="text-xxs text-gray-500 max-w-xs mt-1">Os atendentes e vistoriadores enviarão chamadas neste visor quando estiverem disponíveis.</span>
            </div>
          )}
        </div>


        {/* Bloco Direito: Chamadas Anteriores / Monitoramento Auxiliar */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-6">
          
          {/* Histórico Anterior */}
          <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl flex-1 flex flex-col justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-850 pb-2 mb-3">Últimas Chamadas</h3>
            
            <div className="space-y-4 flex-1">
              {previousCalls.length === 0 ? (
                <div className="text-gray-600 text-xxs italic py-6">Sem chamadas recentes listadas.</div>
              ) : (
                previousCalls.map(p => (
                  <div key={p.id} className="flex justify-between items-center text-xs border-b border-slate-950 pb-3 last:border-none">
                    <div>
                      <span className="font-bold text-slate-100 block truncate max-w-[150px] uppercase text-sm">{p.clienteNome}</span>
                      <span className="text-slate-500 block text-xxs font-semibold">Unidade {p.unidade}</span>
                    </div>
                    
                    <div className="bg-slate-950 px-3 py-1 rounded text-right">
                      <span className="font-bold text-emerald-400 block font-mono">{p.localDestino}</span>
                      <span className="text-[9px] text-gray-500">{p.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Fila Total Rodapé */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-indigo-950/40 p-4 rounded-xl border border-indigo-900/20 text-center">
              <span className="block font-bold text-4xl text-indigo-400 font-mono">{waitingAtendCount}</span>
              <span className="text-xxs text-gray-400">Em espera Documental</span>
            </div>
            <div className="bg-purple-950/40 p-4 rounded-xl border border-purple-900/20 text-center">
              <span className="block font-bold text-4xl text-purple-400 font-mono">{waitingVistCount}</span>
              <span className="text-xxs text-gray-400">Em espera Vistoria</span>
            </div>
          </div>

        </div>

      </div>

      {/* Footer Informações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between text-xxs text-slate-400 pt-3 border-t border-slate-900 gap-2">
        <span className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-rose-500 animate-pulse" />
          Se o seu nome for anunciado, dirija-se imediatamente com seus documentos RG/CPF em mãos.
        </span>
        <span className="font-semibold text-slate-500">Desenvolvido sob padrões operacionais do evento.</span>
      </div>

    </div>
  );
}
