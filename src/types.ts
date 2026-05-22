export type UserType = 'ADMIN' | 'RECEPCIONISTA' | 'ATENDENTE' | 'VISTORIADOR';

export interface User {
  id: string;
  name: string;
  role: UserType;
  username: string;
  deskNumber?: string; // Guichê para atendente, ou identificação de vistoriador
  status: 'ONLINE' | 'OFFLINE' | 'DISPONIVEL' | 'INDISPONIVEL' | 'EM_ATENDIMENTO' | 'EM_VISTORIA';
  completedCount: number;
}

export type PriorityType = 'NORMAL' | 'IDOSO' | 'PCD' | 'GESTANTE';

export type ClientStatus =
  | 'AGUARDANDO_RECEPCAO'
  | 'FILA_ATENDIMENTO'
  | 'EM_ATENDIMENTO'
  | 'AGUARDANDO_VISTORIADOR_PROPRIO'
  | 'FILA_VISTORIA'
  | 'EM_VISTORIA'
  | 'PROCESSO_ENCERRADO'
  | 'PENDENTE';

export interface DocumentAttachment {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  category: 'PROCURACAO' | 'RG' | 'CPF' | 'COMPROVANTE' | 'LAUDO_PARTICULAR' | 'OUTROS';
  url: string; // Base64 or local server path
}

export interface Client {
  id: string;
  nome: string;
  cpf: string;
  empreendimento: string;
  bloco: string;
  unidade: string;
  telefone: string;
  whatsapp?: string;
  email: string;
  statusContratual: 'QUITADO' | 'PENDENTE_FINANCIAMENTO' | 'EM_ANALISE';
  status: ClientStatus;
  observacoes?: string;
  priority: PriorityType;
  
  // Procurador
  possuiProcurador: boolean;
  procuradorNome?: string;
  procuradorCpf?: string;
  
  // Vistoriador Próprio / Particular
  possuiVistoriadorProprio: boolean;
  vistoriadorParticularNome?: string;
  vistoriadorParticularCrea?: string;
  liberadoParaVistoria: boolean; // Se liberado pelo atendente
  
  // Atendimento e Vistoria
  atendenteId?: string;
  atendenteNome?: string;
  guicheChamada?: string;
  vistoriadorId?: string;
  vistoriadorNome?: string;
  
  // Tempos de Operação
  tempoChegadaRecepcao?: string;
  tempoEntradaFilaAtendimento?: string;
  tempoInicioAtendimento?: string;
  tempoFimAtendimento?: string;
  tempoEntradaFilaVistoria?: string;
  tempoInicioVistoria?: string;
  tempoFimVistoria?: string;
  tempoProcessoEncerrado?: string;

  // Documentos anexados
  documentos: DocumentAttachment[];
  
  // Pesquisa de satisfação pós-evento (0 a 5)
  satisfactonScore?: number;
  satisfactonComment?: string;
}

export interface WhatsappMessage {
  id: string;
  clienteId: string;
  clienteNome: string;
  telefone: string;
  mensagem: string;
  statusEnvio: 'ENVIANDO' | 'ENTREGUE' | 'FALHOU';
  dataEnvio: string;
  dataEntrega?: string;
}

export interface QueueItem {
  id: string;
  clienteId: string;
  clienteNome: string;
  unidadeInfo: string; // Ex: "Bloco A - Apto 101"
  priority: PriorityType;
  entryTime: string;
  estimatedWaitMinutes: number;
}

export interface CallLog {
  id: string;
  clienteNome: string;
  unidade: string;
  localDestino: string; // Ex: "Guichê 03", "Vistoria Bloco B"
  responsavelNome: string;
  timestamp: string;
  status: 'PENDENTE' | 'CHAMANDO' | 'ATENDIDO';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: UserType;
  action: string;
  details: string;
}

// Alertas Operacionais Críticos
export interface OperationalAlert {
  id: string;
  type: 'QUEUE_CONGESTED' | 'CLIENT_WAITING_LONG' | 'OPERATOR_IDLE' | 'LONG_SERVICE';
  severity: 'WARNING' | 'DANGER' | 'INFO';
  title: string;
  description: string;
  createdAt: string;
}
