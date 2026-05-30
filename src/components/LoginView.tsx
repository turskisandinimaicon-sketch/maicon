import React, { useState } from 'react';
import { User, UserType } from '../types';
import { Building2, ShieldCheck, UserCheck, Lock, Eye, EyeOff, MonitorPlay, Key, HelpCircle } from 'lucide-react';

interface LoginViewProps {
  allUsers: User[];
  onLogin: (username: string, password: string) => Promise<void>;
  onSelectTvPanel: () => void;
  onSelectCustomerPortal: () => void;
  isLoading: boolean;
  errorMsg: string;
}

export default function LoginView({
  allUsers,
  onLogin,
  onSelectTvPanel,
  onSelectCustomerPortal,
  isLoading,
  errorMsg
}: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!username.trim() || !password.trim()) {
      setLocalError('Por favor, digite seu usuário (@) e sua senha individual.');
      return;
    }
    onLogin(username.trim(), password.trim());
  };

  const handleQuickLogin = (user: User) => {
    setUsername(user.username);
    setPassword(user.password || user.username);
    onLogin(user.username, user.password || user.username);
  };

  // Filtrar usuários para exibição organizada no painel de atalhos rápidos
  const admins = allUsers.filter(u => u.role === 'ADMIN');
  const receptionists = allUsers.filter(u => u.role === 'RECEPCIONISTA');
  const clerks = allUsers.filter(u => u.role === 'ATENDENTE');
  const inspectors = allUsers.filter(u => u.role === 'VISTORIADOR');

  return (
    <div className="bg-slate-100 min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center font-sans">
      <div className="max-w-4xl w-full grid md:grid-cols-12 gap-6 bg-white rounded-2xl shadow-lg border border-gray-150 overflow-hidden">
        
        {/* Lado Esquerdo: Formulário Corporativo de Login */}
        <div className="md:col-span-6 p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-indigo-650 p-2.5 rounded-xl text-white">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-sm tracking-tight text-slate-900 uppercase">Canto das Flores S.A.</h2>
                <span className="text-[10px] text-gray-500 font-mono tracking-wider block">CONSTRUTORA E INCORPORADORA</span>
              </div>
            </div>

            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
              Portal do Colaborador
            </h1>
            <p className="text-xxs text-slate-500 mt-1 mb-6">
              Acesso restrito para operadores de recepção, guichê e vistoria técnica chaves.
            </p>

            {(errorMsg || localError) && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xxs mb-5 leading-normal flex items-start gap-2 animate-shake">
                <span className="font-bold text-red-800">Erro:</span>
                <span>{errorMsg || localError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider block">Usuário no Sistema (@)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 font-mono text-xxs">@</span>
                  <input
                    type="text"
                    required
                    placeholder="bruno.admin, fernanda.recep..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pl-8 font-mono text-xxs focus:outline-none focus:ring-1 focus:ring-indigo-550 focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider block">Senha Individual</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pl-9 pr-9 text-xxs focus:outline-none focus:ring-1 focus:ring-indigo-550 focus:bg-white text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xxs py-2.5 rounded-lg cursor-pointer transition-all shadow-sm focus:ring-2 focus:ring-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Autenticando...' : 'Entrar no Sistema'}
              </button>
            </form>
          </div>

          <div className="border-t border-gray-100 pt-5 mt-6 grid grid-cols-2 gap-2 text-center">
            <button
              onClick={onSelectTvPanel}
              className="flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xxs font-bold py-2 px-3 border border-gray-200 rounded-lg cursor-pointer transition-all"
            >
              <MonitorPlay className="w-3.5 h-3.5 text-indigo-550" />
              <span>Painel TV Público</span>
            </button>
            <button
              onClick={onSelectCustomerPortal}
              className="flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xxs font-bold py-2 px-3 border border-gray-200 rounded-lg cursor-pointer transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-550" />
              <span>Portal do Cliente</span>
            </button>
          </div>
        </div>

        {/* Lado Direito: Atalhos Rápidos para Teste Rápidos */}
        <div className="md:col-span-6 bg-slate-900 text-white p-8 flex flex-col justify-between border-l border-slate-800">
          <div>
            <div className="flex items-center gap-1.5 text-indigo-400 mb-2">
              <Key className="w-4 h-4" />
              <h3 className="text-[10px] font-bold tracking-wider uppercase">Ambiente de Simulação e Homologação</h3>
            </div>
            
            <h2 className="text-base font-bold text-indigo-300">
              Acesso Rápido de Operator
            </h2>
            <p className="text-xxs text-slate-400 mt-0.5 mb-5 leading-relaxed">
              Clique em qualquer colaborador abaixo para preencher os inputs e efetuar login direto sem digitação de senhas.
            </p>

            <div className="space-y-4">
              {/* Administradores */}
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block mb-1.5">🔑 Administração</span>
                <div className="grid grid-cols-2 gap-2">
                  {admins.map(u => (
                    <button
                      key={u.id}
                      onClick={() => handleQuickLogin(u)}
                      className="bg-slate-800/60 hover:bg-indigo-950/40 hover:border-indigo-850 text-left p-1.5 px-2 rounded-lg border border-slate-700/60 text-xxs flex items-center justify-between group cursor-pointer transition-all overflow-hidden"
                    >
                      <span className="truncate pr-1">@{u.username}</span>
                      <span className="text-[8px] px-1 bg-indigo-950 text-indigo-300 border border-indigo-900 rounded scale-90">ADM</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recepção */}
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block mb-1.5">💁 Recepção / Cadastros</span>
                <div className="grid grid-cols-2 gap-2">
                  {receptionists.map(u => (
                    <button
                      key={u.id}
                      onClick={() => handleQuickLogin(u)}
                      className="bg-slate-800/60 hover:bg-teal-950/40 hover:border-teal-850 text-left p-1.5 px-2 rounded-lg border border-slate-700/60 text-xxs flex items-center justify-between group cursor-pointer transition-all overflow-hidden"
                    >
                      <span className="truncate pr-1">@{u.username}</span>
                      <span className="text-[8px] px-1 bg-teal-950 text-teal-300 border border-teal-900 rounded scale-90">RCP</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Atendimento de Mesas */}
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block mb-1.5">✒️ Atendimento (Mesas)</span>
                <div className="grid grid-cols-2 gap-2">
                  {clerks.map(u => (
                    <button
                      key={u.id}
                      onClick={() => handleQuickLogin(u)}
                      disabled={u.disabled}
                      className={`bg-slate-800/60 hover:bg-amber-950/40 hover:border-amber-850 text-left p-1.5 px-2 rounded-lg border border-slate-700/60 text-xxs flex items-center justify-between group transition-all overflow-hidden ${
                        u.disabled ? 'opacity-40 cursor-not-allowed hover:bg-slate-800/60' : 'cursor-pointer'
                      }`}
                    >
                      <span className="truncate pr-1">@{u.username}</span>
                      <span className="text-[8px] px-1 bg-amber-955 text-amber-300 border border-amber-900 rounded scale-90 truncate max-w-10">MESA</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Vistoria e Engenharia */}
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block mb-1.5">📐 Vistoriadores Técnicos</span>
                <div className="grid grid-cols-2 gap-2">
                  {inspectors.map(u => (
                    <button
                      key={u.id}
                      onClick={() => handleQuickLogin(u)}
                      disabled={u.disabled}
                      className={`bg-slate-800/60 hover:bg-rose-950/40 hover:border-rose-850 text-left p-1.5 px-2 rounded-lg border border-slate-700/60 text-xxs flex items-center justify-between group transition-all overflow-hidden ${
                        u.disabled ? 'opacity-40 cursor-not-allowed hover:bg-slate-800/60' : 'cursor-pointer'
                      }`}
                    >
                      <span className="truncate pr-1">@{u.username}</span>
                      <span className="text-[8px] px-1 bg-rose-955 text-rose-300 border border-rose-900 rounded scale-90">VIST</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>As senhas iniciais padrão correspondem ao nome de usuário (@username).</span>
          </div>
        </div>

      </div>
    </div>
  );
}
