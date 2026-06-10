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
  onSaveEnterprise?: (enterpriseData: Partial<Enterprise>) => Promise<{ success: boolean; error?: string }>;
  onDeleteEnterprise?: (id: string) => Promise<{ success: boolean; error?: string }>;
  onSaveClient?: (clientData: Partial<Client>) => Promise<{ success: boolean; error?: string }>;
  onDeleteClient?: (id: string) => Promise<{ success: boolean; error?: string }>;
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
  onDeleteEnterprise,
  onSaveClient,
  onDeleteClient
}: DashboardViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [entSearchQuery, setEntSearchQuery] = useState('');

  // CALCULO DINAMICO DAS METRICAS DA FILA REAL-TIME
  const parseTimeToMinutesLocal = (timeStr?: string): number | null => {
    if (!timeStr) return null;
    const parts = timeStr.split(':');
    if (parts.length < 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  };

  // 1. Duração média de espera no atendimento
  let totalAtendWait = 0;
  let countAtendWait = 0;
  clients.forEach(c => {
    const start = parseTimeToMinutesLocal(c.tempoChegadaRecepcao);
    const end = parseTimeToMinutesLocal(c.tempoInicioAtendimento);
    if (start !== null && end !== null && end >= start) {
      totalAtendWait += (end - start);
      countAtendWait++;
    }
  });
  const avgAtendWaitStr = countAtendWait > 0 ? `${Math.round(totalAtendWait / countAtendWait)} min` : "0 min";

  // 2. Tempo de atendimento médio
  let totalAtendDur = 0;
  let countAtendDur = 0;
  clients.forEach(c => {
    const start = parseTimeToMinutesLocal(c.tempoInicioAtendimento);
    const end = parseTimeToMinutesLocal(c.tempoFimAtendimento);
    if (start !== null && end !== null && end >= start) {
      totalAtendDur += (end - start);
      countAtendDur++;
    }
  });
  const avgAtendDurStr = countAtendDur > 0 ? `${Math.round(totalAtendDur / countAtendDur)} min` : "0 min";

  // 3. Tempo de vistoria médio
  let totalVistDur = 0;
  let countVistDur = 0;
  clients.forEach(c => {
    const start = parseTimeToMinutesLocal(c.tempoInicioVistoria);
    const end = parseTimeToMinutesLocal(c.tempoFimVistoria);
    if (start !== null && end !== null && end >= start) {
      totalVistDur += (end - start);
      countVistDur++;
    }
  });
  const avgVistDurStr = countVistDur > 0 ? `${Math.round(totalVistDur / countVistDur)} min` : "0 min";

  // Estados locais para edição das configurações de Branding do Evento
  const [isConfiguringEvent, setIsConfiguringEvent] = useState(false);
  const [activeConfigTab, setActiveConfigTab] = useState<'BRANDING' | 'CATALOG'>('BRANDING');
  const [tempEnterpriseName, setTempEnterpriseName] = useState(eventConfig?.enterpriseName || "Residencial Canto das Flores");
  const [tempLogoType, setTempLogoType] = useState<'ICON' | 'URL'>(eventConfig?.logoType || 'ICON');
  const [tempLogoUrl, setTempLogoUrl] = useState(eventConfig?.logoUrl || '');
  const [tempLogoIconName, setTempLogoIconName] = useState(eventConfig?.logoIconName || 'Building2');
  const [tempEventDate, setTempEventDate] = useState(eventConfig?.eventDate || '23 de Maio de 2026');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const [editingEnterpriseId, setEditingEnterpriseId] = useState<string | null>(null);
  const [editingEnterpriseName, setEditingEnterpriseName] = useState('');
  const [newEnterpriseName, setNewEnterpriseName] = useState('');
  const [newEnterpriseStatus, setNewEnterpriseStatus] = useState<'ATIVO' | 'INATIVO'>('ATIVO');
  const [newEnterpriseObs, setNewEnterpriseObs] = useState('');

  const [editingEnterpriseStatus, setEditingEnterpriseStatus] = useState<'ATIVO' | 'INATIVO'>('ATIVO');
  const [editingEnterpriseObs, setEditingEnterpriseObs] = useState('');

  const [isSavingEnterprise, setIsSavingEnterprise] = useState(false);

  // NOVOS ESTADOS PARA BRANDING DOS EMPREENDIMENTOS NO CATÁLOGO
  const [newEntLogoType, setNewEntLogoType] = useState<'ICON' | 'URL'>('ICON');
  const [newEntLogoUrl, setNewEntLogoUrl] = useState('');
  const [newEntLogoIcon, setNewEntLogoIcon] = useState('Building2');

  const [editingEntLogoType, setEditingEntLogoType] = useState<'ICON' | 'URL'>('ICON');
  const [editingEntLogoUrl, setEditingEntLogoUrl] = useState('');
  const [editingEntLogoIcon, setEditingEntLogoIcon] = useState('Building2');

  // --- NOVOS CAMPOS DE CONTATO E CONFIGURAÇÃO DA TV ---
  const [newEnterpriseAddress, setNewEnterpriseAddress] = useState('');
  const [newEnterpriseTelephone, setNewEnterpriseTelephone] = useState('');
  const [newEnterpriseEmail, setNewEnterpriseEmail] = useState('');
  const [newPrimaryColor, setNewPrimaryColor] = useState('#0f172a');
  const [newSecondaryColor, setNewSecondaryColor] = useState('#1e293b');
  const [newAccentColor, setNewAccentColor] = useState('#e11d48');
  const [newTextColor, setNewTextColor] = useState('#ffffff');
  const [newLayoutType, setNewLayoutType] = useState<'TOP_LOGO' | 'SIDE_LOGO' | 'NO_LOGO'>('TOP_LOGO');
  const [newFontSize, setNewFontSize] = useState<'SMALL' | 'MEDIUM' | 'LARGE'>('MEDIUM');
  const [newShowLogo, setNewShowLogo] = useState(true);
  const [newInstitutionalText, setNewInstitutionalText] = useState('Por favor, certifique-se de estar com seus documentos oficiais com foto em mãos.');
  const [newTickerText, setNewTickerText] = useState('Ato de entrega de chaves em andamento - Seja bem-vindo!');

  const [editingEnterpriseAddress, setEditingEnterpriseAddress] = useState('');
  const [editingEnterpriseTelephone, setEditingEnterpriseTelephone] = useState('');
  const [editingEnterpriseEmail, setEditingEnterpriseEmail] = useState('');
  const [editingPrimaryColor, setEditingPrimaryColor] = useState('#0f172a');
  const [editingSecondaryColor, setEditingSecondaryColor] = useState('#1e293b');
  const [editingAccentColor, setEditingAccentColor] = useState('#e11d48');
  const [editingTextColor, setEditingTextColor] = useState('#ffffff');
  const [editingLayoutType, setEditingLayoutType] = useState<'TOP_LOGO' | 'SIDE_LOGO' | 'NO_LOGO'>('TOP_LOGO');
  const [editingFontSize, setEditingFontSize] = useState<'SMALL' | 'MEDIUM' | 'LARGE'>('MEDIUM');
  const [editingShowLogo, setEditingShowLogo] = useState(true);
  const [editingInstitutionalText, setEditingInstitutionalText] = useState('Por favor, certifique-se de estar com seus documentos oficiais com foto em mãos.');
  const [editingTickerText, setEditingTickerText] = useState('Ato de entrega de chaves em andamento - Seja bem-vindo!');

  // --- ESTADOS PARA GESTÃO MANUAL DE CLIENTES (CADASTRO/EDIÇÃO/EXCLUSÃO) ---
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [clientFormNome, setClientFormNome] = useState('');
  const [clientFormCpf, setClientFormCpf] = useState('');
  const [clientFormEmpreendimento, setClientFormEmpreendimento] = useState('');
  const [clientFormBloco, setClientFormBloco] = useState('');
  const [clientFormUnidade, setClientFormUnidade] = useState('');
  const [clientFormTelefone, setClientFormTelefone] = useState('');
  const [clientFormEmail, setClientFormEmail] = useState('');
  const [clientFormStatusContratual, setClientFormStatusContratual] = useState<'QUITADO' | 'PENDENTE_FINANCIAMENTO' | 'EM_ANALISE'>('QUITADO');
  const [clientFormStatus, setClientFormStatus] = useState<string>('AGUARDANDO_RECEPCAO');
  const [clientFormPriority, setClientFormPriority] = useState<'NORMAL' | 'IDOSO' | 'PCD' | 'GESTANTE'>('NORMAL');
  const [clientFormObservacoes, setClientFormObservacoes] = useState('');
  const [clientFormPossuiProcurador, setClientFormPossuiProcurador] = useState(false);
  const [clientFormProcuradorNome, setClientFormProcuradorNome] = useState('');
  const [clientFormProcuradorCpf, setClientFormProcuradorCpf] = useState('');
  const [clientFormPossuiVistoriadorProprio, setClientFormPossuiVistoriadorProprio] = useState(false);
  const [clientFormVistoriadorParticularNome, setClientFormVistoriadorParticularNome] = useState('');
  const [clientFormVistoriadorParticularCrea, setClientFormVistoriadorParticularCrea] = useState('');
  const [isSavingClient, setIsSavingClient] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (isEditing) {
          setEditingEntLogoUrl(base64String);
        } else {
          setNewEntLogoUrl(base64String);
        }
      };
      reader.readAsDataURL(file);
    }
  };

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
    if (!newEnterpriseName.trim()) {
      alert("O nome do empreendimento é obrigatório.");
      return;
    }
    if (!newEnterpriseStatus) {
      alert("O status do empreendimento é obrigatório.");
      return;
    }
    if (!newEnterpriseObs.trim()) {
      alert("As observações do empreendimento são obrigatórias.");
      return;
    }
    if (!onSaveEnterprise) return;
    setIsSavingEnterprise(true);
    const result = await onSaveEnterprise({
      id: null,
      name: newEnterpriseName.trim(),
      logoType: newEntLogoType,
      logoUrl: newEntLogoUrl,
      logoIconName: newEntLogoIcon,
      status: newEnterpriseStatus,
      observacoes: newEnterpriseObs.trim(),
      address: newEnterpriseAddress.trim(),
      telephone: newEnterpriseTelephone.trim(),
      email: newEnterpriseEmail.trim(),
      primaryColor: newPrimaryColor,
      secondaryColor: newSecondaryColor,
      accentColor: newAccentColor,
      textColor: newTextColor,
      layoutType: newLayoutType,
      fontSize: newFontSize,
      showLogo: newShowLogo,
      institutionalText: newInstitutionalText.trim(),
      tickerText: newTickerText.trim()
    });
    setIsSavingEnterprise(false);
    if (result.success) {
      setNewEnterpriseName('');
      setNewEntLogoType('ICON');
      setNewEntLogoUrl('');
      setNewEntLogoIcon('Building2');
      setNewEnterpriseStatus('ATIVO');
      setNewEnterpriseObs('');
      setNewEnterpriseAddress('');
      setNewEnterpriseTelephone('');
      setNewEnterpriseEmail('');
      setNewPrimaryColor('#0f172a');
      setNewSecondaryColor('#1e293b');
      setNewAccentColor('#e11d48');
      setNewTextColor('#ffffff');
      setNewLayoutType('TOP_LOGO');
      setNewFontSize('MEDIUM');
      setNewShowLogo(true);
      setNewInstitutionalText('Por favor, certifique-se de estar com seus documentos oficiais com foto em mãos.');
      setNewTickerText('Ato de entrega de chaves em andamento - Seja bem-vindo!');
    } else {
      alert(result.error || "Erro ao cadastrar empreendimento.");
    }
  };

  const handleUpdateEnterpriseLocal = async (id: string) => {
    if (!editingEnterpriseName.trim()) {
      alert("O nome do empreendimento é obrigatório.");
      return;
    }
    if (!editingEnterpriseStatus) {
      alert("O status do empreendimento é obrigatório.");
      return;
    }
    if (!editingEnterpriseObs.trim()) {
      alert("As observações do empreendimento são obrigatórias.");
      return;
    }
    if (!onSaveEnterprise) return;
    setIsSavingEnterprise(true);
    const result = await onSaveEnterprise({
      id,
      name: editingEnterpriseName.trim(),
      logoType: editingEntLogoType,
      logoUrl: editingEntLogoUrl,
      logoIconName: editingEntLogoIcon,
      status: editingEnterpriseStatus,
      observacoes: editingEnterpriseObs.trim(),
      address: editingEnterpriseAddress.trim(),
      telephone: editingEnterpriseTelephone.trim(),
      email: editingEnterpriseEmail.trim(),
      primaryColor: editingPrimaryColor,
      secondaryColor: editingSecondaryColor,
      accentColor: editingAccentColor,
      textColor: editingTextColor,
      layoutType: editingLayoutType,
      fontSize: editingFontSize,
      showLogo: editingShowLogo,
      institutionalText: editingInstitutionalText.trim(),
      tickerText: editingTickerText.trim()
    });
    setIsSavingEnterprise(false);
    if (result.success) {
      setEditingEnterpriseId(null);
      setEditingEnterpriseName('');
      setEditingEntLogoType('ICON');
      setEditingEntLogoUrl('');
      setEditingEntLogoIcon('Building2');
      setEditingEnterpriseStatus('ATIVO');
      setEditingEnterpriseObs('');
      setEditingEnterpriseAddress('');
      setEditingEnterpriseTelephone('');
      setEditingEnterpriseEmail('');
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

  // --- CONTROLLER LOCAL PARA GESTÃO MANUAL DE COMPRADORES ---
  const handleSaveClientLocal = async () => {
    if (!clientFormNome.trim()) {
      alert("O nome completo do comprador é obrigatório.");
      return;
    }
    if (!clientFormCpf.trim()) {
      alert("O CPF do comprador é obrigatório.");
      return;
    }
    if (!onSaveClient) return;
    
    setIsSavingClient(true);
    const result = await onSaveClient({
      id: editingClientId || undefined,
      nome: clientFormNome.trim(),
      cpf: clientFormCpf.trim(),
      empreendimento: clientFormEmpreendimento || (enterprises.length > 0 ? enterprises[0].name : "Residencial Canto das Flores"),
      bloco: clientFormBloco.trim() || "Bloco A",
      unidade: clientFormUnidade.trim() || "Geral",
      telefone: clientFormTelefone.trim(),
      email: clientFormEmail.trim(),
      statusContratual: clientFormStatusContratual,
      status: clientFormStatus as any || "AGUARDANDO_RECEPCAO",
      priority: clientFormPriority,
      observacoes: clientFormObservacoes.trim(),
      possuiProcurador: clientFormPossuiProcurador,
      procuradorNome: clientFormProcuradorNome.trim(),
      procuradorCpf: clientFormProcuradorCpf.trim(),
      possuiVistoriadorProprio: clientFormPossuiVistoriadorProprio,
      vistoriadorParticularNome: clientFormVistoriadorParticularNome.trim(),
      vistoriadorParticularCrea: clientFormVistoriadorParticularCrea.trim()
    });
    setIsSavingClient(false);
    
    if (result.success) {
      setIsCreatingClient(false);
      setEditingClientId(null);
      setClientFormNome('');
      setClientFormCpf('');
      setClientFormEmpreendimento('');
      setClientFormBloco('');
      setClientFormUnidade('');
      setClientFormTelefone('');
      setClientFormEmail('');
      setClientFormStatusContratual('QUITADO');
      setClientFormStatus('AGUARDANDO_RECEPCAO');
      setClientFormPriority('NORMAL');
      setClientFormObservacoes('');
      setClientFormPossuiProcurador(false);
      setClientFormProcuradorNome('');
      setClientFormProcuradorCpf('');
      setClientFormPossuiVistoriadorProprio(false);
      setClientFormVistoriadorParticularNome('');
      setClientFormVistoriadorParticularCrea('');
    } else {
      alert(result.error || "Erro ao salvar o comprador.");
    }
  };

  const handleDeleteClientLocal = async (id: string, name: string) => {
    if (!onDeleteClient) return;
    if (confirm(`Deseja realmente remover o cliente "${name}" permanentemente do sistema?`)) {
      setIsSavingClient(true);
      const result = await onDeleteClient(id);
      setIsSavingClient(false);
      if (!result.success) {
        alert(result.error || "Erro ao remover cliente.");
      }
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
                          (c.cpf && c.cpf.includes(searchTerm)) || 
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
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-xxs font-bold text-slate-500 uppercase tracking-wider block">Cadastrar Novo Empreendimento com Identidade Visual</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">Nome do Empreendimento <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        placeholder="Ex: Splendor Park Residence II"
                        value={newEnterpriseName}
                        onChange={(e) => setNewEnterpriseName(e.target.value)}
                        disabled={isSavingEnterprise}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-slate-400 outline-none text-slate-800 font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">Status <span className="text-rose-500">*</span></label>
                      <select
                        value={newEnterpriseStatus}
                        onChange={(e: any) => setNewEnterpriseStatus(e.target.value)}
                        disabled={isSavingEnterprise}
                        className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-slate-400 font-semibold"
                      >
                        <option value="ATIVO">🟢 Ativo</option>
                        <option value="INATIVO">🔴 Inativo</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">Identidade Visual (Logo / Brasão)</label>
                      <select
                        value={newEntLogoType}
                        onChange={(e: any) => setNewEntLogoType(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                      >
                        <option value="ICON">Usar Ícone Residencial Padrão</option>
                        <option value="URL">Anexar/Carregar Foto Logomarca</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">Observações do Empreendimento <span className="text-rose-500">*</span></label>
                    <textarea
                      rows={2}
                      placeholder="Insira detalhes adicionais do empreendimento ou observações operacionais do condomínio..."
                      value={newEnterpriseObs}
                      onChange={(e) => setNewEnterpriseObs(e.target.value)}
                      disabled={isSavingEnterprise}
                      className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-slate-400 outline-none text-slate-800 resize-none font-medium"
                    />
                  </div>

                  {/* Informações de Contato */}
                  <div className="border-t border-slate-200/60 pt-3 mt-2">
                    <h5 className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block mb-2">📞 Informações de Contato do Condomínio / Incorporação</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block">Endereço Completo</label>
                        <input
                          type="text"
                          placeholder="Rua, Número, Bairro, Cidade - UF"
                          value={newEnterpriseAddress}
                          onChange={(e) => setNewEnterpriseAddress(e.target.value)}
                          disabled={isSavingEnterprise}
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block">Telefone de Atendimento</label>
                        <input
                          type="text"
                          placeholder="(00) 0000-0000 / (00) 90000-0000"
                          value={newEnterpriseTelephone}
                          onChange={(e) => setNewEnterpriseTelephone(e.target.value)}
                          disabled={isSavingEnterprise}
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block">E-mail Oficial</label>
                        <input
                          type="email"
                          placeholder="condominio@administradora.com"
                          value={newEnterpriseEmail}
                          onChange={(e) => setNewEnterpriseEmail(e.target.value)}
                          disabled={isSavingEnterprise}
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Configurações Exclusivas do Painel de TV */}
                  <div className="border-t border-slate-200/60 pt-3 mt-2 space-y-3">
                    <h5 className="text-[11px] font-bold text-slate-650 uppercase tracking-wide block">📺 Personalização Exclusiva do Painel da TV</h5>
                    
                    {/* Linha de Cores da Identidade */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-100/60 p-2.5 rounded-lg border border-slate-200/50">
                      <div className="space-y-1 bg-white p-2 rounded border border-slate-200">
                        <label className="text-[10px] font-bold text-slate-600 block">Cor Primária (Fundo)</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={newPrimaryColor}
                            onChange={(e) => setNewPrimaryColor(e.target.value)}
                            className="w-6 h-6 border rounded cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={newPrimaryColor}
                            onChange={(e) => setNewPrimaryColor(e.target.value)}
                            className="w-full text-[10px] font-mono font-bold text-slate-800 uppercase text-center focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 bg-white p-2 rounded border border-slate-200">
                        <label className="text-[10px] font-bold text-slate-600 block">Cor Auxiliar (Cards)</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={newSecondaryColor}
                            onChange={(e) => setNewSecondaryColor(e.target.value)}
                            className="w-6 h-6 border rounded cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={newSecondaryColor}
                            onChange={(e) => setNewSecondaryColor(e.target.value)}
                            className="w-full text-[10px] font-mono font-bold text-slate-800 uppercase text-center focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 bg-white p-2 rounded border border-slate-200">
                        <label className="text-[10px] font-bold text-slate-600 block">Cor Destaque (Senhas)</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={newAccentColor}
                            onChange={(e) => setNewAccentColor(e.target.value)}
                            className="w-6 h-6 border rounded cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={newAccentColor}
                            onChange={(e) => setNewAccentColor(e.target.value)}
                            className="w-full text-[10px] font-mono font-bold text-slate-800 uppercase text-center focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 bg-white p-2 rounded border border-slate-200">
                        <label className="text-[10px] font-bold text-slate-600 block">Cor do Texto (Geral)</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={newTextColor}
                            onChange={(e) => setNewTextColor(e.target.value)}
                            className="w-6 h-6 border rounded cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={newTextColor}
                            onChange={(e) => setNewTextColor(e.target.value)}
                            className="w-full text-[10px] font-mono font-bold text-slate-800 uppercase text-center focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Layout, Fontes e Visibilidade */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block">Posicionamento Logotipo</label>
                        <select
                          value={newLayoutType}
                          onChange={(e: any) => setNewLayoutType(e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                        >
                          <option value="TOP_LOGO">Centralizado no Topo</option>
                          <option value="SIDE_LOGO">Menu Lateral</option>
                          <option value="NO_LOGO">Ocultar Cabeçalho</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block">Tamanho da Fonte de Chamada</label>
                        <select
                          value={newFontSize}
                          onChange={(e: any) => setNewFontSize(e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                        >
                          <option value="SMALL">Compacto (Menor)</option>
                          <option value="MEDIUM">Padrão Confortável</option>
                          <option value="LARGE">Gigante (Alta Visibilidade)</option>
                        </select>
                      </div>

                      <div className="flex items-center pt-3.5 pl-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={newShowLogo}
                            onChange={(e) => setNewShowLogo(e.target.checked)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-505"
                          />
                          <span className="text-[11px] font-bold text-slate-600">Exibir Logo da Construtora na TV</span>
                        </label>
                      </div>
                    </div>

                    {/* Mensagens e Avisos Dinâmicos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block">Mensagem de Alerta Institucional (Banner TV)</label>
                        <input
                          type="text"
                          placeholder="Ex: Por favor, certifique-se de estar com seus documentos oficiais..."
                          value={newInstitutionalText}
                          onChange={(e) => setNewInstitutionalText(e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block">Avisos Rotativos do Rodapé (Letreiro Ticker)</label>
                        <input
                          type="text"
                          placeholder="Ex: Ato de entrega de chaves em andamento - Seja bem-vindo!"
                          value={newTickerText}
                          onChange={(e) => setNewTickerText(e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {newEntLogoType === 'ICON' ? (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">Selecione o Símbolo que Representa o Prédio</label>
                      <select
                        value={newEntLogoIcon}
                        onChange={(e) => setNewEntLogoIcon(e.target.value)}
                        className="w-full max-w-sm bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs outline-none"
                      >
                        <option value="Building2">🏢 Prédio Residencial Class (Building2)</option>
                        <option value="Building">🏢 Prédio Comercial (Building)</option>
                        <option value="Home">🏠 Mansão / Casa Club (Home)</option>
                        <option value="Sparkles">✨ Alto Padrão Premium (Sparkles)</option>
                        <option value="Award">🏆 Elegance / Awards (Award)</option>
                      </select>
                    </div>
                  ) : (
                    <div className="bg-white p-3 border border-dashed border-gray-300 rounded-lg space-y-2">
                      <span className="text-[10px] font-bold text-indigo-700 block">Upload de Logotipo para TV (Foto PNG, JPG ou SVG)</span>
                      
                      <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <label className="cursor-pointer shrink-0 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xxs px-4 py-2 rounded-lg border border-indigo-200 transition-colors inline-flex items-center gap-1">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Selecionar do Computador</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleLogoUpload(e, false)} 
                          />
                        </label>
                        
                        <span className="text-[10px] text-gray-400">ou insira link externo:</span>
                        
                        <input
                          type="text"
                          placeholder="https://exemplo.com/logo.png"
                          value={newEntLogoUrl}
                          onChange={(e) => setNewEntLogoUrl(e.target.value)}
                          className="flex-1 bg-slate-50 border border-gray-200 rounded-lg px-2 py-1 text-[11px] outline-none"
                        />
                      </div>

                      {newEntLogoUrl && (
                        <div className="flex items-center gap-3 bg-indigo-50/50 p-2 border border-indigo-100 rounded-lg">
                          <img src={newEntLogoUrl} className="h-8 max-w-[120px] object-contain shrink-0" alt="Preview Logo" />
                          <span className="text-xxs text-slate-600 truncate flex-1">Imagem anexada com sucesso!</span>
                          <button type="button" onClick={() => setNewEntLogoUrl('')} className="text-xxs font-bold text-rose-600">remover</button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddEnterprise}
                      disabled={isSavingEnterprise || !newEnterpriseName.trim() || !newEnterpriseObs.trim()}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white text-xxs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Cadastrar Empreendimento
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden space-y-3 p-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h4 className="text-xxs font-bold text-slate-500 uppercase tracking-wider block">Listagem de Empreendimentos Cadastrados</h4>
                  </div>

                  {/* Campo de pesquisa de empreendimentos */}
                  <div className="relative flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                    <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Filtrar por nome, status ou observações..."
                      value={entSearchQuery}
                      onChange={(e) => setEntSearchQuery(e.target.value)}
                      className="w-full bg-transparent border-none text-xs focus:ring-0 outline-none text-slate-800 placeholder-slate-400 font-medium"
                    />
                    {entSearchQuery && (
                      <button 
                        type="button" 
                        onClick={() => setEntSearchQuery('')} 
                        className="text-[10px] font-bold text-rose-500 hover:text-rose-750 px-1 hover:underline"
                      >
                        limpar
                      </button>
                    )}
                  </div>

                  {enterprises.filter(e => {
                    const q = entSearchQuery.toLowerCase();
                    return e.name.toLowerCase().includes(q) || 
                           (e.status && e.status.toLowerCase().includes(q)) ||
                           (e.observacoes && e.observacoes.toLowerCase().includes(q));
                  }).length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 font-medium bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                      Nenhum empreendimento correspondente aos critérios de busca.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-150 max-h-[320px] overflow-y-auto rounded-lg border border-slate-100">
                      {enterprises.filter(e => {
                        const q = entSearchQuery.toLowerCase();
                        return e.name.toLowerCase().includes(q) || 
                               (e.status && e.status.toLowerCase().includes(q)) ||
                               (e.observacoes && e.observacoes.toLowerCase().includes(q));
                      }).map((e) => (
                        <div key={e.id} className="px-4 py-3 flex flex-col gap-2 hover:bg-slate-50/60 transition-colors">
                          {editingEnterpriseId === e.id ? (
                            <div className="space-y-3 bg-indigo-50/20 p-3 rounded-lg border border-indigo-200">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 block">Editar Nome <span className="text-rose-500">*</span></label>
                                  <input
                                    type="text"
                                    value={editingEnterpriseName}
                                    onChange={(e) => setEditingEnterpriseName(e.target.value)}
                                    className="w-full bg-white border border-indigo-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-300 outline-none font-medium"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 block">Editar Status <span className="text-rose-500">*</span></label>
                                  <select
                                    value={editingEnterpriseStatus}
                                    onChange={(e: any) => setEditingEnterpriseStatus(e.target.value)}
                                    className="w-full bg-white border border-indigo-300 rounded px-2.5 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-300 font-semibold"
                                  >
                                    <option value="ATIVO">🟢 Ativo</option>
                                    <option value="INATIVO">🔴 Inativo</option>
                                  </select>
                                </div>
                                <div className="space-y-1 font-medium">
                                  <label className="text-[10px] font-bold text-slate-500 block">Editar Logo Tipo</label>
                                  <select
                                    value={editingEntLogoType}
                                    onChange={(e: any) => setEditingEntLogoType(e.target.value)}
                                    className="w-full bg-white border border-indigo-300 rounded px-2.5 py-1 text-xs outline-none font-semibold"
                                  >
                                    <option value="ICON">Usar Ícone Residencial Padrão</option>
                                    <option value="URL">Anexar/Carregar Foto Logomarca</option>
                                  </select>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 block">Editar Observações <span className="text-rose-500">*</span></label>
                                <textarea
                                  rows={2}
                                  value={editingEnterpriseObs}
                                  onChange={(e) => setEditingEnterpriseObs(e.target.value)}
                                  placeholder="Digite observações detalhadas do empreendimento..."
                                  className="w-full bg-white border border-indigo-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-300 outline-none resize-none font-medium text-slate-800"
                                />
                              </div>

                              {/* Editar Informações de Contato */}
                              <div className="border-t border-slate-200/60 pt-2 space-y-2">
                                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide block">📞 Editar Informações de Contato</span>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-medium text-slate-500 block">Endereço Completo</label>
                                    <input
                                      type="text"
                                      value={editingEnterpriseAddress}
                                      onChange={(e) => setEditingEnterpriseAddress(e.target.value)}
                                      className="w-full bg-white border border-indigo-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-300 outline-none font-medium"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-medium text-slate-500 block">Telefone de Atendimento</label>
                                    <input
                                      type="text"
                                      value={editingEnterpriseTelephone}
                                      onChange={(e) => setEditingEnterpriseTelephone(e.target.value)}
                                      className="w-full bg-white border border-indigo-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-300 outline-none font-medium"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-medium text-slate-500 block">E-mail Oficial</label>
                                    <input
                                      type="email"
                                      value={editingEnterpriseEmail}
                                      onChange={(e) => setEditingEnterpriseEmail(e.target.value)}
                                      className="w-full bg-white border border-indigo-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-300 outline-none font-medium"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Editar Configurações Exclusivas do Painel de TV */}
                              <div className="border-t border-slate-200/60 pt-2 space-y-2">
                                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide block">📺 Editar Personalização do Painel da TV</span>
                                
                                {/* Cores */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-100/50 p-2 rounded border border-slate-200/60">
                                  <div className="space-y-1 bg-white p-1 rounded border border-slate-200">
                                    <label className="text-[9px] font-bold text-slate-600 block">Cor Primária</label>
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="color"
                                        value={editingPrimaryColor}
                                        onChange={(e) => setEditingPrimaryColor(e.target.value)}
                                        className="w-5 h-5 border rounded cursor-pointer shrink-0"
                                      />
                                      <input
                                        type="text"
                                        value={editingPrimaryColor}
                                        onChange={(e) => setEditingPrimaryColor(e.target.value)}
                                        className="w-full text-[9px] font-mono font-bold text-slate-700 uppercase focus:outline-none"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-1 bg-white p-1 rounded border border-slate-200">
                                    <label className="text-[9px] font-bold text-slate-600 block">Cor Secundária</label>
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="color"
                                        value={editingSecondaryColor}
                                        onChange={(e) => setEditingSecondaryColor(e.target.value)}
                                        className="w-5 h-5 border rounded cursor-pointer shrink-0"
                                      />
                                      <input
                                        type="text"
                                        value={editingSecondaryColor}
                                        onChange={(e) => setEditingSecondaryColor(e.target.value)}
                                        className="w-full text-[9px] font-mono font-bold text-slate-700 uppercase focus:outline-none"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-1 bg-white p-1 rounded border border-slate-200">
                                    <label className="text-[9px] font-bold text-slate-600 block">Cor Destaque</label>
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="color"
                                        value={editingAccentColor}
                                        onChange={(e) => setEditingAccentColor(e.target.value)}
                                        className="w-5 h-5 border rounded cursor-pointer shrink-0"
                                      />
                                      <input
                                        type="text"
                                        value={editingAccentColor}
                                        onChange={(e) => setEditingAccentColor(e.target.value)}
                                        className="w-full text-[9px] font-mono font-bold text-slate-700 uppercase focus:outline-none"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-1 bg-white p-1 rounded border border-slate-200">
                                    <label className="text-[9px] font-bold text-slate-600 block">Cor do Texto</label>
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="color"
                                        value={editingTextColor}
                                        onChange={(e) => setEditingTextColor(e.target.value)}
                                        className="w-5 h-5 border rounded cursor-pointer shrink-0"
                                      />
                                      <input
                                        type="text"
                                        value={editingTextColor}
                                        onChange={(e) => setEditingTextColor(e.target.value)}
                                        className="w-full text-[9px] font-mono font-bold text-slate-700 uppercase focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Layout e configs */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-medium text-slate-500 block">Posicionamento Logotipo</label>
                                    <select
                                      value={editingLayoutType}
                                      onChange={(e: any) => setEditingLayoutType(e.target.value)}
                                      className="w-full bg-white border border-indigo-300 rounded px-2 py-1 text-xs outline-none"
                                    >
                                      <option value="TOP_LOGO">Centralizado no Topo</option>
                                      <option value="SIDE_LOGO">Menu Lateral</option>
                                      <option value="NO_LOGO">Ocultar Cabeçalho</option>
                                    </select>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] font-medium text-slate-500 block">Tamanho da Fonte de Chamada</label>
                                    <select
                                      value={editingFontSize}
                                      onChange={(e: any) => setEditingFontSize(e.target.value)}
                                      className="w-full bg-white border border-indigo-300 rounded px-2 py-1 text-xs outline-none"
                                    >
                                      <option value="SMALL">Compacto (Menor)</option>
                                      <option value="MEDIUM">Padrão Confortável</option>
                                      <option value="LARGE">Gigante (Alta Visibilidade)</option>
                                    </select>
                                  </div>

                                  <div className="flex items-center pt-2 pl-1 select-none">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={editingShowLogo}
                                        onChange={(e) => setEditingShowLogo(e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-505"
                                      />
                                      <span className="text-[10px] font-bold text-slate-600">Exibir Logo da Construtora</span>
                                    </label>
                                  </div>
                                </div>

                                {/* Banners de mensagens da TV */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-medium text-slate-500 block">Alerta Institucional (Banner)</label>
                                    <input
                                      type="text"
                                      value={editingInstitutionalText}
                                      onChange={(e) => setEditingInstitutionalText(e.target.value)}
                                      className="w-full bg-white border border-indigo-300 rounded px-2 py-1 text-xs outline-none font-medium"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] font-medium text-slate-500 block">Avisos Rotativos do Rodapé</label>
                                    <input
                                      type="text"
                                      value={editingTickerText}
                                      onChange={(e) => setEditingTickerText(e.target.value)}
                                      className="w-full bg-white border border-indigo-300 rounded px-2 py-1 text-xs outline-none font-medium"
                                    />
                                  </div>
                                </div>
                              </div>

                              {editingEntLogoType === 'ICON' ? (
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 block">Escolher Ícone de Imóvel</label>
                                  <select
                                    value={editingEntLogoIcon}
                                    onChange={(e) => setEditingEntLogoIcon(e.target.value)}
                                    className="bg-white border border-indigo-300 rounded px-2 py-1 text-xs outline-none"
                                  >
                                    <option value="Building2">🏢 Prédio Residencial Class (Building2)</option>
                                    <option value="Building">🏢 Prédio Comercial (Building)</option>
                                    <option value="Home">🏠 Mansão / Casa Club (Home)</option>
                                    <option value="Sparkles">✨ Alto Padrão Premium (Sparkles)</option>
                                    <option value="Award">🏆 Elegance / Awards (Award)</option>
                                  </select>
                                </div>
                              ) : (
                                <div className="bg-white p-2 border border-dashed border-indigo-150 rounded space-y-2">
                                  <div className="flex gap-2 items-center">
                                    <label className="cursor-pointer shrink-0 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] px-3 py-1.5 rounded border border-indigo-200 transition-colors">
                                      Carregar Foto de Logo
                                      <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={(e) => handleLogoUpload(e, true)} 
                                      />
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="https://exemplo.com/logo.png"
                                      value={editingEntLogoUrl}
                                      onChange={(e) => setEditingEntLogoUrl(e.target.value)}
                                      className="flex-1 bg-slate-50 border border-gray-200 rounded px-2 py-0.5 text-xs outline-none"
                                    />
                                  </div>
                                  {editingEntLogoUrl && (
                                    <div className="flex items-center gap-2">
                                      <img src={editingEntLogoUrl} className="h-6 max-w-[80px] object-contain" alt="Preview" />
                                      <button type="button" onClick={() => setEditingEntLogoUrl('')} className="text-[10px] text-rose-500 font-bold">remover</button>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="flex justify-end gap-1.5 pt-1 font-semibold">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateEnterpriseLocal(e.id)}
                                  disabled={isSavingEnterprise || !editingEnterpriseName.trim() || !editingEnterpriseObs.trim()}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded px-3 py-1.5 text-[10px] font-bold cursor-pointer font-sans"
                                >
                                  Gravar Empreendimento
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingEnterpriseId(null)}
                                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 rounded px-3 py-1.5 text-[10px] font-bold cursor-pointer font-sans"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-4 p-1">
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="h-7 w-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                    {e.logoType === 'URL' && e.logoUrl ? (
                                      <img src={e.logoUrl} className="h-full w-full object-contain" alt="Logo" referrerPolicy="no-referrer" />
                                    ) : (
                                      <Building2 className="w-4 h-4 text-indigo-500" />
                                    )}
                                  </div>
                                  <span className="truncate font-bold text-slate-800 text-sm">{e.name}</span>
                                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                                    e.status === 'INATIVO' 
                                      ? 'bg-rose-50 text-rose-700 border border-rose-150' 
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-150'
                                  }`}>
                                    {e.status === 'INATIVO' ? '🔴 Inativo' : '🟢 Ativo'}
                                  </span>
                                </div>
                                {e.observacoes ? (
                                  <div className="bg-slate-50 p-2 rounded-lg text-xxs text-slate-600 font-normal leading-relaxed">
                                    <strong className="text-slate-500 uppercase font-mono tracking-wider font-bold">Observações: </strong>
                                    {e.observacoes}
                                  </div>
                                ) : (
                                  <span className="text-xxs text-slate-400 block italic">Nenhuma observação cadastrada.</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingEnterpriseId(e.id);
                                    setEditingEnterpriseAddress(e.address || '');
                                    setEditingEnterpriseTelephone(e.telephone || '');
                                    setEditingEnterpriseEmail(e.email || '');
                                    setEditingPrimaryColor(e.primaryColor || '#0f172a');
                                    setEditingSecondaryColor(e.secondaryColor || '#1e293b');
                                    setEditingAccentColor(e.accentColor || '#e11d48');
                                    setEditingTextColor(e.textColor || '#ffffff');
                                    setEditingLayoutType(e.layoutType || 'TOP_LOGO');
                                    setEditingFontSize(e.fontSize || 'MEDIUM');
                                    setEditingShowLogo(e.showLogo !== undefined ? !!e.showLogo : true);
                                    setEditingInstitutionalText(e.institutionalText || 'Por favor, certifique-se de estar com seus documentos oficiais com foto em mãos.');
                                    setEditingTickerText(e.tickerText || 'Ato de entrega de chaves em andamento - Seja bem-vindo!');
                                    setEditingEnterpriseName(e.name);
                                    setEditingEntLogoType(e.logoType || 'ICON');
                                    setEditingEntLogoUrl(e.logoUrl || '');
                                    setEditingEntLogoIcon(e.logoIconName || 'Building2');
                                    setEditingEnterpriseStatus(e.status || 'ATIVO');
                                    setEditingEnterpriseObs(e.observacoes || '');
                                  }}
                                  className="p-1.5 bg-slate-105 hover:bg-slate-100 rounded text-slate-600 hover:text-indigo-600 cursor-pointer border border-slate-200"
                                  title="Editar Empreendimento"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEnterpriseLocal(e.id)}
                                  className="p-1.5 bg-slate-105 hover:bg-slate-100 rounded text-rose-600 hover:text-rose-705 cursor-pointer border border-slate-200"
                                  title="Excluir do Catálogo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
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
              <span className="block font-bold text-lg text-slate-200">{avgAtendWaitStr}</span>
              Espera Média
            </div>
            <div className="bg-slate-800 p-2 rounded">
              <span className="block font-bold text-lg text-slate-200">{avgAtendDurStr}</span>
              Atendimento Ø
            </div>
            <div className="bg-slate-800 p-2 rounded">
              <span className="block font-bold text-lg text-slate-200">{avgVistDurStr}</span>
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Status Detalhado de Todos os Clientes ({totalClients})</h3>
            
            <button
              type="button"
              id="btn-trigger-register-manual-client"
              onClick={() => {
                setIsCreatingClient(!isCreatingClient);
                setEditingClientId(null);
                setClientFormNome('');
                setClientFormCpf('');
                setClientFormEmpreendimento(enterprises[0]?.name || '');
                setClientFormBloco('');
                setClientFormUnidade('');
                setClientFormTelefone('');
                setClientFormEmail('');
                setClientFormStatusContratual('QUITADO');
                setClientFormStatus('AGUARDANDO_RECEPCAO');
                setClientFormPriority('NORMAL');
                setClientFormObservacoes('');
                setClientFormPossuiProcurador(false);
                setClientFormProcuradorNome('');
                setClientFormProcuradorCpf('');
                setClientFormPossuiVistoriadorProprio(false);
                setClientFormVistoriadorParticularNome('');
                setClientFormVistoriadorParticularCrea('');
              }}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-lg text-xxs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              {isCreatingClient ? 'Ocultar Cadastro' : 'Cadastrar Comprador'}
            </button>
          </div>

          {/* Form de Cadastro e Edição Manual de Clientes */}
          {(isCreatingClient || editingClientId) && (
            <div id="form-comprador-cadastro" className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-4 shadow-xxs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xxs font-bold text-indigo-700 uppercase tracking-wide">
                  {editingClientId ? '📝 Editar Dados do Comprador' : '✨ Cadastrar Novo Comprador no Sistema'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingClient(false);
                    setEditingClientId(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Seção 1: Dados do Imóvel / Fluxo */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">Nome Completo <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      placeholder="Ex: João da Silva Santos"
                      value={clientFormNome}
                      onChange={(e) => setClientFormNome(e.target.value)}
                      disabled={isSavingClient}
                      className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-slate-400 outline-none text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">CPF do Comprador <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      placeholder="Ex: 123.456.789-00"
                      value={clientFormCpf}
                      onChange={(e) => setClientFormCpf(e.target.value)}
                      disabled={isSavingClient}
                      className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-slate-400 outline-none text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">Empreendimento Associado <span className="text-rose-500">*</span></label>
                    <select
                      value={clientFormEmpreendimento}
                      onChange={(e) => setClientFormEmpreendimento(e.target.value)}
                      disabled={isSavingClient}
                      className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none"
                    >
                      <option value="">Selecione o imóvel...</option>
                      {enterprises.map((ent) => (
                        <option key={ent.id} value={ent.name}>{ent.name}</option>
                      ))}
                      {enterprises.length === 0 && (
                        <option value="Residencial Canto das Flores">Residencial Canto das Flores</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">Bloco / Torre</label>
                    <input
                      type="text"
                      placeholder="Ex: Bloco B"
                      value={clientFormBloco}
                      onChange={(e) => setClientFormBloco(e.target.value)}
                      disabled={isSavingClient}
                      className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-slate-400 outline-none text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">Unidade / Apto</label>
                    <input
                      type="text"
                      placeholder="Ex: Apto 104"
                      value={clientFormUnidade}
                      onChange={(e) => setClientFormUnidade(e.target.value)}
                      disabled={isSavingClient}
                      className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-slate-400 outline-none text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">Telefone Comprador</label>
                    <input
                      type="text"
                      placeholder="Ex: (11) 99999-8888"
                      value={clientFormTelefone}
                      onChange={(e) => setClientFormTelefone(e.target.value)}
                      disabled={isSavingClient}
                      className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-slate-400 outline-none text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">E-mail Comprador</label>
                    <input
                      type="email"
                      placeholder="Ex: cliente@email.com"
                      value={clientFormEmail}
                      onChange={(e) => setClientFormEmail(e.target.value)}
                      disabled={isSavingClient}
                      className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-slate-400 outline-none text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">Status Contratual (Financeiro)</label>
                    <select
                      value={clientFormStatusContratual}
                      onChange={(e: any) => setClientFormStatusContratual(e.target.value)}
                      disabled={isSavingClient}
                      className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none font-semibold text-slate-705"
                    >
                      <option value="QUITADO">🟢 QUITADO (Liberado)</option>
                      <option value="PENDENTE_FINANCIAMENTO">🟡 PENDENTE_FINANCIAMENTO (Atenção)</option>
                      <option value="EM_ANALISE">🔴 EM_ANALISE (Bloquear Chaves)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">Status da Etapa no Evento</label>
                    <select
                      value={clientFormStatus}
                      onChange={(e: any) => setClientFormStatus(e.target.value)}
                      disabled={isSavingClient}
                      className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none font-semibold text-slate-705"
                    >
                      <option value="AGUARDANDO_RECEPCAO">AGUARDANDO RECEPÇÃO (Entrada)</option>
                      <option value="FILA_ATENDIMENTO">FILA ATENDIMENTO (Recepção OK)</option>
                      <option value="EM_ATENDIMENTO">EM ATENDIMENTO (Assinando Contrato)</option>
                      <option value="AGUARDANDO_VISTORIADOR_PROPRIO">AGUARDANDO VISTORIADOR (Retido)</option>
                      <option value="FILA_VISTORIA">FILA VISTORIA (Espera Engenharia)</option>
                      <option value="EM_VISTORIA">EM VISTORIA (Vistoriando Obra)</option>
                      <option value="PENDENTE">LEITURA/VALIDAÇÃO DE LAUDO (Assinatura final)</option>
                      <option value="PROCESSO_ENCERRADO">PROCESSO ENCERRADO (Chaves Entregue)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">Prioridade Legal de Atendimento</label>
                    <select
                      value={clientFormPriority}
                      onChange={(e: any) => setClientFormPriority(e.target.value)}
                      disabled={isSavingClient}
                      className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none font-bold text-slate-705"
                    >
                      <option value="NORMAL">NORMAL (Fila Padrão)</option>
                      <option value="IDOSO">👵 IDOSO / 60+ (Preferencial)</option>
                      <option value="PCD">♿ PCD / Ostomizados (Preferencial)</option>
                      <option value="GESTANTE">🤱 GESTANTE / Lactantes (Preferencial)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Seção 2: Procurador Outorgado */}
              <div className="border-t border-slate-200/60 pt-3">
                <label className="flex items-center gap-2 cursor-pointer select-none mb-2">
                  <input
                    type="checkbox"
                    checked={clientFormPossuiProcurador}
                    onChange={(e) => setClientFormPossuiProcurador(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-505"
                  />
                  <span className="text-[11px] font-bold text-slate-700">💼 Este comprador assinará através de Procurador legalmente outorgado</span>
                </label>

                {clientFormPossuiProcurador && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-indigo-50/20 p-2.5 rounded-lg border border-indigo-100">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">Nome Completo do Procurador</label>
                      <input
                        type="text"
                        placeholder="Ex: Marcos Aurélio de Souza"
                        value={clientFormProcuradorNome}
                        onChange={(e) => setClientFormProcuradorNome(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">CPF do Procurador</label>
                      <input
                        type="text"
                        placeholder="Ex: 987.654.321-11"
                        value={clientFormProcuradorCpf}
                        onChange={(e) => setClientFormProcuradorCpf(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Seção 3: Vistoriador Individual */}
              <div className="border-t border-slate-200/60 pt-3">
                <label className="flex items-center gap-2 cursor-pointer select-none mb-2">
                  <input
                    type="checkbox"
                    checked={clientFormPossuiVistoriadorProprio}
                    onChange={(e) => setClientFormPossuiVistoriadorProprio(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-505"
                  />
                  <span className="text-[11px] font-bold text-slate-700">🔍 O comprador trouxe seu próprio Arquiteto/Engenheiro/Vistoriador particular</span>
                </label>

                {clientFormPossuiVistoriadorProprio && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-purple-50/25 p-2.5 rounded-lg border border-purple-100">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">Nome Completo do Profissional / Vistoriador</label>
                      <input
                        type="text"
                        placeholder="Ex: Eng. Roberto Carlos de Moura"
                        value={clientFormVistoriadorParticularNome}
                        onChange={(e) => setClientFormVistoriadorParticularNome(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">Registro Profissional (CREA / CAU)</label>
                      <input
                        type="text"
                        placeholder="Ex: CREA-SP 507080911"
                        value={clientFormVistoriadorParticularCrea}
                        onChange={(e) => setClientFormVistoriadorParticularCrea(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Seção 4: Notas */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block">Outras observações importantes sobre este comprador</label>
                <textarea
                  rows={2}
                  placeholder="Insira observações relevantes (ex: pendência física de procuração assinada, restrição médica de locomoção, etc.)"
                  value={clientFormObservacoes}
                  onChange={(e) => setClientFormObservacoes(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-slate-400 outline-none text-slate-800 resize-none"
                />
              </div>

              {/* Botões do Formulário de Clientes */}
              <div className="flex justify-end gap-2 border-t border-slate-200/80 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingClient(false);
                    setEditingClientId(null);
                  }}
                  className="px-4 py-2 bg-slate-150 hover:bg-slate-200 text-slate-700 text-xxs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar / Sair
                </button>
                <button
                  type="button"
                  onClick={handleSaveClientLocal}
                  disabled={isSavingClient || !clientFormNome.trim() || !clientFormCpf.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white text-xxs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isSavingClient ? 'Salvando...' : (editingClientId ? 'Gravar Alterações' : 'Salvar Comprador')}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
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
                  <th className="py-2 px-3 text-right">Ações</th>
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
                     <td className="py-3 px-3 text-right">
                       <div className="flex items-center justify-end gap-1.5">
                         <button
                           type="button"
                           onClick={() => {
                             setEditingClientId(client.id);
                             setIsCreatingClient(false);
                             setClientFormNome(client.nome || '');
                             setClientFormCpf(client.cpf || '');
                             setClientFormEmpreendimento(client.empreendimento || '');
                             setClientFormBloco(client.bloco || '');
                             setClientFormUnidade(client.unidade || '');
                             setClientFormTelefone(client.telefone || '');
                             setClientFormEmail(client.email || '');
                             setClientFormStatusContratual(client.statusContratual || 'QUITADO');
                             setClientFormStatus(client.status || 'AGUARDANDO_RECEPCAO');
                             setClientFormPriority(client.priority || 'NORMAL');
                             setClientFormObservacoes(client.observacoes || '');
                             setClientFormPossuiProcurador(!!client.possuiProcurador);
                             setClientFormProcuradorNome(client.procuradorNome || '');
                             setClientFormProcuradorCpf(client.procuradorCpf || '');
                             setClientFormPossuiVistoriadorProprio(!!client.possuiVistoriadorProprio);
                             setClientFormVistoriadorParticularNome(client.vistoriadorParticularNome || '');
                             setClientFormVistoriadorParticularCrea(client.vistoriadorParticularCrea || '');
                             
                             // Scroll to form smoothly
                             const f = document.getElementById('form-comprador-cadastro');
                             if (f) {
                               f.scrollIntoView({ behavior: 'smooth' });
                             }
                           }}
                           className="p-1 px-1.5 bg-indigo-50 hover:bg-slate-100/90 text-indigo-700 rounded transition-all font-bold text-[10px] cursor-pointer"
                           title="Editar Cadastro do Comprador"
                         >
                           Editar
                         </button>
                         <button
                           type="button"
                           onClick={() => {
                             if (confirm(`Deseja realmente excluir o comprador ${client.nome}?`)) {
                               handleDeleteClientLocal(client.id, client.nome);
                             }
                           }}
                           className="p-1 px-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded transition-all font-bold text-[10px] cursor-pointer"
                           title="Excluir do Evento"
                         >
                           Excluir
                         </button>
                       </div>
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
