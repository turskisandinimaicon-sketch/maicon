import { User, UserType } from '../types';
import { Shield, ClipboardList, UserCheck, Eye, HelpCircle, PhoneCall, Laptop } from 'lucide-react';

interface RoleSwitcherProps {
  currentUser: User | null;
  allUsers: User[];
  onSelectUser: (user: User | null, isPublicPortal?: boolean, publicClientId?: string) => void;
  onResetDatabase: () => void;
  isResetting: boolean;
}

export default function RoleSwitcher({
  currentUser,
  allUsers,
  onSelectUser,
  onResetDatabase,
  isResetting
}: RoleSwitcherProps) {
  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white text-xs py-2 px-4 shadow-md sm:flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3 mb-2 sm:mb-0">
        <div className="flex items-center gap-1.5 bg-indigo-600/30 text-indigo-400 font-semibold px-2 py-1 rounded border border-indigo-500/20">
          <Laptop className="w-3.5 h-3.5" />
          <span>SIMULADOR OPERACIONAL</span>
        </div>
        <span className="text-slate-400 hidden md:inline">|</span>
        <span className="text-slate-300 font-medium hidden md:inline">Mude de perfil para ver a fila rodar em tempo real:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Administrador */}
        <button
          onClick={() => {
            const admin = allUsers.find(u => u.role === 'ADMIN');
            const fallbackAdmin: User = { id: 'u-1', name: 'Bruno Reis', role: 'ADMIN', username: 'bruno.admin', status: 'ONLINE', completedCount: 22 };
            onSelectUser(admin || fallbackAdmin);
          }}
          className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1 transition-all cursor-pointer ${
            currentUser?.role === 'ADMIN' && currentUser.id !== 'public-portal'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
              : 'bg-slate-800 hover:bg-slate-700 text-amber-400'
          }`}
        >
          <Shield className="w-3 h-3" />
          <span>Admin</span>
        </button>

        {/* Recepcionista */}
        <button
          onClick={() => {
            const recep = allUsers.find(u => u.role === 'RECEPCIONISTA');
            const fallbackRecep: User = { id: 'u-8', name: 'Fernanda Lima', role: 'RECEPCIONISTA', username: 'fernanda.recep', status: 'ONLINE', completedCount: 19 };
            onSelectUser(recep || fallbackRecep);
          }}
          className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1 transition-all cursor-pointer ${
            currentUser?.role === 'RECEPCIONISTA'
              ? 'bg-blue-600 text-white font-bold shadow-sm'
              : 'bg-slate-800 hover:bg-slate-700 text-blue-400'
          }`}
        >
          <ClipboardList className="w-3 h-3" />
          <span>Recepção</span>
        </button>

        {/* Atendente */}
        <button
          onClick={() => {
            const atendente = allUsers.find(u => u.role === 'ATENDENTE' && u.name === 'Juliana Souza') || allUsers.find(u => u.role === 'ATENDENTE');
            const fallbackAtend: User = { id: 'u-2', name: 'Renan Silva', role: 'ATENDENTE', username: 'renan.atend', deskNumber: 'Guichê 01', status: 'DISPONIVEL', completedCount: 8 };
            onSelectUser(atendente || fallbackAtend);
          }}
          className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1 transition-all cursor-pointer ${
            currentUser?.role === 'ATENDENTE'
              ? 'bg-emerald-600 text-white font-bold shadow-sm'
              : 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
          }`}
        >
          <UserCheck className="w-3 h-3" />
          <span>Atendimento</span>
        </button>

        {/* Vistoriador */}
        <button
          onClick={() => {
            const vistoriador = allUsers.find(u => u.role === 'VISTORIADOR' && u.name === 'Tiago Mendes') || allUsers.find(u => u.role === 'VISTORIADOR');
            const fallbackVist: User = { id: 'u-6', name: 'Tiago Mendes', role: 'VISTORIADOR', username: 'tiago.vist', deskNumber: 'Área B', status: 'EM_VISTORIA', completedCount: 5 };
            onSelectUser(vistoriador || fallbackVist);
          }}
          className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1 transition-all cursor-pointer ${
            currentUser?.role === 'VISTORIADOR'
              ? 'bg-purple-600 text-white font-bold shadow-sm'
              : 'bg-slate-800 hover:bg-slate-700 text-purple-400'
          }`}
        >
          <Eye className="w-3 h-3" />
          <span>Vistoriador</span>
        </button>

        {/* Painel TV */}
        <button
          onClick={() => onSelectUser(null, false)} // null means TV panel
          className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1 transition-all cursor-pointer ${
            currentUser === null
              ? 'bg-rose-600 text-white font-bold shadow-sm'
              : 'bg-slate-800 hover:bg-slate-700 text-rose-400'
          }`}
        >
          <PhoneCall className="w-3 h-3" />
          <span>Painel TV</span>
        </button>

        {/* Portal do Cliente (Upload de Laudo Particular) */}
        <button
          onClick={() => onSelectUser({ id: 'public-portal', name: 'Portal Público', role: 'ADMIN', username: 'portal', status: 'ONLINE', completedCount: 0 }, true, 'c-9')}
          className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1 transition-all cursor-pointer ${
            currentUser?.id === 'public-portal'
              ? 'bg-teal-600 text-white font-bold shadow-sm'
              : 'bg-slate-800 hover:bg-slate-700 text-teal-400'
          }`}
        >
          <HelpCircle className="w-3 h-3" />
          <span>Portal Cliente</span>
        </button>

        <span className="text-slate-600 hidden lg:inline">|</span>

        {/* Botão de Reset */}
        <button
          onClick={onResetDatabase}
          disabled={isResetting}
          className="bg-red-950/40 hover:bg-red-950 text-red-400 border border-red-900/40 hover:border-red-800 text-xxs font-semibold px-2.5 py-1.5 rounded transition-all cursor-pointer disabled:opacity-55"
        >
          {isResetting ? 'Limpando...' : 'Zerar Cenário'}
        </button>
      </div>
    </div>
  );
}
