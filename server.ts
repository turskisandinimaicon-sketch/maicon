import express from "express";
import path from "path";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { initializeFirestore, setLogLevel, doc, getDoc, getDocs, setDoc, deleteDoc, collection } from "firebase/firestore";
import { Client, User, AuditLog, WhatsappMessage, CallLog, OperationalAlert, DocumentAttachment, EventConfig, Enterprise } from "./src/types";

const app = express();
const PORT = 3000;

// Config limits for large attachments (Up to 20MB for PDF/Imgs as specified)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Firebase initialization settings
let db: any = null;
let useFirebase = false;

// Try to initialize Firebase
async function initFirebase() {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    try {
      const rawConfig = fs.readFileSync(configPath, "utf8");
      const firebaseConfig = JSON.parse(rawConfig);
      
      const firebaseApp = initializeApp(firebaseConfig);
      
      // Mute verbose Firebase console warnings/errors
      setLogLevel('error');
      
      // Initialize firestore with forced long-polling to prevent persistent gRPC idle stream disconnects
      db = initializeFirestore(firebaseApp, {
        experimentalForceLongPolling: true,
      }, firebaseConfig.firestoreDatabaseId);
      
      useFirebase = true;
      console.log("[FIREBASE] Inicializado com sucesso no backend com experimentalForceLongPolling.");
      
      // Load current state from Firestore or seed it if empty
      await syncFromFirestore();
    } catch (err) {
      console.error("[FIREBASE] Falha ao inicializar Firebase:", err);
    }
  } else {
    console.log("[FIREBASE] firebase-applet-config.json não localizado. Operando apenas em fluxo in-memory.");
  }
}

// Function to pull all data from Firestore, or push defaults if collections are empty
async function syncFromFirestore() {
  if (!useFirebase || !db) return;
  
  try {
    console.log("[FIREBASE] Sincronizando dados com o Firestore...");
    
    // 1. Sync EventConfig
    const configDocRef = doc(db, "eventConfig", "config");
    const configSnapshot = await getDoc(configDocRef);
    if (configSnapshot.exists()) {
      eventConfig = configSnapshot.data() as EventConfig;
    } else {
      await setDoc(configDocRef, eventConfig);
    }

    // 2. Sync Enterprises
    const enterprisesColl = collection(db, "enterprises");
    const enterprisesSnapshot = await getDocs(enterprisesColl);
    if (!enterprisesSnapshot.empty) {
      enterprises = enterprisesSnapshot.docs.map(doc => doc.data() as Enterprise);
    } else {
      for (const ent of enterprises) {
        await setDoc(doc(db, "enterprises", ent.id), ent);
      }
    }

    // 3. Sync Users
    const usersColl = collection(db, "users");
    const usersSnapshot = await getDocs(usersColl);
    if (!usersSnapshot.empty) {
      users = usersSnapshot.docs.map(doc => doc.data() as User);
    } else {
      for (const user of users) {
        await setDoc(doc(db, "users", user.id), user);
      }
    }

    // 4. Sync Clients
    const clientsColl = collection(db, "clients");
    const clientsSnapshot = await getDocs(clientsColl);
    if (!clientsSnapshot.empty) {
      clients = clientsSnapshot.docs.map(doc => doc.data() as Client);
    } else {
      for (const cl of clients) {
        await setDoc(doc(db, "clients", cl.id), cl);
      }
    }

    // 5. Sync activeCalls
    const callsColl = collection(db, "activeCalls");
    const callsSnapshot = await getDocs(callsColl);
    if (!callsSnapshot.empty) {
      activeCalls = callsSnapshot.docs.map(doc => doc.data() as CallLog);
    } else {
      for (const call of activeCalls) {
        await setDoc(doc(db, "activeCalls", call.id), call);
      }
    }

    // 6. Sync whatsappMessages
    const msgsColl = collection(db, "whatsappMessages");
    const msgsSnapshot = await getDocs(msgsColl);
    if (!msgsSnapshot.empty) {
      whatsappMessages = msgsSnapshot.docs.map(doc => doc.data() as WhatsappMessage);
    }

    // 7. Sync auditLogs
    const auditColl = collection(db, "auditLogs");
    const auditSnapshot = await getDocs(auditColl);
    if (!auditSnapshot.empty) {
      auditLogs = auditSnapshot.docs.map(doc => doc.data() as AuditLog);
    }

    console.log("[FIREBASE] Sincronização concluída com sucesso.");
  } catch (err) {
    console.error("[FIREBASE] Erro ao sincronizar com o Firestore:", err);
  }
}

// Helpers to save individual objects on actions
async function saveEventConfig() {
  if (useFirebase && db) {
    try {
      await setDoc(doc(db, "eventConfig", "config"), eventConfig);
    } catch (err) {
      console.error("Erro saving eventConfig: ", err);
    }
  }
}

async function saveEnterprise(ent: Enterprise) {
  if (useFirebase && db) {
    try {
      await setDoc(doc(db, "enterprises", ent.id), ent);
    } catch (err) {
      console.error("Erro saving enterprise: ", err);
    }
  }
}

async function deleteEnterpriseDoc(id: string) {
  if (useFirebase && db) {
    try {
      await deleteDoc(doc(db, "enterprises", id));
    } catch (err) {
      console.error("Erro deleting enterprise: ", err);
    }
  }
}

async function saveUser(usr: User) {
  if (useFirebase && db) {
    try {
      await setDoc(doc(db, "users", usr.id), usr);
    } catch (err) {
      console.error("Erro saving user: ", err);
    }
  }
}

async function deleteUserDoc(id: string) {
  if (useFirebase && db) {
    try {
      await deleteDoc(doc(db, "users", id));
    } catch (err) {
      console.error("Erro deleting user: ", err);
    }
  }
}

async function saveClient(c: Client) {
  if (useFirebase && db) {
    try {
      await setDoc(doc(db, "clients", c.id), c);
    } catch (err) {
      console.error("Erro saving client: ", err);
    }
  }
}

async function saveCall(call: CallLog) {
  if (useFirebase && db) {
    try {
      await setDoc(doc(db, "activeCalls", call.id), call);
    } catch (err) {
      console.error("Erro saving call: ", err);
    }
  }
}

async function saveMessage(msg: WhatsappMessage) {
  if (useFirebase && db) {
    try {
      await setDoc(doc(db, "whatsappMessages", msg.id), msg);
    } catch (err) {
      console.error("Erro saving message: ", err);
    }
  }
}

async function saveLog(log: AuditLog) {
  if (useFirebase && db) {
    try {
      await setDoc(doc(db, "auditLogs", log.id), log);
    } catch (err) {
      console.error("Erro saving log: ", err);
    }
  }
}

// --- BASE DE DADOS EM MEMÓRIA (PRÉ-POPULADA COM DADOS REALISTAS) ---
let clients: Client[] = [
  {
    id: "c-1",
    nome: "Jorge Silva dos Santos",
    cpf: "123.456.789-01",
    empreendimento: "Residencial Canto das Flores",
    bloco: "Bloco A",
    unidade: "Apto 203",
    telefone: "(11) 98765-4321",
    email: "jorge.silva@gmail.com",
    statusContratual: "QUITADO",
    status: "AGUARDANDO_RECEPCAO",
    priority: "NORMAL",
    possuiProcurador: false,
    possuiVistoriadorProprio: false,
    liberadoParaVistoria: false,
    documentos: [],
  },
  {
    id: "c-2",
    nome: "Mariana de Medeiros",
    cpf: "234.567.890-12",
    empreendimento: "Residencial Canto das Flores",
    bloco: "Bloco B",
    unidade: "Apto 101",
    telefone: "(11) 97123-4567",
    email: "mariana.medeiros@hotmail.com",
    statusContratual: "QUITADO",
    status: "AGUARDANDO_RECEPCAO",
    priority: "GESTANTE",
    possuiProcurador: false,
    possuiVistoriadorProprio: false,
    liberadoParaVistoria: false,
    documentos: [],
  },
  {
    id: "c-3",
    nome: "Carlos Alberto Costa",
    cpf: "345.678.901-23",
    empreendimento: "Residencial Canto das Flores",
    bloco: "Bloco A",
    unidade: "Apto 402",
    telefone: "(21) 99345-6789",
    email: "carlos.costa@yahoo.com.br",
    statusContratual: "QUITADO",
    status: "FILA_ATENDIMENTO",
    priority: "IDOSO",
    possuiProcurador: false,
    possuiVistoriadorProprio: false,
    liberadoParaVistoria: false,
    tempoChegadaRecepcao: "16:10",
    tempoEntradaFilaAtendimento: "16:12",
    documentos: [],
  },
  {
    id: "c-4",
    nome: "Amanda Rodrigues Lima",
    cpf: "456.789.012-34",
    empreendimento: "Vila Alpina Premium",
    bloco: "Torre 1",
    unidade: "Apto 1205",
    telefone: "(11) 96543-2109",
    email: "amanda.lima@outlook.com",
    statusContratual: "EM_ANALISE",
    status: "EM_ATENDIMENTO",
    priority: "NORMAL",
    possuiProcurador: true,
    procuradorNome: "Renato Lima dos Santos",
    procuradorCpf: "098.765.432-10",
    possuiVistoriadorProprio: false,
    liberadoParaVistoria: false,
    atendenteId: "u-3",
    atendenteNome: "Juliana Souza",
    guicheChamada: "Guichê 02",
    tempoChegadaRecepcao: "15:45",
    tempoEntradaFilaAtendimento: "15:47",
    tempoInicioAtendimento: "15:55",
    documentos: [
      {
        id: "doc-1",
        name: "procuracao_assinada.pdf",
        type: "application/pdf",
        size: "1.2 MB",
        uploadedAt: "15:58",
        category: "PROCURACAO",
        url: "#"
      }
    ],
  },
  {
    id: "c-5",
    nome: "Roberto de Souza Neto",
    cpf: "567.890.123-45",
    empreendimento: "Residencial Canto das Flores",
    bloco: "Bloco B",
    unidade: "Apto 304",
    telefone: "(11) 98877-6655",
    email: "roberto.souza@gmail.com",
    statusContratual: "QUITADO",
    status: "AGUARDANDO_VISTORIADOR_PROPRIO",
    priority: "NORMAL",
    possuiProcurador: false,
    possuiVistoriadorProprio: true,
    vistoriadorParticularNome: "Arq. Fabiano Toledo",
    vistoriadorParticularCrea: "CREA SP 501239-A",
    liberadoParaVistoria: false,
    atendenteId: "u-2",
    atendenteNome: "Renan Silva",
    guicheChamada: "Guichê 01",
    tempoChegadaRecepcao: "15:10",
    tempoEntradaFilaAtendimento: "15:12",
    tempoInicioAtendimento: "15:20",
    tempoFimAtendimento: "15:35",
    documentos: [],
  },
  {
    id: "c-6",
    nome: "Fernanda Alencar Santos",
    cpf: "678.901.234-56",
    empreendimento: "Residencial Canto das Flores",
    bloco: "Bloco C",
    unidade: "Apto 102",
    telefone: "(11) 99112-2334",
    email: "fernanda.alencar@gmail.com",
    statusContratual: "PENDENTE_FINANCIAMENTO",
    status: "FILA_VISTORIA",
    priority: "NORMAL",
    possuiProcurador: false,
    possuiVistoriadorProprio: false,
    liberadoParaVistoria: true,
    atendenteId: "u-4",
    atendenteNome: "Marcos Castro",
    guicheChamada: "Guichê 03",
    tempoChegadaRecepcao: "15:00",
    tempoEntradaFilaAtendimento: "15:02",
    tempoInicioAtendimento: "15:08",
    tempoFimAtendimento: "15:25",
    tempoEntradaFilaVistoria: "15:25",
    documentos: [],
  },
  {
    id: "c-7",
    nome: "Guilherme Santos Prado",
    cpf: "789.012.345-67",
    empreendimento: "Residencial Canto das Flores",
    bloco: "Bloco A",
    unidade: "Apto 501",
    telefone: "(11) 98223-3445",
    email: "guilherme.prado@live.com",
    statusContratual: "QUITADO",
    status: "EM_VISTORIA",
    priority: "PCD",
    possuiProcurador: false,
    possuiVistoriadorProprio: true,
    vistoriadorParticularNome: "Eng. Cláudio Marins",
    vistoriadorParticularCrea: "CREA SP 491321",
    liberadoParaVistoria: true,
    atendenteId: "u-2",
    atendenteNome: "Renan Silva",
    guicheChamada: "Guichê 01",
    vistoriadorId: "u-6",
    vistoriadorNome: "Tiago Mendes",
    tempoChegadaRecepcao: "14:15",
    tempoEntradaFilaAtendimento: "14:17",
    tempoInicioAtendimento: "14:24",
    tempoFimAtendimento: "14:40",
    tempoEntradaFilaVistoria: "14:42",
    tempoInicioVistoria: "14:50",
    documentos: [],
  },
  {
    id: "c-8",
    nome: "Juliana Ferreira Dias",
    cpf: "890.123.456-78",
    empreendimento: "Residencial Canto das Flores",
    bloco: "Bloco B",
    unidade: "Apto 204",
    telefone: "(11) 97445-5667",
    email: "juliana.dias@gmail.com",
    statusContratual: "QUITADO",
    status: "PROCESSO_ENCERRADO",
    priority: "NORMAL",
    possuiProcurador: false,
    possuiVistoriadorProprio: false,
    liberadoParaVistoria: true,
    atendenteId: "u-3",
    atendenteNome: "Juliana Souza",
    guicheChamada: "Guichê 02",
    vistoriadorId: "u-5",
    vistoriadorNome: "Aline Pereira",
    tempoChegadaRecepcao: "13:00",
    tempoEntradaFilaAtendimento: "13:02",
    tempoInicioAtendimento: "13:10",
    tempoFimAtendimento: "13:28",
    tempoEntradaFilaVistoria: "13:30",
    tempoInicioVistoria: "13:40",
    tempoFimVistoria: "14:25",
    tempoProcessoEncerrado: "14:30",
    documentos: [],
  },
  {
    id: "c-9",
    nome: "Lucas Mendes Correia",
    cpf: "901.234.567-89",
    empreendimento: "Residencial Canto das Flores",
    bloco: "Bloco C",
    unidade: "Apto 404",
    telefone: "(11) 99887-1122",
    email: "lucas.mendes@uol.com.br",
    statusContratual: "QUITADO",
    status: "PENDENTE", // Aguardando aprovação ou pendente geral
    priority: "NORMAL",
    possuiProcurador: false,
    possuiVistoriadorProprio: true,
    vistoriadorParticularNome: "ProInspect Ltda",
    liberadoParaVistoria: true,
    atendenteId: "u-4",
    atendenteNome: "Marcos Castro",
    guicheChamada: "Guichê 03",
    vistoriadorId: "u-7",
    vistoriadorNome: "Patricia Vieira",
    tempoChegadaRecepcao: "13:15",
    tempoEntradaFilaAtendimento: "13:18",
    tempoInicioAtendimento: "13:30",
    tempoFimAtendimento: "13:50",
    tempoEntradaFilaVistoria: "13:50",
    tempoInicioVistoria: "14:00",
    tempoFimVistoria: "14:48",
    documentos: [
      {
        id: "doc-ext-laudo",
        name: "laudo_engenharia_v1.pdf",
        type: "application/pdf",
        size: "4.8 MB",
        uploadedAt: "15:02",
        category: "LAUDO_PARTICULAR",
        url: "#"
      }
    ],
  },
  {
    id: "c-10",
    nome: "Heitor Prado Gusmão",
    cpf: "012.345.678-90",
    empreendimento: "Residencial Canto das Flores",
    bloco: "Bloco B",
    unidade: "Apto 105",
    telefone: "(11) 96123-8844",
    email: "heitor.gusmao@gmail.com",
    statusContratual: "QUITADO",
    status: "FILA_ATENDIMENTO",
    priority: "NORMAL",
    possuiProcurador: false,
    possuiVistoriadorProprio: false,
    liberadoParaVistoria: false,
    tempoChegadaRecepcao: "16:20",
    tempoEntradaFilaAtendimento: "16:21",
    documentos: [],
  }
];

let users: User[] = [
  { id: "u-1", name: "Bruno Reis", role: "ADMIN", username: "bruno.admin", status: "ONLINE", completedCount: 22 },
  { id: "u-2", name: "Renan Silva", role: "ATENDENTE", username: "renan.atend", deskNumber: "Guichê 01", status: "DISPONIVEL", completedCount: 8 },
  { id: "u-3", name: "Juliana Souza", role: "ATENDENTE", username: "juliana.atend", deskNumber: "Guichê 02", status: "EM_ATENDIMENTO", completedCount: 11 },
  { id: "u-4", name: "Marcos Castro", role: "ATENDENTE", username: "marcos.atend", deskNumber: "Guichê 03", status: "DISPONIVEL", completedCount: 9 },
  { id: "u-5", name: "Aline Pereira", role: "VISTORIADOR", username: "aline.vist", deskNumber: "Área A", status: "DISPONIVEL", completedCount: 6 },
  { id: "u-6", name: "Tiago Mendes", role: "VISTORIADOR", username: "tiago.vist", deskNumber: "Área B", status: "EM_VISTORIA", completedCount: 5 },
  { id: "u-7", name: "Patricia Vieira", role: "VISTORIADOR", username: "patricia.vist", deskNumber: "Área C", status: "INDISPONIVEL", completedCount: 4 },
  { id: "u-8", name: "Fernanda Lima", role: "RECEPCIONISTA", username: "fernanda.recep", status: "ONLINE", completedCount: 19 },
];

let auditLogs: AuditLog[] = [
  { id: "l-1", timestamp: "16:30:12", user: "Fernanda Lima", role: "RECEPCIONISTA", action: "Presença Confirmada", details: "Check-in do cliente Heitor Prado Gusmão finalizado com sucesso" },
  { id: "l-2", timestamp: "16:21:05", user: "Fernanda Lima", role: "RECEPCIONISTA", action: "Fila Atendimento", details: "Heitor Prado Gusmão inserido na fila de Atendimento Geral" },
  { id: "l-3", timestamp: "16:10:44", user: "Juliana Souza", role: "ATENDENTE", action: "Novo Atendimento", details: "Iniciou atendimento para Amanda Rodrigues Lima no Guichê 02" },
  { id: "l-4", timestamp: "15:58:22", user: "Juliana Souza", role: "ATENDENTE", action: "Upload Documento", details: "Anexou procuracao_assinada.pdf para Amanda Rodrigues Lima" },
  { id: "l-5", timestamp: "15:35:10", user: "Renan Silva", role: "ATENDENTE", action: "Aguardando Vistoriador", details: "Sinalizado que Roberto de Souza Neto possui vistoriador particular" },
  { id: "l-6", timestamp: "15:25:00", user: "Marcos Castro", role: "ATENDENTE", action: "Liberação Vistoria", details: "Fernanda Alencar Santos liberada e encaminhada para fila de vistoria" },
  { id: "l-7", timestamp: "14:50:18", user: "Tiago Mendes", role: "VISTORIADOR", action: "Início Vistoria", details: "Vistoria iniciada para Guilherme Santos Prado (unidade Apto 501)" },
];

let whatsappMessages: WhatsappMessage[] = [
  {
    id: "w-1",
    clienteId: "c-8",
    clienteNome: "Juliana Ferreira Dias",
    telefone: "(11) 97445-5667",
    mensagem: "Olá, Juliana Ferreira Dias. Seu processo de entrega da unidade foi concluído com sucesso. Caso possua laudo de vistoria particular, utilize o link abaixo para anexar o documento em PDF: http://localhost:3000/public-portal?c=c-8",
    statusEnvio: "ENTREGUE",
    dataEnvio: "2026-05-22 14:30:00",
    dataEntrega: "2026-05-22 14:31:05"
  }
];

let activeCalls: CallLog[] = [
  { id: "call-1", clienteNome: "Amanda Rodrigues Lima", unidade: "Apto 1205", localDestino: "Guichê 02", responsavelNome: "Juliana Souza", timestamp: "16:10", status: "ATENDIDO" },
  { id: "call-2", clienteNome: "Guilherme Santos Prado", unidade: "Apto 501", localDestino: "Área B (Eng. Tiago)", responsavelNome: "Tiago Mendes", timestamp: "14:50", status: "ATENDIDO" }
];

let eventConfig: EventConfig = {
  enterpriseName: "Residencial Canto das Flores",
  logoUrl: "",
  logoType: "ICON",
  logoIconName: "Building2",
  eventDate: "23 de Maio de 2026"
};

let enterprises: Enterprise[] = [
  { id: "ent-1", name: "Residencial Canto das Flores" },
  { id: "ent-2", name: "Condomínio Belle Vue" },
  { id: "ent-3", name: "Residencial Solar da Barra" },
  { id: "ent-4", name: "Splendor Park Residence" }
];

// --- AUXILIARY FUNCTIONS ---
function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// Criar auditoria automática
function logAction(user: string, role: string, action: string, details: string) {
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  const auditItem = {
    id: generateId(),
    timestamp: timeStr,
    user,
    role: role as any,
    action,
    details
  };
  auditLogs.unshift(auditItem);
  saveLog(auditItem);
}

// Simulador de envio de Whatsapp automático
function sendAutoWhatsapp(client: Client) {
  const linkPortal = `${process.env.APP_URL || 'http://localhost:3000'}/public-portal?c=${client.id}`;
  const now = new Date();
  const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);

  const customMessage: WhatsappMessage = {
    id: "w-" + generateId(),
    clienteId: client.id,
    clienteNome: client.nome,
    telefone: client.telefone,
    mensagem: `Olá, ${client.nome}. Seu processo de entrega da unidade foi concluído com sucesso. Caso possua laudo de vistoria particular, utilize o link abaixo para anexar o documento em PDF:\n\n${linkPortal}\n\nEquipe de Entrega de Chaves.`,
    statusEnvio: "ENTREGUE",
    dataEnvio: dateStr,
    dataEntrega: dateStr
  };

  whatsappMessages.unshift(customMessage);
  saveMessage(customMessage);
  logAction("Sistema WhatsApp", "ADMIN", "WhatsApp Enviado", `Notificação enviada para ${client.nome} (${client.telefone})`);
}

// --- APIS ---

// Obter configurações do evento ativo
app.get("/api/event-config", (req, res) => {
  res.json(eventConfig);
});

// Atualizar configurações do evento (Nome e Logo)
app.post("/api/event-config", async (req, res) => {
  const { enterpriseName, logoUrl, logoType, logoIconName, eventDate } = req.body;
  if (enterpriseName) eventConfig.enterpriseName = enterpriseName;
  if (logoUrl !== undefined) eventConfig.logoUrl = logoUrl;
  if (logoType) eventConfig.logoType = logoType;
  if (logoIconName) eventConfig.logoIconName = logoIconName;
  if (eventDate) eventConfig.eventDate = eventDate;

  await saveEventConfig();
  logAction("Administrador", "ADMIN", "Configurações do Evento Atualizadas", `Empreendimento alterado para "${eventConfig.enterpriseName}"`);
  res.json({ success: true, eventConfig });
});

// Obter todos os empreendimentos cadastrados
app.get("/api/enterprises", (req, res) => {
  res.json(enterprises);
});

// Cadastrar ou editar um empreendimento
app.post("/api/enterprises", async (req, res) => {
  try {
    const { id, name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Nome do empreendimento é obrigatório." });
    }

    const normalizedName = name.trim();

    if (id) {
      const enterprise = enterprises.find(e => e.id === id);
      if (!enterprise) {
        return res.status(404).json({ error: "Empreendimento não encontrado." });
      }

      const oldName = enterprise.name;
      enterprise.name = normalizedName;
      await saveEnterprise(enterprise);

      // Renomear em cascata nos compradores ativos
      for (const c of clients) {
        if (c.empreendimento === oldName) {
          c.empreendimento = normalizedName;
          await saveClient(c);
        }
      }

      // Se é o atual ativo nas configurações de branding, atualiza também
      if (eventConfig.enterpriseName === oldName) {
        eventConfig.enterpriseName = normalizedName;
        await saveEventConfig();
      }

      logAction("Administrador", "ADMIN", "Empreendimento editado", `Empreendimento alterado de "${oldName}" para "${normalizedName}"`);
      res.json({ success: true, enterprises });
    } else {
      const exists = enterprises.some(e => e.name.toLowerCase() === normalizedName.toLowerCase());
      if (exists) {
        return res.status(400).json({ error: "Este empreendimento já possui cadastro." });
      }

      const newEnt: Enterprise = {
        id: "ent-" + generateId(),
        name: normalizedName
      };
      enterprises.push(newEnt);
      await saveEnterprise(newEnt);
      logAction("Administrador", "ADMIN", "Empreendimento criado", `Novo empreendimento cadastrado: "${normalizedName}"`);
      res.json({ success: true, enterprises });
    }
  } catch (err: any) {
    console.error("Erro em POST /api/enterprises:", err);
    res.status(500).json({ error: "Erro interno no servidor: " + (err.message || String(err)) });
  }
});

// Excluir um empreendimento
app.delete("/api/enterprises/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const entIndex = enterprises.findIndex(e => e.id === id);
    if (entIndex === -1) {
      return res.status(404).json({ error: "Empreendimento não encontrado." });
    }

    const entName = enterprises[entIndex].name;

    // Bloquear exclusão se existirem clientes usando
    const assignedCount = clients.filter(c => c.empreendimento === entName).length;
    if (assignedCount > 0) {
      return res.status(400).json({ error: `Impossível excluir. Existem ${assignedCount} compradores vinculados ao empreendimento "${entName}".` });
    }

    enterprises.splice(entIndex, 1);
    await deleteEnterpriseDoc(id);
    logAction("Administrador", "ADMIN", "Empreendimento removido", `Empreendimento "${entName}" excluído.`);
    res.json({ success: true, enterprises });
  } catch (err: any) {
    console.error("Erro em DELETE /api/enterprises:", err);
    res.status(500).json({ error: "Erro interno no servidor: " + (err.message || String(err)) });
  }
});

// Obter todos os clientes
app.get("/api/clients", (req, res) => {
  res.json(clients);
});

// Reset para fins de demonstração (Recarrega dados originais)
app.post("/api/clients/reset", (req, res) => {
  clients = [
    {
      id: "c-1",
      nome: "Jorge Silva dos Santos",
      cpf: "123.456.789-01",
      empreendimento: "Residencial Canto das Flores",
      bloco: "Bloco A",
      unidade: "Apto 203",
      telefone: "(11) 98765-4321",
      email: "jorge.silva@gmail.com",
      statusContratual: "QUITADO",
      status: "AGUARDANDO_RECEPCAO",
      priority: "NORMAL",
      possuiProcurador: false,
      possuiVistoriadorProprio: false,
      liberadoParaVistoria: false,
      documentos: [],
    },
    {
      id: "c-2",
      nome: "Mariana de Medeiros",
      cpf: "234.567.890-12",
      empreendimento: "Residencial Canto das Flores",
      bloco: "Bloco B",
      unidade: "Apto 101",
      telefone: "(11) 97123-4567",
      email: "mariana.medeiros@hotmail.com",
      statusContratual: "QUITADO",
      status: "AGUARDANDO_RECEPCAO",
      priority: "GESTANTE",
      possuiProcurador: false,
      possuiVistoriadorProprio: false,
      liberadoParaVistoria: false,
      documentos: [],
    },
    {
      id: "c-3",
      nome: "Carlos Alberto Costa",
      cpf: "345.678.901-23",
      empreendimento: "Residencial Canto das Flores",
      bloco: "Bloco A",
      unidade: "Apto 402",
      telefone: "(21) 99345-6789",
      email: "carlos.costa@yahoo.com.br",
      statusContratual: "QUITADO",
      status: "FILA_ATENDIMENTO",
      priority: "IDOSO",
      possuiProcurador: false,
      possuiVistoriadorProprio: false,
      liberadoParaVistoria: false,
      tempoChegadaRecepcao: "16:10",
      tempoEntradaFilaAtendimento: "16:12",
      documentos: [],
    },
    {
      id: "c-4",
      nome: "Amanda Rodrigues Lima",
      cpf: "456.789.012-34",
      empreendimento: "Vila Alpina Premium",
      bloco: "Torre 1",
      unidade: "Apto 1205",
      telefone: "(11) 96543-2109",
      email: "amanda.lima@outlook.com",
      statusContratual: "EM_ANALISE",
      status: "EM_ATENDIMENTO",
      priority: "NORMAL",
      possuiProcurador: true,
      procuradorNome: "Renato Lima dos Santos",
      procuradorCpf: "098.765.432-10",
      possuiVistoriadorProprio: false,
      liberadoParaVistoria: false,
      atendenteId: "u-3",
      atendenteNome: "Juliana Souza",
      guicheChamada: "Guichê 02",
      tempoChegadaRecepcao: "15:45",
      tempoEntradaFilaAtendimento: "15:47",
      tempoInicioAtendimento: "15:55",
      documentos: [
        {
          id: "doc-1",
          name: "procuracao_assinada.pdf",
          type: "application/pdf",
          size: "1.2 MB",
          uploadedAt: "15:58",
          category: "PROCURACAO",
          url: "#"
        }
      ],
    },
    {
      id: "c-5",
      nome: "Roberto de Souza Neto",
      cpf: "567.890.123-45",
      empreendimento: "Residencial Canto das Flores",
      bloco: "Bloco B",
      unidade: "Apto 304",
      telefone: "(11) 98877-6655",
      email: "roberto.souza@gmail.com",
      statusContratual: "QUITADO",
      status: "AGUARDANDO_VISTORIADOR_PROPRIO",
      priority: "NORMAL",
      possuiProcurador: false,
      possuiVistoriadorProprio: true,
      vistoriadorParticularNome: "Arq. Fabiano Toledo",
      vistoriadorParticularCrea: "CREA SP 501239-A",
      liberadoParaVistoria: false,
      atendenteId: "u-2",
      atendenteNome: "Renan Silva",
      guicheChamada: "Guichê 01",
      tempoChegadaRecepcao: "15:10",
      tempoEntradaFilaAtendimento: "15:12",
      tempoInicioAtendimento: "15:20",
      tempoFimAtendimento: "15:35",
      documentos: [],
    },
    {
      id: "c-6",
      nome: "Fernanda Alencar Santos",
      cpf: "678.901.234-56",
      empreendimento: "Residencial Canto das Flores",
      bloco: "Bloco C",
      unidade: "Apto 102",
      telefone: "(11) 99112-2334",
      email: "fernanda.alencar@gmail.com",
      statusContratual: "PENDENTE_FINANCIAMENTO",
      status: "FILA_VISTORIA",
      priority: "NORMAL",
      possuiProcurador: false,
      possuiVistoriadorProprio: false,
      liberadoParaVistoria: true,
      atendenteId: "u-4",
      atendenteNome: "Marcos Castro",
      guicheChamada: "Guichê 03",
      tempoChegadaRecepcao: "15:00",
      tempoEntradaFilaAtendimento: "15:02",
      tempoInicioAtendimento: "15:08",
      tempoFimAtendimento: "15:25",
      tempoEntradaFilaVistoria: "15:25",
      documentos: [],
    },
    {
      id: "c-7",
      nome: "Guilherme Santos Prado",
      cpf: "789.012.345-67",
      empreendimento: "Residencial Canto das Flores",
      bloco: "Bloco A",
      unidade: "Apto 501",
      telefone: "(11) 98223-3445",
      email: "guilherme.prado@live.com",
      statusContratual: "QUITADO",
      status: "EM_VISTORIA",
      priority: "PCD",
      possuiProcurador: false,
      possuiVistoriadorProprio: true,
      vistoriadorParticularNome: "Eng. Cláudio Marins",
      vistoriadorParticularCrea: "CREA SP 491321",
      liberadoParaVistoria: true,
      atendenteId: "u-2",
      atendenteNome: "Renan Silva",
      guicheChamada: "Guichê 01",
      vistoriadorId: "u-6",
      vistoriadorNome: "Tiago Mendes",
      tempoChegadaRecepcao: "14:15",
      tempoEntradaFilaAtendimento: "14:17",
      tempoInicioAtendimento: "14:24",
      tempoFimAtendimento: "14:40",
      tempoEntradaFilaVistoria: "14:42",
      tempoInicioVistoria: "14:50",
      documentos: [],
    },
    {
      id: "c-8",
      nome: "Juliana Ferreira Dias",
      cpf: "890.123.456-78",
      empreendimento: "Residencial Canto das Flores",
      bloco: "Bloco B",
      unidade: "Apto 204",
      telefone: "(11) 97445-5667",
      email: "juliana.dias@gmail.com",
      statusContratual: "QUITADO",
      status: "PROCESSO_ENCERRADO",
      priority: "NORMAL",
      possuiProcurador: false,
      possuiVistoriadorProprio: false,
      liberadoParaVistoria: true,
      atendenteId: "u-3",
      atendenteNome: "Juliana Souza",
      guicheChamada: "Guichê 02",
      vistoriadorId: "u-5",
      vistoriadorNome: "Aline Pereira",
      tempoChegadaRecepcao: "13:00",
      tempoEntradaFilaAtendimento: "13:02",
      tempoInicioAtendimento: "13:10",
      tempoFimAtendimento: "13:28",
      tempoEntradaFilaVistoria: "13:30",
      tempoInicioVistoria: "13:40",
      tempoFimVistoria: "14:25",
      tempoProcessoEncerrado: "14:30",
      documentos: [],
    }
  ];
  users.forEach(u => {
    if (u.role === "ATENDENTE") u.status = "DISPONIVEL";
    if (u.role === "VISTORIADOR") u.status = "DISPONIVEL";
  });
  activeCalls = [];
  eventConfig = {
    enterpriseName: "Residencial Canto das Flores",
    logoUrl: "",
    logoType: "ICON",
    logoIconName: "Building2",
    eventDate: "23 de Maio de 2026"
  };
  enterprises = [
    { id: "ent-1", name: "Residencial Canto das Flores" },
    { id: "ent-2", name: "Condomínio Belle Vue" },
    { id: "ent-3", name: "Residencial Solar da Barra" },
    { id: "ent-4", name: "Splendor Park Residence" }
  ];
  logAction("Administrador", "ADMIN", "Reset Geral", "Todos os dados foram redefinidos para os valores de fábrica");
  res.json({ message: "Reset completo realizado com sucesso", clients });
});

// Obter usuários
app.get("/api/users", (req, res) => {
  res.json(users);
});

// Cadastrar/Editar usuário
app.post("/api/users", async (req, res) => {
  const { id, name, role, username, deskNumber, status } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: "ERRO: O campo de nome de usuário é obrigatório." });
  }

  const normalizedUsername = username.trim().toLowerCase();
  
  // Verificar se o username já está em uso por outro usuário
  const usernameExists = users.some(u => u.username.toLowerCase() === normalizedUsername && u.id !== id);
  if (usernameExists) {
    return res.status(400).json({ error: `ERRO: O nome de usuário '@${username}' já está em uso por outro operador.` });
  }

  if (id) {
    // Editar
    users = users.map(u => {
      if (u.id === id) {
        const updated = { ...u, name, role, username: normalizedUsername, deskNumber, status: status || u.status };
        saveUser(updated);
        return updated;
      }
      return u;
    });
    logAction("Administrador", "ADMIN", "Usuário editado", `Usuário ${name} alterado com sucesso`);
  } else {
    // Criar
    const newUser: User = {
      id: "u-" + generateId(),
      name,
      role,
      username: normalizedUsername,
      deskNumber,
      status: status || "DISPONIVEL",
      completedCount: 0
    };
    users.push(newUser);
    await saveUser(newUser);
    logAction("Administrador", "ADMIN", "Usuário criado", `Novo usuário ${name} cadastrado como ${role}`);
  }
  res.json({ success: true, users });
});

// Excluir usuário do sistema
app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const userExist = users.find(u => u.id === id);
  if (userExist) {
    if (userExist.role === 'ADMIN' && users.filter(u => u.role === 'ADMIN').length <= 1) {
      return res.status(400).json({ error: "ERRO: O sistema precisa de pelo menos 1 Administrador ativo." });
    }
    users = users.filter(u => u.id !== id);
    await deleteUserDoc(id);
    logAction("Administrador", "ADMIN", "Usuário removido", `Usuário ${userExist.name} (${userExist.role}) foi excluído.`);
    res.json({ success: true, users });
  } else {
    res.status(404).json({ error: "Usuário não encontrado" });
  }
});

// Atualizar status de usuário/operador
app.post("/api/users/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const userObj = users.find(u => u.id === id);
  if (userObj) {
    userObj.status = status;
    await saveUser(userObj);
    logAction(userObj.name, userObj.role, "Alterou Status", `Operador alterou sua disponibilidade para: ${status}`);
    res.json({ success: true, user: userObj });
  } else {
    res.status(404).json({ error: "Usuário não encontrado" });
  }
});

// Importação JSON de clientes de planilha
app.post("/api/clients/import", async (req, res) => {
  try {
    const { fileData } = req.body; // Array de objetos importados
    if (!Array.isArray(fileData)) {
      return res.status(400).json({ error: "Dados inválidos para importação." });
    }

    let importedCount = 0;
    let updatedCount = 0;

    for (const row of fileData) {
      if (!row || !row.nome || !row.cpf) continue;
      
      // Procura CPF existente de forma robusta
      const rawCpfClean = String(row.cpf).replace(/\D/g, '');
      if (!rawCpfClean) continue;

      const clientExist = clients.find(c => {
        if (!c.cpf) return false;
        return String(c.cpf).replace(/\D/g, '') === rawCpfClean;
      });

      if (clientExist) {
        // Atualizar dados cadastrais mantendo o status operacional de fila
        clientExist.nome = row.nome;
        clientExist.empreendimento = row.empreendimento || clientExist.empreendimento;
        clientExist.bloco = row.bloco || clientExist.bloco;
        clientExist.unidade = row.unidade || clientExist.unidade;
        clientExist.telefone = row.telefone || clientExist.telefone;
        clientExist.email = row.email || clientExist.email;
        clientExist.statusContratual = row.statusContratual || clientExist.statusContratual;
        if (row.observacoes) clientExist.observacoes = row.observacoes;
        await saveClient(clientExist);
        updatedCount++;
      } else {
        // Criar novo registro
        const newClient: Client = {
          id: "c-" + generateId(),
          nome: row.nome,
          cpf: row.cpf,
          empreendimento: row.empreendimento || "Residencial Canto das Flores",
          bloco: row.bloco || "Bloco A",
          unidade: row.unidade || "Unidade Geral",
          telefone: row.telefone || "(11) 99999-9999",
          email: row.email || "contato@cliente.com",
          statusContratual: row.statusContratual || "QUITADO",
          status: "AGUARDANDO_RECEPCAO",
          priority: row.priority || "NORMAL",
          possuiProcurador: false,
          possuiVistoriadorProprio: false,
          liberadoParaVistoria: false,
          documentos: []
        };
        clients.push(newClient);
        await saveClient(newClient);
        importedCount++;
      }
    }

    logAction("Administrador", "ADMIN", "Importação Realizada", `Importados ${importedCount} novos registros, atualizados ${updatedCount} existentes`);
    res.json({ success: true, importedCount, updatedCount, clients });
  } catch (err: any) {
    console.error("Erro em POST /api/clients/import:", err);
    res.status(500).json({ error: "Erro interno no processamento de importação: " + (err.message || String(err)) });
  }
});

// Recepção: Marcar presença e inserir na fila de atendimento
app.post("/api/clients/:id/check-in", async (req, res) => {
  const { id } = req.params;
  const { possuiProcurador, priority, observacoes } = req.body;
  const clientObj = clients.find(c => c.id === id);

  if (!clientObj) {
    return res.status(404).json({ error: "Cliente não encontrado" });
  }

  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

  clientObj.status = "FILA_ATENDIMENTO";
  clientObj.possuiProcurador = !!possuiProcurador;
  clientObj.priority = priority || "NORMAL";
  clientObj.tempoChegadaRecepcao = timeStr;
  clientObj.tempoEntradaFilaAtendimento = timeStr;
  if (observacoes) {
    clientObj.observacoes = observacoes;
  }

  await saveClient(clientObj);
  logAction("Recepção (Fernanda)", "RECEPCIONISTA", "Presença Confirmada", `${clientObj.nome} inserido na fila de Atendimento.`);
  res.json({ success: true, client: clientObj });
});

// Roleta: Atendente ou Vistoriador Puxa Próximo da Fila
app.post("/api/operators/call-next", (req, res) => {
  const { operatorId, type } = req.body; // type: 'ATENDIMENTO' ou 'VISTORIA'
  const operator = users.find(u => u.id === operatorId);

  if (!operator) {
    return res.status(404).json({ error: "Operador não cadastrado" });
  }

  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

  if (type === "ATENDIMENTO") {
    // 1. Identificar clientes em 'FILA_ATENDIMENTO'
    // Prioridades primeiro (IDOSO, PCD, GESTANTE na ordem de chegada) depois normal por ordem
    const queue = clients.filter(c => c.status === "FILA_ATENDIMENTO");
    if (queue.length === 0) {
      return res.status(400).json({ error: "Nenhum cliente na Fila de Atendimento!" });
    }

    // Sort: Priority levels first, then arrival time (c- id index or arrival timestamp)
    queue.sort((a, b) => {
      const aPri = a.priority !== "NORMAL" ? 1 : 0;
      const bPri = b.priority !== "NORMAL" ? 1 : 0;
      if (aPri !== bPri) return bPri - aPri; // Priorities first
      
      const tA = a.tempoEntradaFilaAtendimento || "00:00";
      const tB = b.tempoEntradaFilaAtendimento || "00:00";
      return tA.localeCompare(tB);
    });

    const nextClient = queue[0];
    
    // Atualizar atendente e cliente
    nextClient.status = "EM_ATENDIMENTO";
    nextClient.atendenteId = operator.id;
    nextClient.atendenteNome = operator.name;
    nextClient.guicheChamada = operator.deskNumber || "Guichê Geral";
    nextClient.tempoInicioAtendimento = timeStr;

    operator.status = "EM_ATENDIMENTO";

    // Adicionar chamada ativa no Painel de TV
    activeCalls.unshift({
      id: "call-" + generateId(),
      clienteNome: nextClient.nome,
      unidade: `${nextClient.bloco} - ${nextClient.unidade}`,
      localDestino: operator.deskNumber || "Guichê Geral",
      responsavelNome: operator.name,
      timestamp: timeStr,
      status: "CHAMANDO"
    });

    logAction(operator.name, "ATENDENTE", "Chamou Próximo", `Chamou cliente ${nextClient.nome} para ${operator.deskNumber}`);
    return res.json({ success: true, client: nextClient, activeCalls });
  } 
  
  if (type === "VISTORIA") {
    // Clientes aptos na fila de vistoria
    const queue = clients.filter(c => c.status === "FILA_VISTORIA");
    if (queue.length === 0) {
      return res.status(400).json({ error: "Nenhum cliente apto na Fila de Vistoria!" });
    }

    // Sort prioritários na fila de vistoria
    queue.sort((a, b) => {
      const aPri = a.priority !== "NORMAL" ? 1 : 0;
      const bPri = b.priority !== "NORMAL" ? 1 : 0;
      if (aPri !== bPri) return bPri - aPri;
      const tA = a.tempoEntradaFilaVistoria || "00:00";
      const tB = b.tempoEntradaFilaVistoria || "00:00";
      return tA.localeCompare(tB);
    });

    const nextClient = queue[0];
    
    nextClient.status = "EM_VISTORIA";
    nextClient.vistoriadorId = operator.id;
    nextClient.vistoriadorNome = operator.name;
    nextClient.tempoInicioVistoria = timeStr;

    operator.status = "EM_VISTORIA";

    activeCalls.unshift({
      id: "call-" + generateId(),
      clienteNome: nextClient.nome,
      unidade: `${nextClient.bloco} - ${nextClient.unidade}`,
      localDestino: `Vistoria ${nextClient.bloco}`,
      responsavelNome: operator.name,
      timestamp: timeStr,
      status: "CHAMANDO"
    });

    logAction(operator.name, "VISTORIADOR", "Chamou Próximo", `Iniciou rota de vistoria com ${nextClient.nome} na unidade ${nextClient.unidade}`);
    return res.json({ success: true, client: nextClient, activeCalls });
  }

  res.status(400).json({ error: "Fila inválida" });
});

// Atendente salva detalhes do cliente, documentos adicionais e finaliza atendimento
app.post("/api/clients/:id/save-details", (req, res) => {
  const { id } = req.params;
  const { 
    telefone, whatsapp, email,
    possuiProcurador, procuradorNome, procuradorCpf,
    possuiVistoriadorProprio, vistoriadorParticularNome, vistoriadorParticularCrea,
    observacoes
  } = req.body;

  const client = clients.find(c => c.id === id);
  if (!client) {
    return res.status(404).json({ error: "Cliente não cadastrado" });
  }

  client.telefone = telefone || client.telefone;
  client.whatsapp = whatsapp || client.whatsapp;
  client.email = email || client.email;
  client.possuiProcurador = !!possuiProcurador;
  client.procuradorNome = procuradorNome;
  client.procuradorCpf = procuradorCpf;
  client.possuiVistoriadorProprio = !!possuiVistoriadorProprio;
  client.vistoriadorParticularNome = vistoriadorParticularNome;
  client.vistoriadorParticularCrea = vistoriadorParticularCrea;
  if (observacoes !== undefined) client.observacoes = observacoes;

  logAction(client.atendenteNome || "Atendente", "ATENDENTE", "Ficha Atualizada", `Cadastro de ${client.nome} revisado e salvo`);
  res.json({ success: true, client });
});

// Upload de Documentos para Cliente
app.post("/api/clients/:id/upload-doc", (req, res) => {
  const { id } = req.params;
  const { docName, category, base64Content } = req.body;

  const client = clients.find(c => c.id === id);
  if (!client) {
    return res.status(404).json({ error: "Cliente não encontrado" });
  }

  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

  const newDoc: DocumentAttachment = {
    id: "doc-" + generateId(),
    name: docName || "documento_anexo.png",
    type: docName?.endsWith(".pdf") ? "application/pdf" : "image/png",
    size: "1.5 MB",
    uploadedAt: timeStr,
    category: category || "OUTROS",
    url: base64Content || "#"
  };

  client.documentos.push(newDoc);
  
  // Se for o Portal Externo de envio de laudo particular pelo WhatsApp
  if (category === "LAUDO_PARTICULAR") {
    client.status = "PENDENTE"; // Volta para validação do Admin/Atendente
    logAction("Portal Cliente", "ADMIN", "Laudo Enviado", `Laudo de vistoria particular anexado por ${client.nome}`);
  } else {
    logAction(client.atendenteNome || "Atendente", "ATENDENTE", "Upload Anexo", `Salvo documento ${category} para ${client.nome}`);
  }

  res.json({ success: true, client, doc: newDoc });
});

// Atendente libera cliente (se possui vistoriador próprio ou normal) para Vistoria
app.post("/api/clients/:id/release-to-inspection", (req, res) => {
  const { id } = req.params;
  const client = clients.find(c => c.id === id);

  if (!client) {
    return res.status(404).json({ error: "Cliente não cadastrado" });
  }

  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

  client.tempoFimAtendimento = timeStr;

  // Libertação do atendente
  // Se o atendente marcar "Possui Vistoriador Próprio", mas o arquiteto/engenheiro dele ainda não chegou,
  // cai no status: AGUARDANDO_VISTORIADOR_PROPRIO.
  // Caso contrário, ou quando clicar em "Liberar para Fila de Vistoria"
  const { forceVistoriaFila } = req.body;

  if (client.possuiVistoriadorProprio && !forceVistoriaFila) {
    client.status = "AGUARDANDO_VISTORIADOR_PROPRIO";
    client.liberadoParaVistoria = false;
    logAction(client.atendenteNome || "Atendente", "ATENDENTE", "Retido por Vistoriador Particular", `${client.nome} aguarda chegada do profissional contratado`);
  } else {
    client.status = "FILA_VISTORIA";
    client.liberadoParaVistoria = true;
    client.tempoEntradaFilaVistoria = timeStr;
    logAction(client.atendenteNome || "Atendente", "ATENDENTE", "Encaminhado Vistoria", `${client.nome} inserido na fila de Vistoria operacional`);
  }

  // Desocupar atendente
  if (client.atendenteId) {
    const atendente = users.find(u => u.id === client.atendenteId);
    if (atendente) {
      atendente.status = "DISPONIVEL";
      atendente.completedCount++;
    }
  }

  res.json({ success: true, client, users });
});

// Vistoriador finaliza vistoria com sucesso (Triggers automatic WhatsApp)
app.post("/api/clients/:id/finish-inspection", (req, res) => {
  const { id } = req.params;
  const { clientSatisfaction, satisfactionComment } = req.body;
  const client = clients.find(c => c.id === id);

  if (!client) {
    return res.status(404).json({ error: "Cliente não encontrado" });
  }

  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

  client.status = "PROCESSO_ENCERRADO"; // Encerrado
  client.tempoFimVistoria = timeStr;
  client.tempoProcessoEncerrado = timeStr;
  
  if (clientSatisfaction !== undefined) {
    client.satisfactonScore = clientSatisfaction;
    client.satisfactonComment = satisfactionComment;
  }

  // Desocupar Vistoriador
  if (client.vistoriadorId) {
    const vist = users.find(u => u.id === client.vistoriadorId);
    if (vist) {
      vist.status = "DISPONIVEL";
      vist.completedCount++;
    }
  }

  logAction(client.vistoriadorNome || "Vistoriador", "VISTORIADOR", "Vistoria Concluída", `Laudo finalizado para ${client.nome}. Chaves entregues.`);
  
  // Envia Whatsapp de pós-vistoria automático!
  sendAutoWhatsapp(client);

  res.json({ success: true, client, users });
});

// Admin aprova laudo reenviado pós-WhatsApp e finaliza de fato
app.post("/api/clients/:id/validate-laudo", (req, res) => {
  const { id } = req.params;
  const client = clients.find(c => c.id === id);
  if (!client) {
    return res.status(404).json({ error: "Cliente não cadastrado" });
  }

  client.status = "PROCESSO_ENCERRADO";
  logAction("Administrador", "ADMIN", "Laudo Validado", `Laudo particular validado para ${client.nome}. Processo integralmente finalizado.`);
  res.json({ success: true, client });
});

// Obter as mensagens do Whatsapp simulado
app.get("/api/messages", (req, res) => {
  res.json(whatsappMessages);
});

// Obter logs de auditoria
app.get("/api/logs", (req, res) => {
  res.json(auditLogs);
});

// Obter as chamadas ativas do painel
app.get("/api/tv-calls", (req, res) => {
  res.json(activeCalls);
});

// Criar alertas operacionais de forma dinâmica (baseado no estado da fila real)
app.get("/api/operational-alerts", (req, res) => {
  const alerts: OperationalAlert[] = [];
  
  // 1. Fila de atendimento grande
  const atendFilaCount = clients.filter(c => c.status === "FILA_ATENDIMENTO").length;
  if (atendFilaCount > 3) {
    alerts.push({
      id: "a-1",
      type: "QUEUE_CONGESTED",
      severity: "DANGER",
      title: "Fila de Atendimento Congestionada",
      description: `Há ${atendFilaCount} clientes aguardando chamada de atendentes. Considere remanejar operadores.`,
      createdAt: "Agora"
    });
  }

  // 2. Clientes esperando há mais tempo
  const idleAtendCount = users.filter(u => u.role === "ATENDENTE" && u.status === "DISPONIVEL").length;
  const waitingAtendCount = clients.filter(c => c.status === "FILA_ATENDIMENTO").length;
  if (idleAtendCount > 1 && waitingAtendCount > 0) {
    alerts.push({
      id: "a-2",
      type: "OPERATOR_IDLE",
      severity: "WARNING",
      title: "Ociosidade de Atendentes",
      description: `Existem ${idleAtendCount} atendentes disponíveis e ${waitingAtendCount} clientes em fila não chamados.`,
      createdAt: "1 min atrás"
    });
  }

  // 3. Vistoriadores ociosos
  const idleVistCount = users.filter(u => u.role === "VISTORIADOR" && u.status === "DISPONIVEL").length;
  const waitingVistCount = clients.filter(c => c.status === "FILA_VISTORIA").length;
  if (idleVistCount > 2 && waitingVistCount === 0) {
    alerts.push({
      id: "a-3",
      type: "OPERATOR_IDLE",
      severity: "INFO",
      title: "Gargalo por Baixa Demanda de Vistoria",
      description: `Temos ${idleVistCount} vistoriadores de braços cruzados aguardando fluxo da conferência documental.`,
      createdAt: "3 min atrás"
    });
  }

  res.json(alerts);
});

// Vite & Static file handler para Cloud Run
async function startServer() {
  await initFirebase();
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[REALESTATE SERVER] Rodando em http://localhost:${PORT}`);
  });
}

if (process.env.VERCEL !== "1") {
  startServer();
}

export default app;
