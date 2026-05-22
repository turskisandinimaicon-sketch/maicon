import React, { useState } from 'react';
import { User, UserType } from '../types';
import { 
  Users, UserPlus, Trash2, Pencil, Shield, UserCheck, 
  HelpCircle, AlertCircle, X, Check, Eye, EyeOff
} from 'lucide-react';

interface UserManagementViewProps {
  users: User[];
  currentUser: User | null;
  onSaveUser: (userData: Partial<User>) => Promise<boolean>;
  onDeleteUser: (userId: string) => Promise<boolean>;
}

export default function UserManagementView({
  users,
  currentUser,
  onSaveUser,
  onDeleteUser
}: UserManagementViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  
  // Estado para cadastro/edição
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Dados do Formulário
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserType>('ATENDENTE');
  const [deskNumber, setDeskNumber] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleOpenCreate = () => {
    setEditingUser(null);
    setName('');
    setUsername('');
    setRole('ATENDENTE');
    setDeskNumber('');
    setErrorMsg('');
    setSuccessMsg('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setUsername(user.username);
    setRole(user.role);
    setDeskNumber(user.deskNumber || '');
    setErrorMsg('');
    setSuccessMsg('');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim() || !username.trim()) {
      setErrorMsg('Os campos Nome Completo e Nome de Usuário são de preenchimento obrigatório.');
      return;
    }

    const payload: Partial<User> = {
      name: name.trim(),
      username: username.trim().toLowerCase(),
      role,
      deskNumber: (role === 'ATENDENTE' || role === 'VISTORIADOR') ? deskNumber.trim() : undefined
    };

    if (editingUser) {
      payload.id = editingUser.id;
    }

    const success = await onSaveUser(payload);
    if (success) {
      setSuccessMsg(editingUser ? 'Usuário atualizado com sucesso!' : 'Novo usuário cadastrado com sucesso!');
      setTimeout(() => {
        setIsFormOpen(false);
        setEditingUser(null);
      }, 1000);
    } else {
      setErrorMsg('Ocorreu um erro ao salvar o usuário. Verifique se o username já está em uso.');
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (userId === currentUser?.id) {
      alert("Ação Negada: Você não pode excluir a si mesmo enquanto estiver ativo no sistema.");
      return;
    }

    if (confirm(`Deseja realmente remover o usuário "${userName}" do sistema de forma definitiva?`)) {
      const success = await onDeleteUser(userId);
      if (success) {
        alert("Usuário excluído com sucesso!");
      } else {
        alert("Falha ao excluir o usuário. O sistema precisa reter pelo menos um Administrador.");
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (user.deskNumber && user.deskNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'ALL' ? true : user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeClass = (r: UserType) => {
    switch (r) {
      case 'ADMIN':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'RECEPCIONISTA':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ATENDENTE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'VISTORIADOR':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (r: UserType) => {
    switch (r) {
      case 'ADMIN': return 'Administrador';
      case 'RECEPCIONISTA': return 'Recepção';
      case 'ATENDENTE': return 'Atendente';
      case 'VISTORIADOR': return 'Vistoriador';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DISPONIVEL':
      case 'ONLINE':
        return 'bg-emerald-500';
      case 'EM_ATENDIMENTO':
      case 'EM_VISTORIA':
        return 'bg-indigo-500';
      case 'INDISPONIVEL':
        return 'bg-orange-400';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-5 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-650" />
            Controle de Operadores e Hierarquia
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Administre credenciais, remaneje guichês ou altere perfis de acesso na hierarquia operacional (Adm, Recepção, Atendimento e Vistoria).
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          Cadastrar Novo Operador
        </button>
      </div>

      {/* Filtros e Barra de Pesquisa */}
      <div className="bg-white rounded-xl border border-gray-150 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Buscar por nome, username ou mesa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-gray-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xxs text-gray-500 font-bold uppercase tracking-wider">Filtrar por Função:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 border border-gray-200 text-xs rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">Todas as Hierarquias</option>
            <option value="ADMIN">Administrador</option>
            <option value="RECEPCIONISTA">Recepção</option>
            <option value="ATENDENTE">Atendente</option>
            <option value="VISTORIADOR">Vistoriador</option>
          </select>
        </div>
      </div>

      {/* Grid Central */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Lista de Usuários */}
        <div className="lg:col-span-8 bg-white border border-gray-150 rounded-xl shadow-xs overflow-hidden">
          <div className="border-b border-gray-100 bg-slate-50 p-4 flex justify-between items-center">
            <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider">Lista de Usuários ({filteredUsers.length})</span>
            <span className="text-[10px] text-gray-400 font-mono">Simulador em tempo real</span>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-16 text-xs text-gray-400">
                Nenhum operador localizado com os parâmetros aplicados.
              </div>
            ) : (
              filteredUsers.map(user => (
                <div key={user.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    
                    {/* Indicador de Status Espacial */}
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center font-bold text-xs text-slate-600 uppercase border border-slate-200">
                        {user.name.substring(0, 2)}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(user.status)}`} title={user.status} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm truncate">{user.name}</span>
                        {user.id === currentUser?.id && (
                          <span className="bg-indigo-50 text-indigo-700 font-extrabold text-[9px] px-1.5 py-0.2 rounded border border-indigo-200/50 uppercase">Você</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-0.5 text-xxs text-gray-400 flex-wrap">
                        <span className="font-mono">@{user.username}</span>
                        <span>•</span>
                        {user.deskNumber ? (
                          <span className="font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">Desk: {user.deskNumber}</span>
                        ) : (
                          <span className="italic">Nenhum posto físico</span>
                        )}
                        <span>•</span>
                        <span>{user.completedCount} entregas completas</span>
                      </div>
                    </div>

                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getRoleBadgeClass(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(user)}
                        title="Editar Informações"
                        className="p-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 rounded-lg transition-colors border border-gray-200 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        disabled={user.id === currentUser?.id}
                        title="Remover Operador"
                        className={`p-1.5 bg-slate-50 text-slate-500 rounded-lg transition-colors border border-gray-200 cursor-pointer ${
                          user.id === currentUser?.id 
                            ? 'opacity-35 cursor-not-allowed' 
                            : 'hover:bg-red-50 hover:text-red-650 hover:border-red-200'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

        {/* Formulario / Contexto Lateral */}
        <div className="lg:col-span-4 space-y-4">
          
          {isFormOpen ? (
            /* Formulário Ativado */
            <div className="bg-white rounded-xl border border-indigo-150 p-5 shadow-xs space-y-4 animate-fade-in relative">
              <button 
                onClick={() => setIsFormOpen(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <h3 className="font-extrabold text-slate-905 text-sm">
                  {editingUser ? 'Atualizar Operador' : 'Adicionar Operador'}
                </h3>
                <span className="text-xxs text-gray-500">Insira as credenciais do novo elemento de equipe.</span>
              </div>

              {errorMsg && (
                <div className="bg-red-50 text-red-750 text-xxs p-2.5 rounded-lg border border-red-100 flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-50 text-emerald-750 text-xxs p-2.5 rounded-lg border border-emerald-100 flex items-start gap-1.5 text-center font-bold">
                  <Check className="w-4 h-4 shrink-0 animate-bounce" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 block">Nome Completo do Colaborador</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João Roberto Costa"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-250 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-550 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 block">Nome de Usuário (@)</label>
                    <input
                      type="text"
                      required
                      placeholder="joao.roberto"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-250 rounded-lg p-2 font-mono text-xxs focus:outline-none focus:ring-1 focus:ring-indigo-550 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 block">Cargo / Hierarquia</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserType)}
                      className="w-full bg-slate-50 border border-gray-250 rounded-lg p-2"
                    >
                      <option value="ADMIN">Administrador</option>
                      <option value="RECEPCIONISTA">Recepção</option>
                      <option value="ATENDENTE">Atendentes (Mesa)</option>
                      <option value="VISTORIADOR">Vistoriadores</option>
                    </select>
                  </div>
                </div>

                {/* Exibição condicional de posto/guiche/mesa */}
                {(role === 'ATENDENTE' || role === 'VISTORIADOR') && (
                  <div className="space-y-1 animate-fade-in bg-slate-50 p-2.5 rounded-lg border border-gray-100">
                    <label className="text-[11px] font-bold text-gray-700 block">Número de Guichê, Mesa ou Equipe</label>
                    <input
                      type="text"
                      placeholder="Ex: Guichê 03, Vistoria Bloco A, Engenheiro-01"
                      required
                      value={deskNumber}
                      onChange={(e) => setDeskNumber(e.target.value)}
                      className="w-full bg-white border border-gray-250 rounded-lg p-2 text-xxs focus:outline-none focus:ring-1 focus:ring-indigo-550"
                    />
                    <span className="text-[9px] text-gray-400 mt-1 block leading-normal">
                      Esta informação aparecerá nas chamadas no Painel da TV para que os compradores saibam onde ir.
                    </span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-bold text-xxs cursor-pointer"
                  >
                    Descartar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-650 hover:bg-indigo-700 text-white py-2 rounded-lg font-bold text-xxs cursor-pointer shadow-sm"
                  >
                    Salvar Dados
                  </button>
                </div>

              </form>

            </div>
          ) : (
            /* Card Informativo */
            <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-300">Estrutura de Hierarquia</h3>
              </div>

              <div className="space-y-3.5 text-xxs">
                <div className="bg-slate-850 p-2.5 rounded-lg border-l-2 border-amber-400 space-y-1">
                  <span className="font-bold block text-slate-200">1. Administrador Geral (ADM):</span>
                  <p className="text-gray-400 leading-relaxed">
                    Acesso pleno a monitoramento, relatórios de produtividade, validação de laudos técnicos de engenharia de terceiros e controle de equipe.
                  </p>
                </div>
                
                <div className="bg-slate-850 p-2.5 rounded-lg border-l-2 border-blue-400 space-y-1">
                  <span className="font-bold block text-slate-200">2. Recepção (Recepção):</span>
                  <p className="text-gray-400 leading-relaxed">
                    Identificação de compradores no evento, triagem prioritária, checagem e vinculação de procurações oficiais e direcionamento na fila.
                  </p>
                </div>

                <div className="bg-slate-850 p-2.5 rounded-lg border-l-2 border-emerald-400 space-y-1">
                  <span className="font-bold block text-slate-200">3. Atendimento Interno (Atendente):</span>
                  <p className="text-gray-400 leading-relaxed">
                    Coleta de assinaturas contratuais, validação dos documentos RG/CPF e encaminhamento em lote direcionado para os Engenheiros/Vistoriadores.
                  </p>
                </div>

                <div className="bg-slate-850 p-2.5 rounded-lg border-l-2 border-purple-400 space-y-1">
                  <span className="font-bold block text-slate-200">4. Vistoria de Entrega (Vistoriador):</span>
                  <p className="text-gray-400 leading-relaxed">
                    Acompanhamento técnico nas unidades, registro de anotações físicas de correções, entrega das chaves e avaliação de satisfação do morador.
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
