import React, { useState } from 'react';
import { AuditLog, UserType } from '../types';
import { ShieldCheck, Search, SlidersHorizontal, Filter, RefreshCw, Layers } from 'lucide-react';

interface LogsViewProps {
  logs: AuditLog[];
}

export default function LogsView({ logs }: LogsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' ? true : log.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="border-b border-gray-100 pb-5">
        <h2 className="text-xl font-bold text-slate-900">Rastreabilidade Operacional (Trilhas de Auditoria)</h2>
        <p className="text-xs text-slate-500 mt-1">
          Registro infalsificável de todas as movimentações de filas, atualizações de cadastros e uploads para conformidade de auditorias.
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-150 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-gray-700">Filtros de Auditoria</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Pesquisa */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar termo ou operador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-gray-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white"
            />
          </div>

          {/* Filtro do Perfil */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 border border-gray-200 text-xs rounded-lg p-1.5"
          >
            <option value="ALL">Todas as funções</option>
            <option value="ADMIN">Administrador</option>
            <option value="RECEPCIONISTA">Recepção</option>
            <option value="ATENDENTE">Atendentes</option>
            <option value="VISTORIADOR">Vistoriadores</option>
          </select>
        </div>

      </div>

      {/* Lista Principal de Logs */}
      <div className="bg-white rounded-xl border border-gray-150 shadow-xs overflow-hidden">
        
        <div className="bg-slate-50 p-3 border-b border-gray-100 flex justify-between items-center">
          <span className="text-xxs font-bold text-slate-500 uppercase tracking-widest block">Registro Cronológico ({filteredLogs.length})</span>
          <span className="text-xxs text-slate-400 font-semibold italic">Atualizações em tempo real</span>
        </div>

        <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-100">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-xs text-gray-400">
              Nenhuma ação registrada para os filtros selecionados.
            </div>
          ) : (
            filteredLogs.map(log => (
              <div key={log.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-start gap-4">
                
                {/* Indicador visual por papel */}
                <div className={`mt-0.5 px-2 py-0.5 rounded font-extrabold text-[10px] w-24 text-center shrink-0 ${
                  log.role === 'ADMIN' ? 'bg-amber-100 text-amber-800' :
                  log.role === 'RECEPCIONISTA' ? 'bg-blue-100 text-blue-850' :
                  log.role === 'ATENDENTE' ? 'bg-emerald-100 text-emerald-850' :
                  'bg-purple-100 text-purple-850'
                }`}>
                  {log.role}
                </div>

                <div className="flex-1 text-xs">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-bold text-slate-800 text-sm">{log.user}</span>
                    <span className="text-gray-400 font-mono text-[10px]">{log.timestamp}</span>
                  </div>
                  
                  <div className="text-indigo-900 font-bold mb-0.5 text-wrap">{log.action}</div>
                  <p className="text-gray-500 leading-relaxed text-wrap">{log.details}</p>
                </div>

              </div>
            ))
          )}
        </div>

        <div className="p-3 bg-slate-50/50 border-t border-gray-100 text-center text-xxs text-gray-500">
          🚨 Registros assinados criptograficamente. Alterações diretas no banco disparam alertas no console do compliance.
        </div>

      </div>

    </div>
  );
}
