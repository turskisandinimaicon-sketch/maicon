import React, { useState } from 'react';
import { Client } from '../types';
import { 
  FileSpreadsheet, Clipboard, CheckCircle2, AlertTriangle, HelpCircle, 
  RefreshCw, Check, UploadCloud, ChevronRight, CornerDownRight, Play
} from 'lucide-react';

interface ImportViewProps {
  clients: Client[];
  onImportData: (fileData: any[]) => void;
}

export default function ImportView({ clients, onImportData }: ImportViewProps) {
  const [csvText, setCsvText] = useState('');
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isImported, setIsImported] = useState(false);

  // Exemplo de CSV para colar
  const sampleCSV = `nome;cpf;empreendimento;bloco;unidade;telefone;email;statusContratual
Wellington Rodrigues;222.333.444-55;Residencial Canto das Flores;Bloco B;Apto 402;(11) 97755-1122;well.rodrig@gmail.com;QUITADO
Bárbara Alencar Neves;555.666.777-88;Residencial Canto das Flores;Bloco A;Apto 101;(11) 96134-8844;barbara.alencar@uol.com;PENDENTE_FINANCIAMENTO`;

  const handlePasteSample = () => {
    setCsvText(sampleCSV);
  };

  const handleProcessCSV = () => {
    if (!csvText.trim()) return;

    const rows = csvText.trim().split('\n');
    const headers = rows[0].split(';').map(h => h.trim().toLowerCase());
    
    const parsedRows: any[] = [];
    const localWarnings: string[] = [];
    
    for (let i = 1; i < rows.length; i++) {
      if (!rows[i].trim()) continue;
      const values = rows[i].split(';').map(v => v.trim());
      const rowObj: any = {};
      
      headers.forEach((header, index) => {
        rowObj[header] = values[index] || '';
      });

      // Validação de CPF basica
      const cpf = rowObj.cpf || '';
      const rawCpf = cpf.replace(/\D/g, '');
      if (rawCpf.length !== 11) {
        localWarnings.push(`Linha ${i + 1} ("${rowObj.nome || 'Sem Nome'}"): CPF formato inválido, esperado 11 dígitos.`);
      }

      // Verificação de Duplicidade com base de dados corrente do backend
      const duplicatedInDatabase = clients.some(c => c.cpf.replace(/\D/g, '') === rawCpf);
      rowObj.willUpdate = duplicatedInDatabase;

      // Verificação de Duplicidade no proprio arquivo colado
      const duplicatedInFile = parsedRows.some(p => p.cpf.replace(/\D/g, '') === rawCpf);
      if (duplicatedInFile) {
        localWarnings.push(`Linha ${i + 1}: Duplicidade de CPF encontrada dentro do próprio arquivo.`);
      }

      parsedRows.push(rowObj);
    }

    setPreviewRows(parsedRows);
    setWarnings(localWarnings);
    setIsImported(false);
  };

  const handleApplyImport = () => {
    if (previewRows.length === 0) return;
    
    // Converte os dados do preview para chaves aceitas na API
    const sanitizeData = previewRows.map(row => ({
      nome: row.nome,
      cpf: row.cpf,
      empreendimento: row.empreendimento || "Residencial Canto das Flores",
      bloco: row.bloco || "Bloco A",
      unidade: row.unidade || "Geral",
      telefone: row.telefone || "(11) 99999-9999",
      email: row.email || "contato@cliente.com",
      statusContratual: row.statuscontratual === "PENDENTE_FINANCIAMENTO" ? "PENDENTE_FINANCIAMENTO" : "QUITADO",
    }));

    onImportData(sanitizeData);
    setIsImported(true);
    setCsvText('');
    setPreviewRows([]);
    setWarnings([]);
    alert(`Importação concluída! Processado com sucesso.`);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-gray-100 pb-5">
        <h2 className="text-xl font-bold text-slate-900">Importação de Banco de Compradores</h2>
        <p className="text-xs text-slate-500 mt-1">Carregue novos moradores para a base de recepção copiando e colando dados de planilhas XLS ou CSV.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Formulário/Paste Area */}
        <div className="md:col-span-6 space-y-4">
          <div className="bg-white rounded-xl border border-gray-150 p-5 space-y-3 shadow-xs">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-805 text-sm flex items-center gap-1.5">
                <Clipboard className="w-4 h-4 text-indigo-600" />
                Cole Seus Registros no formato CSV/Colunas
              </h3>
              
              <button
                onClick={handlePasteSample}
                className="text-indigo-650 hover:text-indigo-805 font-bold text-xxs transition-colors bg-indigo-50 px-2 py-1 rounded cursor-pointer border border-indigo-200/50"
              >
                Colar Instrução Amostra
              </button>
            </div>

            <p className="text-xxs text-gray-500 leading-normal">
              Utilize o delimitador ponto e vírgula <strong>(;)</strong> com as colunas na primeira linha: <code>nome;cpf;empreendimento;bloco;unidade;telefone;email;statusContratual</code>
            </p>

            <textarea
              rows={10}
              placeholder="Ex: Pedro Silva;12345678910;Residencial Flores;A;Apto 203..."
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full bg-slate-50 border border-gray-250 rounded-lg p-3 font-mono text-xxs focus:outline-none focus:ring-1 focus:ring-indigo-550 focus:bg-white resize-y"
            />

            <button
              onClick={handleProcessCSV}
              disabled={!csvText.trim()}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-lg text-xs cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed transition-colors"
            >
              Analisar Registros Colados
            </button>
          </div>
        </div>

        {/* Informações Auxiliares do Processamento */}
        <div className="md:col-span-6 space-y-4">
          {previewRows.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-150 p-5 space-y-4 shadow-xs animate-fade-in">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-xs font-bold text-slate-805 block">Dossiê de Analise Técnica do Arquivo</span>
                <span className="bg-indigo-50 text-indigo-700 text-xxs font-bold px-2 py-0.5 rounded">
                  {previewRows.length} linhas
                </span>
              </div>

              {/* Warnings List */}
              {warnings.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-1.5">
                  <span className="font-bold text-orange-950 text-xxs flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Inconsistências Mapeadas ({warnings.length}):
                  </span>
                  <div className="max-h-[100px] overflow-y-auto text-[10px] text-orange-900 space-y-1 pr-1 font-mono">
                    {warnings.map((warn, wIdx) => (
                      <div key={wIdx} className="flex gap-1">
                        <span>•</span>
                        <span>{warn}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reset Previews Grid */}
              <div className="space-y-2 border border-slate-100 rounded-lg p-3 max-h-[220px] overflow-y-auto">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Clientes Prontos para Gravação</span>
                {previewRows.map((p, pIdx) => (
                  <div key={pIdx} className="text-xxs border-b border-slate-50 pb-2 last:border-none flex justify-between items-baseline gap-2">
                    <div className="truncate max-w-[150px]">
                      <span className="font-bold text-slate-800 block truncate">{p.nome || 'Cliente Indefinido'}</span>
                      <span className="text-gray-400 font-mono text-[9px] block">CPF: {p.cpf}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block truncate font-semibold">{p.bloco} - {p.unidade}</span>
                    </div>
                    <div className="text-right">
                      {p.willUpdate ? (
                        <span className="text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded font-extrabold text-[9px]">Mesclar/Atualizar</span>
                      ) : (
                        <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-extrabold text-[9px]">Inserir Novo</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setPreviewRows([]);
                    setWarnings([]);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-205 py-2 rounded-lg font-bold text-xs text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApplyImport}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 py-2 rounded-lg font-bold text-xs text-white cursor-pointer shadow-sm"
                >
                  Confirmar Importação
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl p-6 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center h-[350px]">
              <div className="p-4 bg-white rounded-full border border-slate-100 text-indigo-500 mb-3 block shadow-xxs">
                <FileSpreadsheet className="w-10 h-10" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Pronto para Análise do Cadastro</h3>
              <p className="text-xxs text-gray-500 max-w-xs mt-1 leading-relaxed">
                Insira ou simule seus registros de clientes no formulário ao lado e clique em procesar. Serão analisadas duplicidades de CPF na base antes de liberar a gravação.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
