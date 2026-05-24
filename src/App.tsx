import { useState, useEffect } from 'react';
import { User, Client, AuditLog, WhatsappMessage, CallLog, OperationalAlert, PriorityType, EventConfig, Enterprise } from './types';
import RoleSwitcher from './components/RoleSwitcher';
import DashboardView from './components/DashboardView';
import RecepcaoView from './components/RecepcaoView';
import AtendimentoView from './components/AtendimentoView';
import VistoriaView from './components/VistoriaView';
import TvPanelView from './components/TvPanelView';
import PublicPortalView from './components/PublicPortalView';
import ImportView from './components/ImportView';
import LogsView from './components/LogsView';
import UserManagementView from './components/UserManagementView';
import { Shield, ClipboardList, UserCheck, Eye, PhoneCall, HelpCircle, FileSpreadsheet, Layers, RefreshCw, Users } from 'lucide-react';

export default function App() {
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [activeCalls, setActiveCalls] = useState<CallLog[]>([]);
  const [whatsappMessages, setWhatsappMessages] = useState<WhatsappMessage[]>([]);
  const [alerts, setAlerts] = useState<OperationalAlert[]>([]);
  const [eventConfig, setEventConfig] = useState<EventConfig>({
    enterpriseName: "Residencial Canto das Flores",
    logoUrl: "",
    logoType: "ICON",
    logoIconName: "Building2",
    eventDate: "23 de Maio de 2026"
  });
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  
  // Perfil Ativo Simulado no workspace (Começamos como Admin por padrão para dar o wow-factor)
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: "u-1",
    name: "Bruno Reis",
    role: "ADMIN",
    username: "bruno.admin",
    status: "ONLINE",
    completedCount: 22
  });
  const [isPublicPortal, setIsPublicPortal] = useState(false);
  const [publicActiveClientId, setPublicActiveClientId] = useState<string>('c-9');
  const [isResetting, setIsResetting] = useState(false);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(true);

  // Navegação dentro do painel do Admin
  const [adminTab, setAdminTab] = useState<'DASHBOARD' | 'IMPORT' | 'USER_MANAGEMENT' | 'AUDIT_LOGS'>('DASHBOARD');

  // Carregar dados de forma consolidada do servidor Node/Express
  const fetchAllData = async () => {
    try {
      const promises = [
        fetch('/api/clients')
          .then(res => res.ok ? res.json() : null)
          .then(data => { if (data) setClients(data); })
          .catch(err => console.warn("Erro ao buscar clientes:", err)),

        fetch('/api/users')
          .then(res => res.ok ? res.json() : null)
          .then(uData => {
            if (uData) {
              setUsers(uData);
              // Atualizar o cadastro local se logado
              if (currentUser && currentUser.id !== 'public-portal') {
                const freshUser = uData.find((u: any) => u.id === currentUser.id);
                if (freshUser) {
                  setCurrentUser(freshUser);
                }
              }
            }
          })
          .catch(err => console.warn("Erro ao buscar usuários:", err)),

        fetch('/api/logs')
          .then(res => res.ok ? res.json() : null)
          .then(data => { if (data) setLogs(data); })
          .catch(err => console.warn("Erro ao buscar logs:", err)),

        fetch('/api/messages')
          .then(res => res.ok ? res.json() : null)
          .then(data => { if (data) setWhatsappMessages(data); })
          .catch(err => console.warn("Erro ao buscar mensagens:", err)),

        fetch('/api/tv-calls')
          .then(res => res.ok ? res.json() : null)
          .then(data => { if (data) setActiveCalls(data); })
          .catch(err => console.warn("Erro ao buscar chamadas TV:", err)),

        fetch('/api/operational-alerts')
          .then(res => res.ok ? res.json() : null)
          .then(data => { if (data) setAlerts(data); })
          .catch(err => console.warn("Erro ao buscar alertas:", err)),

        fetch('/api/event-config')
          .then(res => res.ok ? res.json() : null)
          .then(data => { if (data) setEventConfig(data); })
          .catch(err => console.warn("Erro ao buscar configurações do evento:", err)),

        fetch('/api/enterprises')
          .then(res => res.ok ? res.json() : null)
          .then(data => { if (data) setEnterprises(data); })
          .catch(err => console.warn("Erro ao buscar catálogo de empreendimentos:", err))
      ];

      await Promise.all(promises);
    } catch (e) {
      console.warn("Erro na rotina de polling real-time:", e);
    }
  };

  // Efeito loop em "tempo real" (Polling de 3 segundos) para simulador sincero livre de drops de rede
  useEffect(() => {
    fetchAllData(); // Primeira carga
    const interval = setInterval(fetchAllData, 3000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // Carregar operador inicial padrão
  useEffect(() => {
    if (users.length > 0 && !isInitialLoadDone && !isPublicPortal) {
      // Começa logado como o Administrador primário
      const adminUser = users.find(u => u.role === 'ADMIN');
      if (adminUser) {
        setCurrentUser(adminUser);
        setIsInitialLoadDone(true);
      }
    }
  }, [users, isInitialLoadDone, isPublicPortal]);

  // Função Switch perfil
  const handleSelectUser = (user: User | null, isPublic: boolean = false, publicClientId?: string) => {
    setIsPublicPortal(isPublic);
    if (isPublic) {
      setCurrentUser({ id: 'public-portal', name: 'Portal Público', role: 'ADMIN', username: 'portal', status: 'ONLINE', completedCount: 0 });
      if (publicClientId) setPublicActiveClientId(publicClientId);
    } else {
      setCurrentUser(user);
    }
  };

  // Zerar Cenário (Reset)
  const handleResetDatabase = async () => {
    setIsResetting(true);
    try {
      const response = await fetch('/api/clients/reset', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients);
        await fetchAllData();
        alert("Simulador restaurado a fábrica! Todas as filas foram limpas.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  // Importar Excel/CSV pasta
  const handleImportData = async (importDataset: any[]): Promise<boolean> => {
    try {
      const response = await fetch('/api/clients/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileData: importDataset })
      });
      
      if (response.ok) {
        await fetchAllData();
        return true;
      }

      // Se não for OK, tenta pegar o erro do JSON ou texto
      let errorMessage = 'Formato inválido ou falha operacional no processamento.';
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } else {
        const textText = await response.text();
        errorMessage = `Retorno do Servidor (${response.status}): ${textText.substring(0, 150)}`;
      }
      
      alert(`Servidor recusou a importação:\n${errorMessage}`);
      return false;
    } catch (e: any) {
      console.error(e);
      alert(`Falha de rede ou conexão ao tentar importar compradores:\n${e.message || String(e)}`);
      return false;
    }
  };

  // Atualizar configurações globais do evento (Nome e Logo)
  const handleUpdateEventConfig = async (config: Partial<EventConfig>): Promise<boolean> => {
    try {
      const response = await fetch('/api/event-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (response.ok) {
        await fetchAllData();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // Criar ou Editar Empreendimento do Catálogo
  const handleSaveEnterprise = async (
    id: string | null, 
    name: string, 
    logoType?: 'ICON' | 'URL', 
    logoUrl?: string, 
    logoIconName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/enterprises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, logoType, logoUrl, logoIconName })
      });
      
      let errorMessage = 'Ocorreu um erro ao salvar o empreendimento.';
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        errorMessage = data.error || errorMessage;
      } else {
        const textText = await response.text();
        errorMessage = `Retorno do Servidor (${response.status}): ${textText.substring(0, 150)}`;
      }

      if (response.ok) {
        await fetchAllData();
        return { success: true };
      }
      return { success: false, error: errorMessage };
    } catch (e: any) {
      console.error(e);
      return { success: false, error: e.message || 'Erro de conexão com o servidor.' };
    }
  };

  // Excluir Empreendimento do Catálogo
  const handleDeleteEnterprise = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/enterprises/${id}`, {
        method: 'DELETE'
      });
      
      let errorMessage = 'Erro ao deletar o empreendimento.';
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        errorMessage = data.error || errorMessage;
      } else {
        const textText = await response.text();
        errorMessage = `Retorno do Servidor (${response.status}): ${textText.substring(0, 150)}`;
      }

      if (response.ok) {
        await fetchAllData();
        return { success: true };
      }
      return { success: false, error: errorMessage };
    } catch (e: any) {
      console.error(e);
      return { success: false, error: e.message || 'Erro de conexão com o servidor.' };
    }
  };

  const handleCheckIn = async (clientId: string, possuiProcurador: boolean, priority: PriorityType, observacoes: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ possuiProcurador, priority, observacoes })
      });
      if (response.ok) {
        await fetchAllData();
        alert("Cliente encaminhado para fila com prioridade registrada!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveFromQueue = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/remove-from-queue`, {
        method: 'POST'
      });
      if (response.ok) {
        await fetchAllData();
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao remover cliente da fila.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Roleta: Chamar próximo da Fila
  const handleCallNext = async (operatorId: string, type: 'ATENDIMENTO' | 'VISTORIA') => {
    try {
      const response = await fetch('/api/operators/call-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorId, type })
      });
      if (response.ok) {
        await fetchAllData();
      } else {
        const err = await response.json();
        alert(err.error || "Fila vazia ou nenhum cliente compatível no momento.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Atendente: Salvar informações da ficha técnica do cliente
  const handleSaveDetails = async (clientId: string, data: any) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/save-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Upload anexo de Documento de Identidade / CPF / Procuração
  const handleUploadDoc = async (clientId: string, data: { docName: string, category: string, base64Content: string }) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/upload-doc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Atendente finaliza e encaminha para vistoria (ou retém no vistoriador próprio)
  const handleReleaseToInspection = async (clientId: string, forceVistoriaFila: boolean) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/release-to-inspection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceVistoriaFila })
      });
      if (response.ok) {
        await fetchAllData();
        alert(forceVistoriaFila 
          ? "Comprador enviado com sucesso para a Roleta de Vistorias!" 
          : "Comprador retido e aguardando chegada do engenheiro particular cadastrado."
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Operador/Vistoriador altera seu próprio status
  const handleUpdateOperatorAvailability = async (userId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Vistoriador técnica finaliza vistorias e chaves
  const handleFinishInspection = async (clientId: string, data: { clientSatisfaction: number, satisfactionComment: string }) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/finish-inspection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Admin valida o laudo post-evento e encerra o processo
  const handleValidateLaudo = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/validate-laudo`, {
        method: 'POST'
      });
      if (response.ok) {
        await fetchAllData();
        alert("Laudo aprovado e assinado! Processo encerrado integralmente.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Cadastrar/Editar usuário
  const handleSaveUser = async (userData: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        await fetchAllData();
        return { success: true };
      }
      return { success: false, error: data.error || 'Ocorreu um erro no servidor ao salvar.' };
    } catch (e: any) {
      console.error(e);
      return { success: false, error: e.message || 'Erro de conexão com o servidor.' };
    }
  };

  // Excluir usuário
  const handleDeleteUser = async (userId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchAllData();
        return true;
      } else {
        const err = await response.json();
        if (err.error) {
          alert(err.error);
        }
        return false;
      }
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans antialiased text-slate-800 flex flex-col justify-start">
      
      {/* Seletor de Perfis no Simulador */}
      <RoleSwitcher
        currentUser={currentUser}
        allUsers={users}
        onSelectUser={handleSelectUser}
        onResetDatabase={handleResetDatabase}
        isResetting={isResetting}
      />

      {/* Renderização Condicional com Base no Perfil Ativo */}
      <div className="flex-1">
        {isPublicPortal ? (
          /* PORTAL PUBLICO: Recebe uploads de laudo */
          <PublicPortalView
            clients={clients}
            initialClientId={publicActiveClientId}
            onUploadLaudo={handleUploadDoc}
          />
        ) : currentUser === null ? (
          /* PAINEL DE CHAMADAS TV */
          <TvPanelView
            activeCalls={activeCalls}
            clients={clients}
            eventConfig={eventConfig}
          />
        ) : currentUser.role === 'ADMIN' ? (
          /* COCKPIT DO ADMINISTRADOR */
          <div className="flex-1 flex flex-col">
            <div className="bg-white border-b border-gray-150 sticky top-12 z-35 shadow-xxs">
              <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs">
                <div className="flex gap-4">
                  <button
                    onClick={() => setAdminTab('DASHBOARD')}
                    className={`py-3 px-2 font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      adminTab === 'DASHBOARD' ? 'border-b-2 border-indigo-650 text-indigo-700' : 'text-slate-500 hover:text-indigo-600'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Painel de Monitoramento
                  </button>
                  <button
                    onClick={() => setAdminTab('IMPORT')}
                    className={`py-3 px-2 font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      adminTab === 'IMPORT' ? 'border-b-2 border-indigo-650 text-indigo-700' : 'text-slate-500 hover:text-indigo-600'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Importar Planilha XLSX
                  </button>
                  <button
                    onClick={() => setAdminTab('AUDIT_LOGS')}
                    className={`py-3 px-2 font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      adminTab === 'AUDIT_LOGS' ? 'border-b-2 border-indigo-650 text-indigo-700' : 'text-slate-500 hover:text-indigo-600'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Auditoria de Ações
                  </button>
                  <button
                    onClick={() => setAdminTab('USER_MANAGEMENT')}
                    className={`py-3 px-2 font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      adminTab === 'USER_MANAGEMENT' ? 'border-b-2 border-indigo-650 text-indigo-700' : 'text-slate-500 hover:text-indigo-600'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    Gerenciar Usuários
                  </button>
                </div>

                <div className="text-slate-400 font-medium text-xxs hidden sm:inline">
                  Logado como: <strong className="text-slate-700">{currentUser.name} (Administração Geral)</strong>
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              {/* Render das abas Admin */}
              {adminTab === 'DASHBOARD' && (
                <DashboardView
                  clients={clients}
                  users={users}
                  logs={logs}
                  whatsappMessages={whatsappMessages}
                  alerts={alerts}
                  onUpdateUserStatus={handleUpdateOperatorAvailability}
                  onValidateLaudo={handleValidateLaudo}
                  onResetDemo={handleResetDatabase}
                  onImportData={handleImportData}
                  eventConfig={eventConfig}
                  onUpdateEventConfig={handleUpdateEventConfig}
                  enterprises={enterprises}
                  onSaveEnterprise={handleSaveEnterprise}
                  onDeleteEnterprise={handleDeleteEnterprise}
                />
              )}
              {adminTab === 'IMPORT' && (
                <ImportView
                  clients={clients}
                  onImportData={handleImportData}
                />
              )}
              {adminTab === 'AUDIT_LOGS' && (
                <LogsView
                  logs={logs}
                />
              )}
              {adminTab === 'USER_MANAGEMENT' && (
                <UserManagementView
                  users={users}
                  currentUser={currentUser}
                  onSaveUser={handleSaveUser}
                  onDeleteUser={handleDeleteUser}
                />
              )}
            </div>
          </div>
        ) : currentUser.role === 'RECEPCIONISTA' ? (
          /* PAINEL DE RECEPCAO */
          <RecepcaoView
            clients={clients}
            onCheckIn={handleCheckIn}
            onRemoveFromQueue={handleRemoveFromQueue}
          />
        ) : currentUser.role === 'ATENDENTE' ? (
          /* PAINEL DE ATENDENTE */
          <AtendimentoView
            currentOperator={currentUser}
            clients={clients}
            onCallNext={handleCallNext}
            onSaveDetails={handleSaveDetails}
            onUploadDoc={handleUploadDoc}
            onReleaseToInspection={handleReleaseToInspection}
          />
        ) : currentUser.role === 'VISTORIADOR' ? (
          /* PAINEL DO VISTORIADOR DE CHAVES */
          <VistoriaView
            currentOperator={currentUser}
            clients={clients}
            onCallNext={handleCallNext}
            onUpdateOperatorStatus={handleUpdateOperatorAvailability}
            onFinishInspection={handleFinishInspection}
          />
        ) : null}
      </div>

      <footer className="bg-slate-900 text-slate-500 text-xxs text-center py-4 border-t border-slate-800">
        <p>© 2026 Incorporadora & Construtora Canto das Flores S.A. Operação de Encerramento de Eventos de Chaves.</p>
        <p className="text-slate-600 text-[10px] mt-0.5">Sistemas integrados de recepção, filas inteligentes e pós-vendas técnicos via WhatsApp.</p>
      </footer>

    </div>
  );
}

