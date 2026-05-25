import React, { useState, useRef, useEffect } from 'react';
import { Client } from '../types';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, Clipboard, AlertTriangle, HelpCircle, 
  RefreshCw, Check, UploadCloud, ChevronRight, Play, 
  X, Info, Database, AlertCircle, FileText, CheckCircle2,
  LogOut, ShieldCheck, Link2, Search, ArrowRight, EyeOff
} from 'lucide-react';
import { initAuth, googleSignIn, logout } from '../googleAuth';

interface ImportViewProps {
  clients: Client[];
  onImportData: (fileData: any[]) => Promise<boolean>;
}

interface ColumnMapping {
  key: string;
  label: string;
  required: boolean;
  synonyms: string[];
  description: string;
}

function cleanQuotes(val: any): string {
  if (val === undefined || val === null) return '';
  let str = String(val).trim();
  while (str.startsWith('"') && str.endsWith('"') && str.length > 1) {
    str = str.substring(1, str.length - 1).trim();
  }
  return str;
}

function formatCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length === 11) {
    return `${clean.substring(0, 3)}.${clean.substring(3, 6)}.${clean.substring(6, 9)}-${clean.substring(9)}`;
  }
  return cpf;
}

export default function ImportView({ clients, onImportData }: ImportViewProps) {
  // Estado de controle das Abas
  const [activeTab, setActiveTab] = useState<'FILE' | 'PASTE' | 'SHEETS'>('FILE');

  // Estados Comuns para Importação
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  // Google Sheets & Authentication states
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [sheetUrlOrId, setSheetUrlOrId] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [sheetsList, setSheetsList] = useState<string[]>([]);
  const [selectedSheetTab, setSelectedSheetTab] = useState('');
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [isFetchingRows, setIsFetchingRows] = useState(false);

  // Monitor real-time Google authentication status
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, cachedToken) => {
        setGoogleUser(user);
        setToken(cachedToken);
      },
      () => {
        setGoogleUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setToken(res.accessToken);
      }
    } catch (err) {
      console.error(err);
      alert("Houve uma falha ao autenticar com o Google. Certifique-se de autorizar os acessos.");
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    setGoogleUser(null);
    setToken(null);
  };

  const extractId = (urlOrId: string) => {
    const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : urlOrId.trim();
  };
  const [isImported, setIsImported] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- Módulo de Copiar e Colar (CSV Manual) ---
  const [csvText, setCsvText] = useState('');
  const sampleCSV = `nome;cpf;empreendimento;bloco;unidade;telefone;email;statusContratual
Wellington Rodrigues;222.333.444-55;Residencial Canto das Flores;Bloco B;Apto 402;(11) 97755-1122;well.rodrig@gmail.com;QUITADO
Bárbara Alencar Neves;555.666.777-88;Residencial Canto das Flores;Bloco A;Apto 101;(11) 96134-8844;barbara.alencar@uol.com;PENDENTE_FINANCIAMENTO`;

  const handlePasteSample = () => {
    setCsvText(sampleCSV);
  };

  const handleProcessRawCSV = () => {
    if (!csvText.trim()) return;

    try {
      const rows = csvText.trim().split('\n');
      if (rows.length < 2) {
        alert("O texto inserido parece não ter o mínimo de 2 linhas (cabeçalho + registros).");
        return;
      }

      // Detecção de delimitador inteligente (ponto e vírgula ou vírgula)
      const firstLine = rows[0];
      const delimiter = firstLine.includes(';') ? ';' : ',';
      
      const headers = firstLine.split(delimiter).map(h => h.trim().toLowerCase());
      
      const parsedRows: any[] = [];
      const localWarnings: string[] = [];
      
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue;
        const values = rows[i].split(delimiter).map(v => v.trim());
        const rowObj: any = {};
        
        headers.forEach((header, index) => {
          // Normalizar cabeçalho para coincidir com as propriedades esperadas
          const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
          rowObj[normalizedHeader] = cleanQuotes(values[index]);
        });

        // Mapeamento específico estrito para as chaves do sistema
        const rawCpf = (rowObj.cpf || rowObj.documento || '').replace(/\D/g, '');
        const formattedCpfValue = formatCPF(rawCpf);

        const canonicalRow: any = {
          nome: cleanQuotes(rowObj.nome || rowObj.nomecompleto || rowObj.comprador || rowObj.cliente || ''),
          cpf: formattedCpfValue || cleanQuotes(rowObj.cpf || rowObj.documento || ''),
          empreendimento: cleanQuotes(rowObj.empreendimento || rowObj.condominio || rowObj.obra || ''),
          bloco: cleanQuotes(rowObj.bloco || rowObj.torre || ''),
          unidade: cleanQuotes(rowObj.unidade || rowObj.apartamento || rowObj.apto || rowObj.ap || ''),
          telefone: cleanQuotes(rowObj.telefone || rowObj.tel || rowObj.celular || ''),
          email: cleanQuotes(rowObj.email || rowObj.correioeletronico || ''),
          statusContratual: cleanQuotes(rowObj.statuscontratual || rowObj.status || 'QUITADO')
        };

        // Validação de CPF basica
        if (rawCpf.length !== 11) {
          localWarnings.push(`Linha ${i + 1} ("${canonicalRow.nome || 'Sem Nome'}"): CPF formato inválido, esperado 11 dígitos.`);
        }

        // Verificação de Duplicidade com base de dados corrente do backend
        const duplicatedInDatabase = clients.some(c => c.cpf && String(c.cpf).replace(/\D/g, '') === rawCpf);
        canonicalRow.willUpdate = duplicatedInDatabase;

        // Verificação de Duplicidade no proprio arquivo colado
        const duplicatedInFile = parsedRows.some(p => p.cpf && String(p.cpf).replace(/\D/g, '') === rawCpf);
        if (duplicatedInFile) {
          localWarnings.push(`Linha ${i + 1}: CPF duplicado encontrado dentro do próprio texto.`);
        }

        parsedRows.push(canonicalRow);
      }

      setPreviewRows(parsedRows);
      setWarnings(localWarnings);
      setIsImported(false);
    } catch (error) {
      console.error(error);
      alert("Houve um erro técnico ao analisar o texto colado. Certifique-se de que cada registro esteja em uma linha individual.");
    }
  };

  // --- Módulo de Upload de Arquivos Real (XLSX, XLS, CSV) com Mapeamento Inteligente ---
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [fileHeaders, setFileHeaders] = useState<{ label: string; index: number }[]>([]);
  const [fileDataRows, setFileDataRows] = useState<any[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, number>>({});
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Definição das colunas do sistema e seus sinônimos para auto-detecção fuzzy
  const systemColumns: ColumnMapping[] = [
    { 
      key: 'nome', 
      label: 'Nome do Comprador', 
      required: true, 
      synonyms: ['nome', 'name', 'comprador', 'cliente', 'proprietario', 'titular', 'full name', 'fullname', 'nome completo', 'nome do cliente', 'nome do comprador'],
      description: 'Nome completo do titular comprador do imóvel.'
    },
    { 
      key: 'cpf', 
      label: 'CPF', 
      required: true, 
      synonyms: ['cpf', 'cnpj', 'documento', 'doc', 'cpf/cnpj', 'tax id', 'n_documento', 'id', 'cadastro de pessoa fisica'],
      description: 'CPF do titular. Usado para identificar duplicidades.'
    },
    { 
      key: 'empreendimento', 
      label: 'Empreendimento', 
      required: false, 
      synonyms: ['empreendimento', 'condominio', 'obra', 'projeto', 'residencial', 'building', 'condo', 'enterprise', 'nome do residencial', 'nome da obra'],
      description: 'Nome do condomínio ou residencial (Ex: Residencial Canto das Flores).'
    },
    { 
      key: 'bloco', 
      label: 'Bloco / Torre', 
      required: false, 
      synonyms: ['bloco', 'torre', 'quadra', 'block', 'tower', 'setor', 'fase'],
      description: 'Identificação de bloco ou torre.'
    },
    { 
      key: 'unidade', 
      label: 'Unidade (Apto/Casa/Lote)', 
      required: false, 
      synonyms: ['unidade', 'apartamento', 'apto', 'ap', 'casa', 'lote', 'sala', 'unit', 'apartment', 'número da unidade'],
      description: 'Número do apartamento ou casa.'
    },
    { 
      key: 'telefone', 
      label: 'Telefone / WhatsApp', 
      required: false, 
      synonyms: ['telefone', 'tel', 'celular', 'cel', 'contato', 'phone', 'mobile', 'telephone', 'whatsapp', 'whats'],
      description: 'Meio de contato telefônico ou celular.'
    },
    { 
      key: 'email', 
      label: 'Endereço de E-mail', 
      required: false, 
      synonyms: ['email', 'e-mail', 'mail', 'endereço eletrônico', 'electronic mail'],
      description: 'E-mail para envio de status ou notificações.'
    },
    { 
      key: 'statusContratual', 
      label: 'Status Financeiro', 
      required: false, 
      synonyms: ['status', 'status contratual', 'situacao', 'contrato', 'statuscontratual', 'financeiro', 'pagamento', 'payment', 'quitado', 'situacao financeira'],
      description: 'Se o apartamento está QUITADO ou PENDENTE_FINANCIAMENTO.'
    }
  ];

  // Algoritmo de Sweep compartilhado para auto-detecção fuzzy de colunas e mapeamento
  const analyzeSheetRowsOnData = (sheetRows: any[][]) => {
    if (sheetRows.length === 0) {
      alert("Nenhuma linha útil localizada na planilha selecionada.");
      return;
    }

    // Buscar em qual linha os cabeçalhos estão (pode haver linhas decorativas no início)
    let headerRowIndex = 0;
    let maxMatchCount = 0;
    const sweepLimit = Math.min(sheetRows.length, 8); // Verifica as primeiras 8 linhas

    for (let r = 0; r < sweepLimit; r++) {
      const row = sheetRows[r];
      if (!row || !Array.isArray(row)) continue;

      let matches = 0;
      row.forEach(cell => {
        if (cell !== undefined && cell !== null) {
          const cellStr = String(cell).toLowerCase().trim();
          const representsHeader = systemColumns.some(sys => 
            sys.synonyms.some(syn => cellStr === syn || cellStr.includes(syn))
          );
          if (representsHeader) matches++;
        }
      });

      if (matches > maxMatchCount) {
        maxMatchCount = matches;
        headerRowIndex = r;
      }
    }

    // Extrair headers da linha identificada
    const detectedHeadersRaw = sheetRows[headerRowIndex] || [];
    const detectedHeaders = detectedHeadersRaw.map((label, index) => ({
      label: label !== undefined && label !== null ? String(label).trim() : `Coluna ${index + 1}`,
      index: index
    })).filter(h => h.label !== "");

    // Obter todas as linhas seguintes como linhas de dados
    const detectedDataRows = sheetRows.slice(headerRowIndex + 1).filter(row => {
      return row && row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== "");
    });

    // Heurística de auto-match inteligente
    const initialMapping: Record<string, number> = {};
    systemColumns.forEach(sysCol => {
      let bestIndex = -1;
      let bestScore = 0; // Maior score vence

      detectedHeaders.forEach(fHeader => {
        const labelNorm = fHeader.label.toLowerCase().trim();
        sysCol.synonyms.forEach(syn => {
          if (labelNorm === syn) {
            bestScore = 100;
            bestIndex = fHeader.index;
          } else if (bestScore < 80 && (labelNorm.includes(syn) || syn.includes(labelNorm))) {
            const score = 50 + (syn.length / Math.max(labelNorm.length, 1)) * 30;
            if (score > bestScore) {
              bestScore = score;
              bestIndex = fHeader.index;
            }
          }
        });
      });

      if (bestIndex !== -1) {
        initialMapping[sysCol.key] = bestIndex;
      } else {
        // Mapping default baseado em índices se não encontrar nada
        if (sysCol.key === 'nome' && detectedHeaders[0]) initialMapping.nome = detectedHeaders[0].index;
        if (sysCol.key === 'cpf' && detectedHeaders[1]) initialMapping.cpf = detectedHeaders[1].index;
      }
    });

    setFileHeaders(detectedHeaders);
    setFileDataRows(detectedDataRows);
    setColumnMapping(initialMapping);
    setPreviewRows([]);
    setWarnings([]);
    setIsImported(false);
  };

  const processUploadedFile = (file: File) => {
    setUploadedFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (workbook.SheetNames.length === 0) {
          alert("O arquivo fornecido está vazio ou com formato incorreto.");
          return;
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Obter planilha como array de arrays para podermos analisar as linhas de forma precisa
        let sheetRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

        // Se a planilha foi interpretada como apenas uma coluna cheia de ponto-e-vírgulas (ex: CSV brasileiro/europeu exportado pelo Excel)
        const hasSingleColumnWithSemicolon = sheetRows.length > 0 && 
          sheetRows.some(row => Array.isArray(row) && row.length === 1 && typeof row[0] === 'string' && row[0].includes(';'));

        if (hasSingleColumnWithSemicolon) {
          sheetRows = sheetRows.map(row => {
            if (Array.isArray(row) && row.length === 1 && typeof row[0] === 'string') {
              return row[0].split(';');
            }
            return row;
          });
        }
        
        analyzeSheetRowsOnData(sheetRows);

      } catch (err) {
        console.error(err);
        alert("Erro técnico ao interpretar a matriz da planilha. Verifique se o arquivo está protegido ou corrompido.");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Carregar e verificar Abas da Planilha via Google Sheets API (V4)
  const handleVerifySpreadsheet = async () => {
    if (!sheetUrlOrId.trim()) {
      alert("Por favor, informe a URL ou ID da planilha do Google.");
      return;
    }
    const id = extractId(sheetUrlOrId);
    if (!id) {
      alert("Não foi possível identificar o ID da planilha na URL fornecida.");
      return;
    }
    
    setSpreadsheetId(id);
    setIsLoadingSheets(true);
    setSheetsList([]);
    setSelectedSheetTab('');

    try {
      const resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}?fields=sheets.properties.title`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(errText || "Planilha não encontrada ou sem permissão de acesso.");
      }

      const data = await resp.json();
      if (data.sheets && data.sheets.length > 0) {
        const tabs = data.sheets.map((s: any) => s.properties.title as string);
        setSheetsList(tabs);
        setSelectedSheetTab(tabs[0]);
      } else {
        alert("Nenhuma aba/página localizada nessa planilha.");
      }
    } catch (err: any) {
      console.error("Erro ao verificar planilha:", err);
      alert(`Falha ao acessar a planilha do Google Sheets.\nVerifique se o ID/Link está correto e se sua conta do Google tem acesso corporativo/pessoal a esta planilha.\n\nDetalhes: ${err.message || String(err)}`);
    } finally {
      setIsLoadingSheets(false);
    }
  };

  // Carregar linhas de dados contidos na Aba selecionada do Google Sheets
  const handleFetchSpreadsheetRows = async () => {
    if (!spreadsheetId || !selectedSheetTab) {
      alert("Por favor, verifique a planilha e escolha uma aba primeiro.");
      return;
    }

    setIsFetchingRows(true);
    try {
      const range = encodeURIComponent(selectedSheetTab);
      const resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueRenderOption=FORMATTED_VALUE`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(errText || "Não foi possível carregar os registros da aba selecionada.");
      }

      const data = await resp.json();
      if (data.values && data.values.length > 0) {
        const sheetRows: any[][] = data.values;
        setUploadedFileName(`Google Sheets: "${selectedSheetTab}"`);
        
        analyzeSheetRowsOnData(sheetRows);

        alert(`Carregados com sucesso ${sheetRows.length} registros do Google Sheets! Agora ajuste as correspondências na tela.`);
      } else {
        alert("A aba selecionada não possui dados válidos preenchidos.");
      }
    } catch (err: any) {
      console.error("Erro ao carregar linhas da planilha:", err);
      alert(`Erro ao buscar dados do Google Sheets: ${err.message || String(err)}`);
    } finally {
      setIsFetchingRows(false);
    }
  };

  // Drag and Drop Handles
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['csv', 'xlsx', 'xls', 'txt'].includes(ext || '')) {
        processUploadedFile(file);
      } else {
        alert("Extensão não suportada. Selecione arquivos .csv, .xls ou .xlsx");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUploadedFile(e.target.files[0]);
    }
  };

  // Processamento real aplicando as colunas mapeadas pelo usuário
  const handleProcessMappedFile = () => {
    if (fileDataRows.length === 0) {
      alert("Nenhum registro localizado no arquivo cargueiro.");
      return;
    }

    // Verificar se as colunas obrigatórias foram mapeadas
    const missingRequired = systemColumns
      .filter(col => col.required)
      .filter(col => columnMapping[col.key] === undefined || columnMapping[col.key] === -1);

    if (missingRequired.length > 0) {
      alert(`Mapeamento Incompleto: É necessário associar as colunas obrigatórias: [${missingRequired.map(c => c.label).join(', ')}] para prosseguir.`);
      return;
    }

    const parsedRows: any[] = [];
    const localWarnings: string[] = [];

    fileDataRows.forEach((row, rowIndex) => {
      const rowNum = rowIndex + 1;
      const getMappedValue = (key: string): string => {
        const colIdx = columnMapping[key];
        if (colIdx === undefined || colIdx === -1) return '';
        const value = row[colIdx];
        return cleanQuotes(value);
      };

      const rawCpf = getMappedValue('cpf').replace(/\D/g, '');
      const formattedCpfValue = formatCPF(rawCpf);

      const rowObj = {
        nome: getMappedValue('nome'),
        cpf: formattedCpfValue || getMappedValue('cpf'),
        empreendimento: getMappedValue('empreendimento'),
        bloco: getMappedValue('bloco'),
        unidade: getMappedValue('unidade'),
        telefone: getMappedValue('telefone'),
        email: getMappedValue('email'),
        statusContratual: getMappedValue('statusContratual')
      };

      // Limpar CPF e validar
      const cpfRaw = rowObj.cpf.replace(/\D/g, '');
      if (!rowObj.nome) {
        localWarnings.push(`Registro #${rowNum}: O nome do comprador está em branco.`);
      }

      if (cpfRaw.length !== 11) {
        localWarnings.push(`Registro #${rowNum} ("${rowObj.nome || 'Sem Nome'}"): CPF formato inválido, esperado 11 dígitos (Encontrado: "${rowObj.cpf || 'Em Branco'}").`);
      }

      // Checa duplicidade de CPF na base atual do servidor
      const duplicatedInDatabase = clients.some(c => c.cpf && String(c.cpf).replace(/\D/g, '') === cpfRaw);
      const isNew = !duplicatedInDatabase;

      // Checa duplicidade dentro da própria planilha sendo importada
      const duplicatedInFile = parsedRows.some(p => p.cpf && String(p.cpf).replace(/\D/g, '') === cpfRaw);
      if (duplicatedInFile) {
        localWarnings.push(`Registro #${rowNum}: O CPF ${rowObj.cpf} está repetido dentro de outra linha deste mesmo arquivo.`);
      }

      parsedRows.push({
        ...rowObj,
        willUpdate: duplicatedInDatabase
      });
    });

    setPreviewRows(parsedRows);
    setWarnings(localWarnings);
    setIsImported(false);
  };

  const handleApplyImport = async () => {
    if (previewRows.length === 0 || isSaving) return;
    setIsSaving(true);
    
    try {
      // Converte os dados do preview para as chaves aceitas na API de clientes do backend
      const sanitizeData = previewRows.map(row => {
        // Normalização amigável de status contratual
        let finalStatus: 'QUITADO' | 'PENDENTE_FINANCIAMENTO' | 'EM_ANALISE' = 'QUITADO';
        const statusStr = String(row.statusContratual || '').toUpperCase();
        if (statusStr.includes('PENDENTE') || statusStr.includes('FINANC') || statusStr.includes('FIN')) {
          finalStatus = 'PENDENTE_FINANCIAMENTO';
        } else if (statusStr.includes('ANALIS') || statusStr.includes('CONSER') || statusStr.includes('ANAL')) {
          finalStatus = 'EM_ANALISE';
        }

        return {
          nome: row.nome || 'Comprador Não Identificado',
          cpf: row.cpf,
          empreendimento: row.empreendimento || "Residencial Canto das Flores",
          bloco: row.bloco || "Bloco A",
          unidade: row.unidade || "Geral",
          telefone: row.telefone || "(11) 99999-9999",
          email: row.email || "contato@cliente.com",
          statusContratual: finalStatus,
        };
      });

      const success = await onImportData(sanitizeData);
      
      if (success) {
        setIsImported(true);
        
        // Resetar estados
        setCsvText('');
        setPreviewRows([]);
        setWarnings([]);
        setUploadedFileName('');
        setFileHeaders([]);
        setFileDataRows([]);
        setColumnMapping({});
        
        alert(`Importação concluída com sucesso! Processado lote de ${sanitizeData.length} compradores.`);
      } else {
        alert("Ocorreu um erro técnico ao registrar os compradores no servidor. Verifique sua conexão ou se o formato é válido.");
      }
    } catch (err) {
      console.error(err);
      alert("Houve uma falha de conexão com o servidor de banco de dados do evento.");
    } finally {
      setIsSaving(false);
    }
  };

  // Função para renderizar o exemplo da linha de dados para determinada coluna mapeada
  const getSampleMappedData = (key: string) => {
    const colIdx = columnMapping[key];
    if (colIdx === undefined || colIdx === -1 || fileDataRows.length === 0) return <span className="text-gray-400 italic font-mono text-[10px]">Sem dados para pré-visualização</span>;
    
    // Amostra das primeiras 3 linhas disponíveis
    const samples = fileDataRows.slice(0, 3).map(r => r[colIdx]).filter(val => val !== undefined && val !== null && val !== '');
    if (samples.length === 0) return <span className="text-gray-400 italic text-[10px]">Coluna vazia</span>;
    return <span className="text-indigo-600 font-mono text-[10px] font-bold truncate max-w-[200px]" title={samples.join(', ')}>{samples[0]}</span>;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="border-b border-gray-100 pb-5">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-650" />
          Importação Inteligente de Compradores
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Carregue o banco de clientes para as etapas de triagem, controle de fluxo e vistoria física das chaves. O sistema auto-detectará as colunas de arquivos Excel e CSV.
        </p>
      </div>

      {/* Seletor de Abas */}
      <div className="flex border-b border-gray-200 gap-1.5 p-1 bg-slate-100/70 rounded-lg max-w-lg">
        <button
          onClick={() => {
            setActiveTab('FILE');
            setPreviewRows([]);
            setWarnings([]);
          }}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'FILE' ? 'bg-white text-indigo-750 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Planilha (.xlsx, .csv)
        </button>
        <button
          onClick={() => {
            setActiveTab('PASTE');
            setPreviewRows([]);
            setWarnings([]);
          }}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'PASTE' ? 'bg-white text-indigo-750 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clipboard className="w-4 h-4" />
          Colar Texto
        </button>
        <button
          onClick={() => {
            setActiveTab('SHEETS');
            setPreviewRows([]);
            setWarnings([]);
          }}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'SHEETS' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <svg className="w-4 h-4 text-emerald-600 fill-emerald-600/10" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Google Sheets
        </button>
      </div>

      {/* Conteúdo das Abas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Painel Esquerdo de Upload ou Inputs */}
        <div className="lg:col-span-7 space-y-5">
          
          {activeTab === 'FILE' ? (
            /* ABA 1: ARQUIVO REAL EXCEL E CSV */
            <div className="space-y-4">
              
              {/* Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center select-none ${
                  isDragging 
                    ? 'border-indigo-500 bg-indigo-50/55 scale-[1.01]' 
                    : uploadedFileName 
                      ? 'border-emerald-300 bg-emerald-50/10'
                      : 'border-slate-200 bg-white hover:border-indigo-400 hover:bg-slate-50/30'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv, .xlsx, .xls, .txt"
                  className="hidden"
                />

                <div className={`p-4 rounded-full mb-3 shadow-xxs border ${
                  uploadedFileName 
                    ? 'bg-emerald-105 border-emerald-202 text-emerald-600' 
                    : 'bg-indigo-50 border-indigo-102 text-indigo-550'
                }`}>
                  {uploadedFileName ? <CheckCircle2 className="w-7 h-7" /> : <UploadCloud className="w-7 h-7" />}
                </div>

                {uploadedFileName ? (
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800 text-sm">{uploadedFileName}</p>
                    <p className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/50 px-2 py-0.5 rounded-full inline-block">
                      {fileDataRows.length} registros úteis detectados na primeira aba
                    </p>
                    <p className="text-xxs text-gray-400 block pt-1 hover:underline">
                      Clique ou arraste outro arquivo para substituir
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800 text-sm">Arraste sua planilha Excel ou arquivo CSV aqui</p>
                    <p className="text-xxs text-gray-400">Ou clique para selecionar de seu computador (Formatos: .xlsx, .xls, .csv, .txt)</p>
                    <p className="text-[10px] text-indigo-500 font-semibold pt-1">O divisor (vírgula, ponto e vírgula ou coluna de Excel) é detectado de forma automatizada!</p>
                  </div>
                )}
              </div>

              {/* Mapeamento de Colunas (Aparece somente quando houver arquivo selecionado) */}
              {fileHeaders.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs animate-fade-in">
                  
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                    <div>
                      <h3 className="font-bold text-slate-805 text-sm flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-indigo-650" />
                        Mapeamento de Colunas Inteligente
                      </h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">Identificamos as colunas da sua planilha. Ajuste as conexões se for necessário.</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        setUploadedFileName('');
                        setFileHeaders([]);
                        setFileDataRows([]);
                        setColumnMapping({});
                        setPreviewRows([]);
                        setWarnings([]);
                      }}
                      className="text-red-650 hover:bg-red-50 p-1.5 rounded-lg border border-red-200/50 hover:text-red-750 text-xxs block font-bold transition-colors cursor-pointer"
                    >
                      Remover Planilha
                    </button>
                  </div>

                  {/* Lista de mapeamentos */}
                  <div className="divide-y divide-gray-100 max-h-[350px] overflow-y-auto pr-1">
                    {systemColumns.map(systemCol => {
                      const selectedIdx = columnMapping[systemCol.key];
                      const isMapped = selectedIdx !== undefined && selectedIdx !== -1;

                      return (
                        <div key={systemCol.key} className="py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                          {/* Info do Sistema */}
                          <div className="max-w-xs space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800">{systemCol.label}</span>
                              {systemCol.required ? (
                                <span className="text-[9px] font-extrabold text-red-500 bg-red-50 border border-red-100 px-1 py-0.1 rounded uppercase">Obrigatório</span>
                              ) : (
                                <span className="text-[9px] text-gray-400 bg-slate-100 px-1 py-0.1 rounded uppercase">Opcional</span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 leading-normal">{systemCol.description}</p>
                          </div>

                          {/* Seletor da Planilha */}
                          <div className="flex items-center gap-2 md:w-64">
                            <select
                              value={selectedIdx !== undefined ? selectedIdx : -1}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setColumnMapping(prev => ({
                                  ...prev,
                                  [systemCol.key]: val
                                }));
                              }}
                              className={`w-full text-xxs font-mono p-1.5 rounded-lg border ${
                                isMapped 
                                  ? 'border-indigo-200 bg-indigo-50/20 text-indigo-900 font-bold' 
                                  : systemCol.required 
                                    ? 'border-red-200 bg-red-50 text-red-900 font-bold' 
                                    : 'border-gray-250 bg-slate-50 text-gray-500'
                              }`}
                            >
                              <option value={-1}>-- Sem Correspondência --</option>
                              {fileHeaders.map(h => (
                                <option key={h.index} value={h.index}>
                                  Coluna: "{h.label}"
                                </option>
                              ))}
                            </select>

                            {/* Indicador Check ou pendência */}
                            <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                              {isMapped ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                systemCol.required && <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                              )}
                            </div>
                          </div>

                          {/* Preview da Linha */}
                          <div className="text-[10px] md:w-48 text-right flex items-center justify-end">
                            {isMapped && (
                              <div className="bg-slate-100/60 px-2 py-0.5 rounded max-w-full text-left truncate">
                                <span className="text-gray-400 text-[8px] block uppercase font-bold tracking-tight">Primeira linha:</span>
                                {getSampleMappedData(systemCol.key)}
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>

                  {/* Ação de Processar */}
                  <button
                    onClick={handleProcessMappedFile}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                  >
                    <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                    Analisar dados de acordo com o Mapeamento
                  </button>

                </div>
              )}

            </div>
          ) : activeTab === 'PASTE' ? (
            /* ABA 2: COPIAR E COLAR MANUAL */
            <div className="bg-white rounded-xl border border-gray-150 p-5 space-y-4 shadow-xs">
              
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-805 text-sm flex items-center gap-1.5">
                  <Clipboard className="w-4 h-4 text-indigo-650" />
                  Cole os clientes no quadro abaixo
                </h3>
                
                <button
                  onClick={handlePasteSample}
                  className="text-indigo-650 hover:bg-indigo-50 hover:text-indigo-805 font-bold text-xxs transition-colors px-2 py-1 rounded cursor-pointer border border-indigo-200/50"
                >
                  Carregar Amostra Padrão
                </button>
              </div>

              <div className="bg-amber-50 rounded-lg p-3 text-xxs text-amber-900 space-y-1 block border border-amber-100">
                <p className="font-bold leading-normal">Instruções para a Colagem de Texto:</p>
                <p className="leading-relaxed">
                  Insira o cabeçalho na primeira linha contendo pelo menos as colunas <strong>nome</strong> e <strong>cpf</strong> separadas por ponto e vírgula <code>(;)</code> ou vírgula <code>(,)</code>. O sistema fará a interpretação inteligente das colunas indiferente da ordem.
                </p>
              </div>

              <textarea
                rows={11}
                placeholder="Exemplo:&#10;nome;cpf;empreendimento;bloco;unidade;telefone;statusContratual&#10;Mateus Reis;11122233344;Canto das Flores;A;101;(11) 98888-7777;QUITADO"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full bg-slate-50 border border-gray-250 rounded-lg p-3 font-mono text-xxs focus:outline-none focus:ring-1 focus:ring-indigo-550 focus:bg-white resize-y"
              />

              <button
                onClick={handleProcessRawCSV}
                disabled={!csvText.trim()}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-lg text-xs cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed transition-colors"
              >
                Analisar Texto Copiado
              </button>

            </div>
          ) : (
            /* ABA 3: GOOGLE SHEETS COM AUTENTICAÇÃO REAL EM TEMPO REAL */
            <div className="space-y-4">
              
              {/* Status de Autenticação */}
              {!googleUser ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-3 bg-emerald-50 rounded-full text-emerald-600 border border-emerald-100">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  
                  <div className="space-y-1 max-w-sm">
                    <h3 className="text-sm font-bold text-slate-850">Conectar Google Sheets</h3>
                    <p className="text-xxs text-gray-500 leading-normal">
                      Sincronize com segurança seu banco de dados de compradores hospedado no Google Drive. Seus dados cadastrais serão lidos com permissão de forma 100% dinâmica.
                    </p>
                  </div>

                  <button
                    onClick={handleGoogleLogin}
                    disabled={loadingGoogle}
                    className="flex items-center gap-3 bg-white hover:bg-slate-50 text-slate-705 font-semibold border border-gray-250 rounded-lg px-4 py-2.5 shadow-xs transition-all text-xs w-full max-w-xs justify-center cursor-pointer disabled:opacity-55"
                  >
                    {loadingGoogle ? (
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                    ) : (
                      <>
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        </svg>
                        <span>Entrar com o Google</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Card Conta Ativa */}
                  <div className="bg-emerald-50/40 rounded-xl border border-emerald-100 p-4 flex justify-between items-center gap-4 text-xs">
                    <div className="flex items-center gap-2.5">
                      {googleUser.photoURL ? (
                        <img referrerPolicy="no-referrer" src={googleUser.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-emerald-200" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-600/10 text-emerald-800 font-bold flex items-center justify-center uppercase">
                          {googleUser.displayName?.charAt(0) || googleUser.email?.charAt(0) || 'G'}
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-slate-800 block truncate max-w-[190px]">Conectado como {googleUser.displayName || 'Google User'}</span>
                        <span className="text-[10px] text-emerald-800 font-medium block truncate max-w-[190px]">{googleUser.email}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleGoogleLogout}
                      className="text-red-650 hover:bg-red-50 p-1.5 rounded-lg border border-red-100 flex items-center gap-1 font-bold text-xxs transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sair da Conta
                    </button>
                  </div>

                  {/* Detalhes do Documento */}
                  <div className="bg-white rounded-xl border border-gray-150 p-5 space-y-4 shadow-xs">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-emerald-600" />
                      URL ou ID da Planilha do Google
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Cole o link da planilha ou apenas o ID"
                        value={sheetUrlOrId}
                        onChange={(e) => setSheetUrlOrId(e.target.value)}
                        className="flex-1 bg-slate-50 border border-gray-250 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white font-mono"
                      />
                      <button
                        onClick={handleVerifySpreadsheet}
                        disabled={isLoadingSheets || !sheetUrlOrId.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer select-none transition-colors"
                      >
                        {isLoadingSheets ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        Verificar
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Abra a planilha no seu Google Drive, copie o link completo na barra de endereços e cole acima. Seus dados nunca são armazenados, servindo apenas para análise nesta tela.
                    </p>
                  </div>

                  {/* Seletor de Abas Localizadas */}
                  {sheetsList.length > 0 && (
                    <div className="bg-white rounded-xl border border-emerald-150 p-5 space-y-4 shadow-xs animate-fade-in">
                      <div>
                        <span className="text-xs font-bold text-slate-850 block flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Planilha Verificada! Selecione a Aba
                        </span>
                        <span className="text-[10px] text-slate-500">Escolha a folha/página da planilha que contém a tabela de clientes</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                        <select
                          value={selectedSheetTab}
                          onChange={(e) => setSelectedSheetTab(e.target.value)}
                          className="bg-slate-50 border border-emerald-200 text-slate-800 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          {sheetsList.map((tab, idx) => (
                            <option key={idx} value={tab}>{tab}</option>
                          ))}
                        </select>

                        <button
                          onClick={handleFetchSpreadsheetRows}
                          disabled={isFetchingRows || !selectedSheetTab}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55 transition-colors"
                        >
                          {isFetchingRows ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                              Lendo Planilha...
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                              Carregar Compradores
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

        </div>

        {/* Painel Direito de Visão Geral do Lote Processado */}
        <div className="lg:col-span-5 space-y-4">
          
          {previewRows.length > 0 ? (
            /* Relatório do lote analisado */
            <div className="bg-white rounded-xl border border-indigo-150 p-5 space-y-4 shadow-sm animate-fade-in">
              
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <div>
                  <span className="text-xs font-bold text-slate-805 block">Dossiê Detalhado do Lote</span>
                  <span className="text-[10px] text-slate-500">Mapeamento em tempo real do processador</span>
                </div>
                <span className="bg-indigo-50 text-indigo-750 text-xxs font-bold px-2 py-0.5 rounded">
                  {previewRows.length} clientes localizados
                </span>
              </div>

              {/* Warnings List */}
              {warnings.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-1.5">
                  <span className="font-bold text-orange-950 text-xxs flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Inconsistências Mapeadas ({warnings.length}):
                  </span>
                  <div className="max-h-[100px] overflow-y-auto text-[10px] text-orange-900 space-y-1 pr-1 font-mono leading-normal">
                    {warnings.map((warn, wIdx) => (
                      <div key={wIdx} className="flex gap-1 items-start">
                        <span>•</span>
                        <span>{warn}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista para Gravação */}
              <div className="space-y-2 border border-slate-100 rounded-lg p-3 max-h-[250px] overflow-y-auto">
                <span className="text-[10px] text-gray-500 font-bold uppercase block tracking-wider pb-1.5 border-b border-dashed border-gray-100">Registros prontos para gravação</span>
                {previewRows.map((p, pIdx) => (
                  <div key={pIdx} className="text-xxs border-b border-slate-50 pb-2 last:border-none flex justify-between items-center gap-2 pt-1.5">
                    <div className="truncate max-w-[150px]">
                      <span className="font-bold text-slate-800 block truncate" title={p.nome}>{p.nome || 'Cliente Indefinido'}</span>
                      <span className="text-gray-400 font-mono text-[9px] block">CPF: {p.cpf || 'Não Informado'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block truncate font-semibold">
                        {p.bloco || 'Bl.'} - {p.unidade || 'Un.'}
                      </span>
                    </div>
                    <div className="text-right">
                      {p.willUpdate ? (
                        <span className="text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded font-extrabold text-[9px]">Mesclar/Atualizar</span>
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded font-extrabold text-[9px]">Inserir Novo</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => {
                    setPreviewRows([]);
                    setWarnings([]);
                  }}
                  disabled={isSaving}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 py-2.5 rounded-lg font-bold text-xs text-slate-700 cursor-pointer transition-colors"
                >
                  Cancelar Lote
                </button>
                <button
                  onClick={handleApplyImport}
                  disabled={isSaving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:opacity-80 py-2.5 rounded-lg font-bold text-xs text-white cursor-pointer shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Gravando Lote...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Salvar Compradores
                    </>
                  )}
                </button>
              </div>

            </div>
          ) : (
            /* Card Lateral de Orientações */
            <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-850 space-y-4">
              
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-300">Como funciona a inteligência?</h3>
              </div>

              <div className="space-y-4 text-xxs text-gray-400 leading-relaxed">
                <div className="space-y-1">
                  <span className="font-extrabold text-slate-200 block">1. Detecção automática de cabeçalho:</span>
                  <p>Investigamos a sua planilha de ponta a ponta. Se houver logotipos corporativos ou resumos de títulos no topo do arquivo (comum em CRM e ERP), nosso processador pula essas linhas e encontra a linha correta da tabela automaticamente.</p>
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-slate-200 block">2. Reconhecimento de Synonyms:</span>
                  <p>Nosso dicionário de correspondências entende que a coluna "Comprador" ou "Titular" se refere ao <strong>Nome</strong>, que "AP", "Apartamento" ou "unid" corresponde à <strong>Unidade</strong> e que "Documento" traduz-se como o <strong>CPF</strong>.</p>
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-slate-200 block">3. Correções instantâneas:</span>
                  <p>Se o sistema errar alguma correspondência, basta usar a caixa de correspondência para corrigir na hora antes de prever, evitando refazer planilhas manual ou editar campos unitários.</p>
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-slate-200 block">4. Inteligência de Mesclagem:</span>
                  <p>Se o CPF importado já morar no nosso banco de dados da Recepção ou Vistoria, o sistema detectará duplicidade e apenas **mesclará** as novas informações da planilha para evitar cadastros duplicados perigosos no evento das chaves.</p>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
