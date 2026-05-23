import React, { useState } from 'react';
import { Client, PriorityType } from '../types';
import { Search, MapPin, User, CheckCircle2, UserCheck, Accessibility, Clock, AlertCircle } from 'lucide-react';

interface RecepcaoViewProps {
  clients: Client[];
  onCheckIn: (clientId: string, possuiProcurador: boolean, priority: PriorityType, observacoes: string) => void;
}

export default function RecepcaoView({ clients, onCheckIn }: RecepcaoViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [possuiProcurador, setPossuiProcurador] = useState(false);
  const [priority, setPriority] = useState<PriorityType>('NORMAL');
  const [notes, setNotes] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Filtrar apenas clientes que ainda não fizeram check-in ou estão aguardando recepção
  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setPossuiProcurador(client.possuiProcurador);
    setPriority(client.priority);
    setNotes(client.observacoes || '');
  };

  const filteredClients = clients.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      (c.nome.toLowerCase().includes(term) ||
      (c.cpf && c.cpf.includes(term)) ||
      c.unidade.toLowerCase().includes(term)) &&
      c.status === 'AGUARDANDO_RECEPCAO'
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    onCheckIn(selectedClient.id, possuiProcurador, priority, notes);
    
    // Limpar formulário de check-in
    setSelectedClient(null);
    setNotes('');
    setPossuiProcurador(false);
    setPriority('NORMAL');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-gray-100 pb-5">
        <h2 className="text-xl font-bold text-slate-900">Módulo de Recepção Presencial</h2>
        <p className="text-xs text-slate-500 mt-1">
          Localize o comprador na base, registre a presença presencial dele e direcione-o imediatamente para a fila de atendimento documental.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Lado Esquerdo: Busca de Clientes Pendentes */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-4">
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 text-sm">Passo 1: Encontrar Comprador Agendado</h3>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisa por Nome, CPF ou Unidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {filteredClients.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-lg text-xs text-gray-400">
                {searchTerm ? 'Nenhum comprador pendente encontrado com este critério.' : 'Todos os compradores já passaram ou estão em atendimento.'}
              </div>
            ) : (
              filteredClients.map(client => (
                <div
                  key={client.id}
                  onClick={() => handleClientSelect(client)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    selectedClient?.id === client.id
                      ? 'bg-indigo-50/70 border-indigo-500 shadow-xs'
                      : 'bg-white border-gray-100 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800 block text-sm">{client.nome}</span>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-500">
                      <span>CPF: {client.cpf}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-600">{client.empreendimento} - {client.unidade}</span>
                    </div>
                  </div>
                  
                  <button className="bg-slate-100 text-slate-700 text-xxs font-bold px-2 py-1 rounded hover:bg-indigo-600 hover:text-white transition-colors">
                    Selecionar
                  </button>
                </div>
              ))
            )}
          </div>
          
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-150 text-xxs leading-relaxed text-amber-800 flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              <strong>Nota Importante de Escopo:</strong> Eventuais atualizações cadastrais de e-mail, telefone, entrega de documentos ou preenchimento de procuradores devem ser executadas pelo <strong>Atendente Interno</strong> após a roleta de chamada.
            </span>
          </div>
        </div>

        {/* Lado Direito: Registro de Presença Rápidas */}
        <div className="lg:col-span-5">
          {selectedClient ? (
            <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <span className="text-xxs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded uppercase">Registro de Chegada</span>
                <h3 className="font-bold text-slate-800 text-base mt-1">{selectedClient.nome}</h3>
                <span className="text-xs text-gray-500 block">{selectedClient.empreendimento} • {selectedClient.bloco} - {selectedClient.unidade}</span>
              </div>

              {/* Toggle de Procurador */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Possui Procurador?</label>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <button
                    type="button"
                    onClick={() => setPossuiProcurador(true)}
                    className={`py-2 px-3 border rounded-lg font-bold text-xs cursor-pointer transition-all ${
                      possuiProcurador ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-gray-200'
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setPossuiProcurador(false)}
                    className={`py-2 px-3 border rounded-lg font-bold text-xs cursor-pointer transition-all ${
                      !possuiProcurador ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-gray-200'
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>

              {/* Configurações de Prioridade */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Nível de Prioridade da Fila</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'NORMAL', label: '🚶 Normal' },
                    { value: 'IDOSO', label: '👴 Idoso (60+)' },
                    { value: 'PCD', label: '♿ PCD' },
                    { value: 'GESTANTE', label: '🤰 Gestante' }
                  ].map((pOpt) => (
                    <button
                      key={pOpt.value}
                      type="button"
                      onClick={() => setPriority(pOpt.value as PriorityType)}
                      className={`text-xs p-2 rounded-lg border text-left cursor-pointer font-medium transition-all ${
                        priority === pOpt.value
                          ? 'bg-amber-100 text-amber-900 border-amber-400 font-bold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-gray-250'
                      }`}
                    >
                      {pOpt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Observações Rápidas */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Observação Opcional (Recepção)</label>
                <textarea
                  rows={2}
                  maxLength={100}
                  placeholder="Ex: Chegou acompanhado, com pressa, etc..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white resize-none"
                />
              </div>

              {/* Botão de Enviar */}
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-lg font-bold text-xs inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <UserCheck className="w-4 h-4" />
                Registrar e Enviar para Fila de Espera
              </button>
            </form>
          ) : (
            <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-gray-250 flex flex-col items-center justify-center text-center h-[360px]">
              <div className="p-4 bg-white rounded-full shadow-xxs border border-gray-100 text-indigo-500 mb-3">
                <Accessibility className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Ficha de Triagem Pronta</h3>
              <p className="text-xxs text-gray-500 max-w-xs mt-1">
                Selecione um comprador comprador na lista ao lado para iniciar e registrar o check-in na portaria do evento.
              </p>
            </div>
          )}

          {/* Histórico Recente de Presenças */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs mt-4">
            <h4 className="text-xs font-bold text-slate-700 border-b border-gray-100 pb-2 mb-2">Compradores Já Processados</h4>
            <div className="space-y-1">
              {clients.filter(c => c.status !== 'AGUARDANDO_RECEPCAO').slice(0, 3).map(clientItem => (
                <div key={clientItem.id} className="flex justify-between items-center text-[10px] text-gray-500 py-1 bg-slate-50/50 px-2 rounded mt-1.5">
                  <span className="font-bold text-slate-800">{clientItem.nome} ({clientItem.unidade})</span>
                  <div className="flex items-center gap-1.5">
                    <span className="bg-indigo-50 text-indigo-700 text-xxs font-semibold px-1 rounded">
                      {clientItem.status === 'FILA_ATENDIMENTO' ? 'Fila Atendimento' : 'Adiantado'}
                    </span>
                    <span className="font-mono text-gray-400">{clientItem.tempoChegadaRecepcao || '16:00'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
