import React, { useEffect, useState } from 'react';
import { CallLog, Client, EventConfig } from '../types';
import { 
  Tv, Volume2, VolumeX, Users, ArrowBigRightDash, 
  DoorClosed, Clock, Sparkles, AlertCircle, Building2,
  Home, Key, Building, Award, ShieldCheck
} from 'lucide-react';

interface TvPanelViewProps {
  activeCalls: CallLog[];
  clients: Client[];
  eventConfig?: EventConfig;
}

const renderLogoIcon = (iconName: string) => {
  switch (iconName) {
    case 'Home': return <Home className="w-10 h-10 text-rose-500" />;
    case 'Key': return <Key className="w-10 h-10 text-rose-500" />;
    case 'Building': return <Building className="w-10 h-10 text-rose-500" />;
    case 'Award': return <Award className="w-10 h-10 text-rose-500" />;
    case 'ShieldCheck': return <ShieldCheck className="w-10 h-10 text-rose-500" />;
    case 'Sparkles': return <Sparkles className="w-10 h-10 text-rose-500" />;
    default: return <Building2 className="w-10 h-10 text-rose-500" />;
  }
};

export default function TvPanelView({ activeCalls, clients, eventConfig }: TvPanelViewProps) {
  const currentCall = activeCalls.find(c => c.status === 'CHAMANDO') || activeCalls[0];
  const previousCalls = activeCalls.filter(c => c.id !== currentCall?.id).slice(0, 4);

  const waitingAtendCount = clients.filter(c => c.status === 'FILA_ATENDIMENTO').length;
  const waitingVistCount = clients.filter(c => c.status === 'FILA_VISTORIA').length;

  const [blink, setBlink] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Função para tocar som de teste e iniciar AudioContext (vencer bloqueio do browser)
  const enableAudioAndTriggerTest = () => {
    setAudioEnabled(true);
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const testMsg = new SpeechSynthesisUtterance("Áudio do painel ativado com sucesso!");
        testMsg.lang = 'pt-BR';
        testMsg.rate = 1.1;
        window.speechSynthesis.speak(testMsg);
      }
    } catch (e) {
      console.warn("Falha de teste de áudio:", e);
    }
  };

  // Efeito sonoro fake / piscar quando muda a chamada
  useEffect(() => {
    if (currentCall) {
      setBlink(true);
      
      // Som Chime "Ding-Dong" Hospitalar
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Ding (High note)
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        gain1.gain.setValueAtTime(0.12, audioCtx.currentTime);
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
          gain2.gain.setValueAtTime(0.12, audioCtx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
          osc2.start();
          osc2.stop(audioCtx.currentTime + 0.5);
        }, 250);

        // Voice speech call announcements if enabled
        if (audioEnabled && 'speechSynthesis' in window) {
          setTimeout(() => {
            try {
              window.speechSynthesis.cancel();
              const text = `Senha de atendimento, ${currentCall.clienteNome}. Favor comparecer ao ${currentCall.localDestino || 'local indicado'}.`;
              const msg = new SpeechSynthesisUtterance(text);
              msg.lang = 'pt-BR';
              msg.rate = 1.05;
              window.speechSynthesis.speak(msg);
            } catch (errSpeech) {
              console.warn("Speech Synthesis blocked:", errSpeech);
            }
          }, 900);
        }

      } catch (e) {
        console.log("Audio ding simulado", e);
      }

      const timerIdx = setTimeout(() => {
        setBlink(false);
      }, 3500);

      return () => clearTimeout(timerIdx);
    }
  }, [currentCall?.id, audioEnabled]);

  return (
    <div className="bg-slate-950 text-white min-h-[90vh] flex flex-col justify-between p-6">
      
      {/* Banner de permissão de áudio para vencer autoplay policy */}
      {!audioEnabled && (
        <div 
          onClick={enableAudioAndTriggerTest}
          className="bg-amber-500 hover:bg-amber-450 text-slate-950 font-extrabold text-[11px] sm:text-xs text-center py-2.5 px-4 rounded-xl mb-4 flex items-center justify-center gap-2 cursor-pointer transition-all animate-bounce shadow-md"
        >
          <VolumeX className="w-4 h-4 text-slate-950 animate-pulse" />
          <span>O som do painel está desativado pelo navegador. CLIQUE AQUI para habilitar o Ding-Dong e chamadas de voz automáticas em português!</span>
        </div>
      )}
      
      {/* Header do Painel */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs gap-4">
        {/* Branding Empreendimento */}
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center shrink-0">
            {eventConfig && eventConfig.logoType === 'URL' && eventConfig.logoUrl ? (
              <img 
                src={eventConfig.logoUrl} 
                className="h-16 w-16 object-contain rounded-md" 
                alt="Logo do Empreendimento"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              renderLogoIcon(eventConfig?.logoIconName || 'Building2')
            )}
          </div>
          <div>
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest font-mono block">Painel de Chamadas Ativas</span>
            <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-white uppercase select-none leading-tight">
              {eventConfig?.enterpriseName || "Residencial Canto das Flores"}
            </h1>
          </div>
        </div>

        {/* Live Indicator & Informações */}
        <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto border-t md:border-t-0 border-slate-800/60 pt-3 md:pt-0">
          <div className="text-left md:text-right text-xxs text-gray-400 space-y-0.5">
            <span className="block font-bold text-slate-300 font-mono uppercase tracking-wider">
              {eventConfig?.eventDate || "23 de Maio de 2026"}
            </span>
            <span className="flex items-center md:justify-end gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              CONGRESSO DE ENTREGA DE CHAVES
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="bg-rose-650/40 text-rose-450 font-bold text-[10px] px-2.5 py-1.5 rounded-lg border border-rose-500/30 flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              TV DISCORD
            </span>
            <span className="bg-emerald-600/25 text-emerald-400 font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg border border-emerald-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              ATIVO
            </span>
          </div>
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
