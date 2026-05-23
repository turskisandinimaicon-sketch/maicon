import React, { useState } from 'react';
import { Client, User, AuditLog, WhatsappMessage, OperationalAlert, EventConfig, Enterprise } from '../types';
import { 
  Users, Clock, CheckCircle, TrendingUp, AlertTriangle, 
  RefreshCw, Check, CheckCircle2, AlertOctagon, HelpCircle, ArrowUpRight,
  ShieldCheck, FileSpreadsheet, Plus, AlertCircle, Phone, Search, SlidersHorizontal,
  Edit2, Trash2, Home, Key, Building, Award, Sparkles, Building2, Eye, Shield, Upload
} from 'lucide-react';

interface DashboardViewProps {
  clients: Client[];
  users: User[];
  logs: AuditLog[];
  whatsappMessages: WhatsappMessage[];
  alerts: OperationalAlert[];
  onUpdateUserStatus: (userId: string, status: string) => void;
  onValidateLaudo: (clientId: string) => void;
  onResetDemo: () => void;
  onImportData: (importDataset: any[]) => void;
  eventConfig?: EventConfig;
  onUpdateEventConfig?: (config: Partial<EventConfig>) => Promise<boolean>;
  enterprises?: Enterprise[];
  onSaveEnterprise?: (id: string | null, name: string) => Promise<{ success: boolean; error?: string }>;
  onDeleteEnterprise?: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export default function DashboardView({
  clients,
  users,
  logs,
  whatsappMessages,
  alerts,
  onUpdateUserStatus,
  onValidateLaudo,
  onResetDemo,
  onImportData,
  eventConfig,
  onUpdateEventConfig,
  enterprises = [],
  onSaveEnterprise,
  onDeleteEnterprise
}: DashboardViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Estados locais para edição das configurações de Branding do Evento
  const [isConfiguringEvent, setIsConfiguringEvent] = useState(false);
  const [activeConfigTab, setActiveConfigTab] = useState<'BRANDING' | 'CATALOG'>('BRANDING');
  const [tempEnterpriseName, setTempEnterpriseName] = useState(eventConfig?.enterpriseName || "Residencial Canto das Flores");
  const [tempLogoType, setTempLogoType] = useState<'ICON' | 'URL'>(eventConfig?.logoType || 'ICON');
  const [tempLogoUrl, setTempLogoUrl] = useState(eventConfig?.logoUrl || '');
  const [tempLogoIconName, setTempLogoIconName] = useState(eventConfig?.logoIconName || 'Building2');
  const [tempEventDate, setTempEventDate] = useState(eventConfig?.eventDate || '23 de Maio de 2026');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Estados locais para edição do catálogo de empreendimentos
  const [editingEnterpriseId, setEditingEnterpriseId] = useState<string | null>(null);
  const [editingEnterpriseName, setEditingEnterpriseName] = useState('');
  const [newEnterpriseName, setNewEnterpriseName] = useState('');
  const [isSavingEnterprise, setIsSavingEnterprise] = useState(false);

  React.useEffect(() => {
    if (eventConfig) {
      setTempEnterpriseName(eventConfig.enterpriseName);
      setTempLogoType(eventConfig.logoType);
      setTempLogoUrl(eventConfig.logoUrl);
      setTempLogoIconName(eventConfig.logoIconName);
      setTempEventDate(eventConfig.eventDate);
    }
  }, [eventConfig]);

  const handleAddEnterprise = async () => {
    if (!newEnterpriseName.trim() || !onSaveEnterprise) return;
    setIsSavingEnterprise(true);
    const result = await onSaveEnterprise(null, newEnterpriseName.trim());
    setIsSavingEnterprise(false);
    if (result.success) {
      setNewEnterpriseName('');
    } else {
      alert(result.error || "Erro ao cadastrar empreendimento.");
    }
  };

  const handleUpdateEnterpriseLocal = async (id: string) => {
    if (!editingEnterpriseName.trim() || !onSaveEnterprise) return;
    setIsSavingEnterprise(true);
    const result = await onSaveEnterprise(id, editingEnterpriseName.trim());
    setIsSavingEnterprise(false);
    if (result.success) {
      setEditingEnterpriseId(null);
      setEditingEnterpriseName('');
    } else {
      alert(result.error || "Erro ao editar empreendimento.");
    }
  };

  const handleDeleteEnterpriseLocal = async (id: string) => {
    if (!onDeleteEnterprise) return;
    if (confirm("Deseja realmente excluir este empreendimento do catálogo?")) {
      setIsSavingEnterprise(true);
      const result = await onDeleteEnterprise(id);
      setIsSavingEnterprise(false);
      if (!result.success) {
        alert(result.error || "Erro ao excluir empreendimento.");
      }
    }
  };

  const handleSaveEventConfigLocal = async () => {
    if (!onUpdateEventConfig) return;
    setIsSavingConfig(true);
    const success = await onUpdateEventConfig({
      enterpriseName: tempEnterpriseName,
      logoType: tempLogoType,
      logoUrl: tempLogoUrl,
      logoIconName: tempLogoIconName,
      eventDate: tempEventDate
    });
    setIsSavingConfig(false);
    if (success) {
      setIsConfiguringEvent(false);
    } else {
      alert("Erro ao gravar novas configurações do empreendimento.");
    }
  };

  // Metricas baseadas em dados vivos
  const totalClients = clients.length;
  const waitingAtendCount = clients.filter(c => c.status === 'FILA_ATENDIMENTO').length;
  const emAtendimentoCount = clients.filter(c => c.status === 'EM_ATENDIMENTO').length;
  const waitingVistCount = clients.filter(c => c.status === 'FILA_VISTORIA').length;
  const emVistoriaCount = clients.filter(c => c.status === 'EM_VISTORIA').length;
  
  const waitingOwnInspector = clients.filter(c => c.status === 'AGUARDANDO_VISTORIADOR_PROPRIO').length;
  
  const completedCount = clients.filter(c => c.status === 'PROCESSO_ENCERRADO').length;
  const pendentesCount = clients.filter(c => c.status === 'PENDENTE').length;

  const laudosPendentesDeValidacao = clients.filter(c => 
    c.documentos.some(d => d.category === 'LAUDO_PARTICULAR') && c.status === 'PENDENTE'
  );

  // Filtro de lista
  const filteredClients = clients.filter(c => {
    const matchesSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.cpf.includes(searchTerm) || 
                          c.unidade.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' ? true : c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-sans tracking-tight text-slate-900">Dashboard Operacional</h1>
          <p className="text-sm text-slate-500">Monitoramento consolidado, roleta de equipes e métricas de desempenho em tempo real.</p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1.5 rounded-full font-semibold border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Transmissão Instantânea Ativa
          </span>
        </div>
      </div>

      {/* Seção de Configuração Dinâmica do Empreendimento Ativo */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 shadow-xxs">
        {!isConfiguringEvent ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-white border border-slate-200 rounded-lg shadow-xxs flex items-center justify-center p-1 text-slate-700 font-bold shrink-0">
                {eventConfig?.logoType === 'URL' && eventConfig.logoUrl ? (
                  <img 
                    src={eventConfig.logoUrl} 
                    className="h-10 w-10 object-contain rounded" 
                    alt="Logo do Empreendimento"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Building2 className="w-6 h-6 text-indigo-650 animate-pulse" />
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Empreendimento Ativo</span>
                <h2 className="text-sm font-bold text-slate-800 uppercase flex flex-wrap items-center gap-2">
                  {eventConfig?.enterpriseName || "Residencial Canto das Flores"}
                  <span className="bg-slate-200/70 text-slate-600 text-[9px] px-1.5 py-0.2 rounded-full font-mono font-medium">
                    {eventConfig?.eventDate || "23 de Maio de 2026"}
                  </span>
                </h2>
              </div>
            </div>
            
            <button
              id="btn-edit-active-event-branding"
              type="button"
              onClick={() => {
                setIsConfiguringEvent(true);
                setActiveConfigTab('BRANDING');
              }}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-250 cursor-pointer rounded-lg text-xxs font-bold text-slate-705 transition-all shadow-xxs flex items-center gap-1.5 hover:border-slate-350"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
              Configurar Identidade e Catálogo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header com Abas */}
            <div className="border-b border-slate-200 pb-0.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setActiveConfigTab('BRANDING')}
                  className={`pb-2.5 px-1 font-bold text-xs uppercase cursor-pointer transition-all flex items-center gap-1.5 ${
                    activeConfigTab === 'BRANDING' 
                      ? 'border-b-2 border-indigo-600 text-indigo-700' 
                      : 'text-slate-400 hover:text-slate-650'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Identidade do Evento Ativo
                </button>
                <button
                  type="button"
                  onClick={() => setActiveConfigTab('CATALOG')}
                  className={`pb-2.5 px-1 font-bold text-xs uppercase cursor-pointer transition-all flex items-center gap-1.5 ${
                    activeConfigTab === 'CATALOG' 
                      ? 'border-b-2 border-indigo-600 text-indigo-700' 
                      : 'text-slate-400 hover:text-slate-650'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Catálogo de Empreendimentos ({enterprises.length})
                </button>
              </div>
              <span className="text-[9px] text-gray-400 font-mono hidden md:inline">Configurações visuais refletidas em tempo real</span>
            </div>

            {/* Renderizar as Abas correspondentes */}
            {activeConfigTab === 'BRANDING' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Nome do Empreendimento (Seletor do Catálogo) */}
                  <div>
                    <label className="text-xxs font-bold text-slate-650 uppercase block pb-1.5">Empreendimento Ativo</label>
                    <div className="space-y-1.5">
                      <select
                        value={tempEnterpriseName}
                        onChange={(e) => setTempEnterpriseName(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-slate-400 outline-none text-slate-800 font-medium"
                      >
                        <option value="">-- Selecione do Catálogo --</option>
                        {enterprises.map(e => (
                          <option key={e.id} value={e.name}>{e.name}</option>
                        ))}
                      </select>
                      <p className="text-[9px] text-slate-400 block">
                        Não encontrou? Cadastre na aba <button type="button" onClick={() => setActiveConfigTab('CATALOG')} className="text-indigo-600 font-bold hover:underline">Catálogo de Empreendimentos</button>
                      </p>
                    </div>
                  </div>

                  {/* Data do Evento */}
                  <div>
                    <label className="text-xxs font-bold text-slate-655 uppercase block pb-1.5 font-mono">Data do Congresso de Chaves</label>
                    <input
                      type="text"
                      placeholder="Ex: 23 de Maio de 2026"
                      value={tempEventDate}
                      onChange={(e) => setTempEventDate(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-slate-400 outline-none text-slate-800 font-medium"
                    />
                  </div>

                  {/* Tipo de Logo */}
                  <div>
                    <label className="text-xxs font-bold text-slate-655 uppercase block pb-1.5">Origem da Logo / Identidade</label>
                    <div className="flex gap-2 p-0.5 bg-white border border-gray-300 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setTempLogoType('ICON')}
                        className={`flex-1 py-1 rounded-md font-bold text-xxs transition-colors cursor-pointer ${tempLogoType === 'ICON' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        Ícone do Sistema
                      </button>
                      <button
                        type="button"
                        onClick={() => setTempLogoType('URL')}
                        className={`flex-1 py-1 rounded-md font-bold text-xxs transition-colors cursor-pointer ${tempLogoType === 'URL' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        Importar Logomarca
                      </button>
                    </div>
                  </div>
                </div>

                {/* Configuração do Logotipo de acordo com a seleção */}
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  {tempLogoType === 'ICON' ? (
                    <div>
                      <label className="text-xxs font-bold text-slate-500 uppercase block pb-2">Selecione o Ícone Representativo</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { name: 'Building2', label: 'Condomínio (Building2)' },
                          { name: 'Home', label: 'Residência (Home)' },
                          { name: 'Key', label: 'Chave Coroa (Key)' },
                          { name: 'Building', label: 'Corporativo (Building)' },
                          { name: 'Award', label: 'Premium (Award)' },
                          { name: 'Sparkles', label: 'Inovador (Sparkles)' }
                        ].map(item => (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => setTempLogoIconName(item.name)}
                            className={`px-3 py-1.5 rounded-lg border text-xxs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              tempLogoIconName === item.name 
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-300 ring-1 ring-indigo-200' 
                                : 'bg-white text-slate-600 border-slate-250 hover:bg-slate-50'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xxs font-bold text-slate-505 uppercase block pb-1.5">Link direto de Imagem Web (Opcional)</label>
                          <input
                            type="url"
                            placeholder="https://exemplo.com/logo-construtora.png"
                            value={tempLogoUrl.startsWith('data:image') ? '' : tempLogoUrl}
                            onChange={(e) => setTempLogoUrl(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-slate-400 outline-none text-slate-800 font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-xxs font-bold text-slate-505 uppercase block pb-1.5">Fazer Carregamento do Arquivo</label>
                          <div className="flex items-center gap-2">
                            <label className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer hover:border-indigo-400 transition-colors">
                              <Upload className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>Importar Imagem Locas (PNG, JPG, SVG)...</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      if (typeof reader.result === 'string') {
                                        setTempLogoUrl(reader.result);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      {tempLogoUrl && (
                        <div className="flex items-center gap-4 bg-slate-50 p-2.5 border border-slate-200 rounded-lg">
                          <div className="h-16 w-16 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-1.5 shadow-xxs shrink-0 overflow-hidden">
                            <img src={tempLogoUrl} className="max-h-full max-w-full object-contain" alt="Imagem Carregada" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <strong className="block text-xs font-bold text-slate-705">Logomarca Carregada com sucesso!</strong>
                            <p className="text-[10px] text-gray-400 truncate font-mono">
                              {tempLogoUrl.startsWith('data:') ? 'Arquivo Convertido para Base64 Local' : tempLogoUrl}
                            </p>
                            <button
                              type="button"
                              onClick={() => setTempLogoUrl('')}
                              className="text-rose-600 hover:text-rose-700 font-bold text-xxs mt-0.5"
                            >
                              Remover Logo / Limpar
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <p className="text-[10px] text-slate-400 font-sans">
                        Tip: Logos com fundo transparente fornecem uma estética mais lapidada e corporativa no painel gigante.
                      </p>
                    </div>
                  )}
                </div>

                {/* Botões operacionais de gravação */}
                <div className="flex justify-end gap-2 pt-1 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsConfiguringEvent(false);
                      if (eventConfig) {
                        setTempEnterpriseName(eventConfig.enterpriseName);
                        setTempLogoType(eventConfig.logoType);
                        setTempLogoUrl(eventConfig.logoUrl);
                        setTempLogoIconName(eventConfig.logoIconName);
                        setTempEventDate(eventConfig.eventDate);
                      }
                    }}
                    disabled={isSavingConfig}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-xxs font-bold text-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Fechar / Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEventConfigLocal}
                    disabled={isSavingConfig || !tempEnterpriseName.trim()}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-800 text-xxs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    {isSavingConfig ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Aplicar Identidade Ativa
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* TAB 2: GERENCIAMENTO DE CATÁLOGO */
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <h4 className="text-xxs font-bold text-slate-500 uppercase tracking-wider block pb-2">Cadastrar Novo Empreendimento no Catálogo</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: Splendor Park Residence II"
                      value={newEnterpriseName}
                      onChange={(e) => setNewEnterpriseName(e.target.value)}
                      disabled={isSavingEnterprise}
                      className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-slate-400 outline-none text-slate-800 font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleAddEnterprise}
                      disabled={isSavingEnterprise || !newEnterpriseName.trim()}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white text-xxs font-bold rounded-lg transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Cadastrar
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex justify-between items-center text-xxs font-bold text-slate-505 uppercase tracking-wider font-mono">
                    <span>Nome Cadastrado</span>
                    <span>Ações</span>
                  </div>

                  {enterprises.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 font-medium">
                      Nenhum empreendimento cadastrado no catálogo. Insira um acima para iniciar.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto">
                      {enterprises.map((e) => (
                        <div key={e.id} className="px-4 py-2.5 flex items-center justify-between text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors">
                          {editingEnterpriseId === e.id ? (
                            <div className="flex items-center gap-2 flex-1 mr-4">
                              <input
                                type="text"
                                value={editingEnterpriseName}
                                onChange={(e) => setEditingEnterpriseName(e.target.value)}
                                className="flex-1 bg-white border border-indigo-400 rounded px-2 py-0.5 text-xs focus:ring-1 focus:ring-indigo-300 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateEnterpriseLocal(e.id)}
                                disabled={isSavingEnterprise || !editingEnterpriseName.trim()}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded px-2.5 py-1 text-[10px] font-bold cursor-pointer"
                              >
                                Gravar
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingEnterpriseId(null)}
                                className="bg-slate-100 hover:bg-slate-250 text-slate-650 rounded px-2.5 py-1 text-[10px] font-bold cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="truncate pr-4 font-semibold text-slate-700">{e.name}</span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingEnterpriseId(e.id);
                                    setEditingEnterpriseName(e.name);
                                  }}
                                  className="p-1 hover:bg-slate-100/80 rounded text-slate-600 hover:text-indigo-600 cursor-pointer"
                                  title="Editar Nome do Empreendimento"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEnterpriseLocal(e.id)}
                                  className="p-1 hover:bg-slate-100/80 rounded text-rose-600 hover:text-rose-750 cursor-pointer"
                                  title="Excluir do Catálogo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Back button */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsConfiguringEvent(false);
                    }}
                    className="px-4 py-1.5 bg-slate-100 hover:bg-slate-205 text-xxs font-bold text-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Fechar Painel de Configurações
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid de Cards Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">Fila Atendimento</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{waitingAtendCount}</span>
              <span className="text-xxs text-gray-400">aguardando</span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">Fila Vistoria</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{waitingVistCount}</span>
              <span className="text-xxs text-gray-400">aptos na roleta</span>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">Retidos p/ Vistoriador Pessoal</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{waitingOwnInspector}</span>
              <span className="text-xxs text-gray-400">no café/espera</span>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">Finalizados Hoje</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{completedCount}</span>
              <span className="text-xs text-gray-400">de {totalClients}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seção Operacional Secundária: Alertas Operacionais Críticos e Tempos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Alertas */}
        <div className="lg:col-span-1 bg-slate-900 text-white rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold flex items-center gap-2 text-yellow-400">
              <AlertTriangle className="w-4 h-4" />
              Alertas de Gargalo
            </h3>
            <span className="bg-rose-500 text-white font-extrabold text-xxs px-2 py-0.5 rounded-full">LIVE</span>
          </div>

          <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                Nenhum alerta de gargalo ativo. Fluxo balanceado!
              </div>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className="p-3 rounded-lg bg-slate-800 border-l-4 border-rose-500 text-xs text-slate-300">
                  <div className="flex justify-between items-center mb-1 text-slate-100 font-semibold">
                    <span>{alert.title}</span>
                    <span className="text-slate-500 text-[10px]">{alert.createdAt}</span>
                  </div>
                  <p className="leading-relaxed">{alert.description}</p>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-800 text-xxs text-slate-400 grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-800 p-2 rounded">
              <span className="block font-bold text-lg text-slate-200">12 min</span>
              Espera Média
            </div>
            <div className="bg-slate-800 p-2 rounded">
              <span className="block font-bold text-lg text-slate-200">18 min</span>
              Atendimento %
            </div>
            <div className="bg-slate-800 p-2 rounded">
              <span className="block font-bold text-lg text-slate-200">35 min</span>
              Vistoria Ø
            </div>
          </div>
        </div>

        {/* Roleta: Gerenciamento em Tempo Real dos Profissionais */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                🟢 Disponibilidade de Equipes (Roleta Automática)
              </h3>
              <p className="text-xs text-gray-500">Altere o status para incluir ou remover operadores da ordem automática de chamadas.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Atendentes */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Guichês de Documentação</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {users.filter(u => u.role === 'ATENDENTE').map(user => (
                  <div key={user.id} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-100 text-xs">
                    <div>
                      <span className="font-semibold text-slate-800 block">{user.name}</span>
                      <span className="text-[10px] text-indigo-600 font-semibold">{user.deskNumber}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                        {user.completedCount} concl.
                      </span>
                      <select
                        value={user.status}
                        onChange={(e) => onUpdateUserStatus(user.id, e.target.value)}
                        className={`text-xs p-1 rounded font-semibold cursor-pointer outline-none border ${
                          user.status === 'DISPONIVEL' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                          user.status === 'EM_ATENDIMENTO' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value="DISPONIVEL">Disponível</option>
                        <option value="EM_ATENDIMENTO">Em Atendimento</option>
                        <option value="INDISPONIVEL">Pausa/Inativo</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vistoriadores */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Equipe de Vistoriadores de Unidade</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {users.filter(u => u.role === 'VISTORIADOR').map(user => (
                  <div key={user.id} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-100 text-xs">
                    <div>
                      <span className="font-semibold text-slate-800 block">{user.name}</span>
                      <span className="text-[10px] text-gray-500 bg-gray-200/50 px-1 rounded">{user.deskNumber || 'Área Livre'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                        {user.completedCount} vist.
                      </span>
                      <select
                        value={user.status}
                        onChange={(e) => onUpdateUserStatus(user.id, e.target.value)}
                        className={`text-xs p-1 rounded font-semibold cursor-pointer outline-none border ${
                          user.status === 'DISPONIVEL' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                          user.status === 'EM_VISTORIA' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value="DISPONIVEL">Livre (Na roleta)</option>
                        <option value="EM_VISTORIA">Vistoriando</option>
                        <option value="INDISPONIVEL">Indisponível</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Validação de Laudos Recebidos de Clientes com Vistoriador Particular (WhatsApp Upload) */}
      {laudosPendentesDeValidacao.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
          <h3 className="text-amber-800 font-bold flex items-center gap-2 text-sm">
            <AlertOctagon className="w-5 h-5" />
            Laudos Particulares Recebidos Pós-Evento ({laudosPendentesDeValidacao.length} aguardando validação)
          </h3>
          <p className="text-xs text-amber-700">Laudos em PDF carregados no portal do cliente precisam de avaliação técnica para encerramento do processo.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {laudosPendentesDeValidacao.map(client => {
              const laudo = client.documentos.find(d => d.category === 'LAUDO_PARTICULAR');
              return (
                <div key={client.id} className="bg-white p-3 rounded-lg border border-amber-200 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">{client.nome}</span>
                    <span className="text-gray-500 block">{client.empreendimento} - {client.unidade}</span>
                    <span className="text-amber-600 bg-amber-50 rounded px-1 text-[10px] font-bold mt-1 inline-block">
                      Arquivo: {laudo?.name || 'Laudo.pdf'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onValidateLaudo(client.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2.5 rounded text-xxs transition-all cursor-pointer"
                    >
                      Aprovar e Finalizar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabela Geral & Logs de Monitoramento Real-time */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Lista Completa de Clientes no Evento */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-gray-100 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h3 className="font-bold text-slate-900 text-sm">Status Detalhado de Todos os Clientes ({totalClients})</h3>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Pesquisa */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Nome, CPF ou Apto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-50 border border-gray-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              {/* Filtro de Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-gray-200 text-xs rounded-lg p-1.5"
              >
                <option value="ALL">Todos status</option>
                <option value="AGUARDANDO_RECEPCAO">Aguardando Recepção</option>
                <option value="FILA_ATENDIMENTO">Fila Atendimento</option>
                <option value="EM_ATENDIMENTO">Em Atendimento</option>
                <option value="AGUARDANDO_VISTORIADOR_PROPRIO">Retido Vist. Próprio</option>
                <option value="FILA_VISTORIA">Fila Vistoria</option>
                <option value="EM_VISTORIA">Em Vistoria</option>
                <option value="PENDENTE">Validação de Laudo</option>
                <option value="PROCESSO_ENCERRADO">Processo Encerrado</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead>
                <tr className="border-b border-gray-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2 px-3">Cliente / CPF</th>
                  <th className="py-2 px-3">Unidade</th>
                  <th className="py-2 px-3">Etapa Atual</th>
                  <th className="py-2 px-3">Responsáveis</th>
                  <th className="py-2 px-3 text-right">Prioridade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredClients.map(client => (
                  <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-800 block text-wrap max-w-[200px]">{client.nome}</span>
                      <span className="text-[10px] text-gray-500 block">{client.cpf}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 block">{client.unidade}</span>
                      <span className="text-[10px] text-gray-500 block">{client.empreendimento}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xxs font-bold ${
                        client.status === 'AGUARDANDO_RECEPCAO' ? 'bg-slate-100 text-slate-700' :
                        client.status === 'FILA_ATENDIMENTO' ? 'bg-indigo-100 text-indigo-700' :
                        client.status === 'EM_ATENDIMENTO' ? 'bg-blue-100 text-blue-700' :
                        client.status === 'AGUARDANDO_VISTORIADOR_PROPRIO' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                        client.status === 'FILA_VISTORIA' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        client.status === 'EM_VISTORIA' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                        client.status === 'PENDENTE' ? 'bg-cyan-100 text-cyan-800' :
                        'bg-slate-900 text-emerald-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          client.status === 'EM_ATENDIMENTO' || client.status === 'EM_VISTORIA' ? 'bg-current animate-pulse' : 'bg-current'
                        }`} />
                        {client.status === 'AGUARDANDO_RECEPCAO' && 'Aguardando Recepção'}
                        {client.status === 'FILA_ATENDIMENTO' && 'Fila Atendimento'}
                        {client.status === 'EM_ATENDIMENTO' && 'Em Atendimento'}
                        {client.status === 'AGUARDANDO_VISTORIADOR_PROPRIO' && 'Aguarda Arquiteto/Vist.'}
                        {client.status === 'FILA_VISTORIA' && 'Fila de Vistoria'}
                        {client.status === 'EM_VISTORIA' && 'Vistoriando Unidade'}
                        {client.status === 'PENDENTE' && 'Laudo p/ Validar'}
                        {client.status === 'PROCESSO_ENCERRADO' && 'Completo / Chaves entregues'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="space-y-0.5 text-[10px]">
                        {client.atendenteNome && (
                          <span className="block text-slate-700 font-medium">📋 Atend: {client.atendenteNome} ({client.guicheChamada})</span>
                        )}
                        {client.vistoriadorNome && (
                          <span className="block text-purple-700 font-medium">🔍 Vist: {client.vistoriadorNome}</span>
                        )}
                        {!client.atendenteNome && !client.vistoriadorNome && (
                          <span className="text-gray-400 italic">Nenhum</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className={`px-1.5 py-0.5 rounded font-extrabold text-[10px] ${
                        client.priority === 'NORMAL' ? 'bg-gray-100 text-gray-600' :
                        'bg-orange-100 text-orange-700 animate-pulse'
                      }`}>
                        {client.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Auditoria / Log de Eventos em Tempo Real */}
        <div className="lg:col-span-1 bg-white rounded-xl p-5 border border-gray-100 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              📜 Histórico Auditado & Logs (AO VIVO)
            </h3>
            <p className="text-xs text-gray-500">Mapeamento em tempo real do fluxo de clientes e chamadas do painel.</p>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 flex-1">
            {logs.slice(0, 15).map(log => (
              <div key={log.id} className="border-b border-gray-50 pb-2.5 last:border-none text-xs">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {log.user}
                  </span>
                  <span className="text-[10px] font-semibold text-gray-400 font-mono">{log.timestamp}</span>
                </div>
                <div className="text-slate-700 font-semibold">{log.action}</div>
                <div className="text-slate-500 text-[10px]">{log.details}</div>
              </div>
            ))}
          </div>
          
          <div className="bg-indigo-50/50 p-2.5 rounded-lg text-xxs text-indigo-700 border border-indigo-100/50 flex items-center gap-2">
            <span className="font-bold bg-indigo-600 text-white rounded px-1">SEGURANÇA</span>
            Rastreabilidade de alterações cadastrais e de status atendendo conformidade LGPD.
          </div>
        </div>
      </div>

      {/* Grid de WhatsApp Logs Monitor */}
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Phone className="w-4 h-4 text-emerald-600" />
          Disparos de Mensagens WhatsApp Simulados ({whatsappMessages.length} enviadas)
        </h3>
        <p className="text-xs text-gray-500">Mensagens pós-vistoria que o sistema envia ao cliente com o link único seguro para upload do Laudo particular.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[160px] overflow-y-auto">
          {whatsappMessages.length === 0 ? (
            <div className="col-span-full py-4 text-center text-xs text-slate-400">
              Nenhuma mensagem disparada até o momento. Finalize vistorias para disparar mensagens.
            </div>
          ) : (
            whatsappMessages.map(msg => (
              <div key={msg.id} className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 text-[11px] leading-relaxed text-emerald-800">
                <div className="flex justify-between items-center border-b border-emerald-100 pb-1 mb-1 font-bold text-emerald-900">
                  <span>📱 {msg.clienteNome}</span>
                  <span className="text-[9px] bg-emerald-600 text-white px-1 py-0.2 rounded font-semibold text-xxs">ENTREGUE</span>
                </div>
                <p className="italic text-gray-600 line-clamp-2 hover:line-clamp-none transition-all">{msg.mensagem}</p>
                <div className="text-[9px] text-gray-400 mt-1 font-mono">{msg.dataEnvio}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
