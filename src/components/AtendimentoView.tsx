import React, { useState } from 'react';
import { Client, User, DocumentAttachment } from '../types';
import { 
  Users, CheckCircle, UserPlus, FileText, UploadCloud, 
  Trash2, Send, Save, ArrowRight, ShieldCheck, CheckSquare, Sparkles, HelpCircle, AlertCircle
} from 'lucide-react';

interface AtendimentoViewProps {
  currentOperator: User;
  clients: Client[];
  onCallNext: (operatorId: string, type: 'ATENDIMENTO') => void;
  onSaveDetails: (clientId: string, data: any) => void;
  onUploadDoc: (clientId: string, data: { docName: string, category: string, base64Content: string }) => void;
  onReleaseToInspection: (clientId: string, forceVistoriaFila: boolean) => void;
}

export default function AtendimentoView({
  currentOperator,
  clients,
  onCallNext,
  onSaveDetails,
  onUploadDoc,
  onReleaseToInspection
}: AtendimentoViewProps) {
  // Encontrar o cliente que este atendente está atendendo atualmente
  const activeClient = clients.find(c => c.status === 'EM_ATENDIMENTO' && c.atendenteId === currentOperator.id);
  
  // Clientes na fila de Atendimento Geral esperando chamada
  const waitingCount = clients.filter(c => c.status === 'FILA_ATENDIMENTO').length;

  // Clientes retidos aguardando vistoriador próprio para serem liberados
  const OwnAppraiserWaitingList = clients.filter(c => c.status === 'AGUARDANDO_VISTORIADOR_PROPRIO');

  // Form State
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [obs, setObs] = useState('');
  const [possuiProcurador, setPossuiProcurador] = useState(false);
  const [procuradorNome, setProcuradorNome] = useState('');
  const [procuradorCpf, setProcuradorCpf] = useState('');
  const [possuiVistoriadorProprio, setPossuiVistoriadorProprio] = useState(false);
  const [vistoriadorNome, setVistoriadorNome] = useState('');
  const [vistoriadorCrea, setVistoriadorCrea] = useState('');

  // Checklist
  const [checklist, setChecklist] = useState({
    identidadeOk: false,
    procuracaoAssinada: false,
    quitacaoConfirmada: false,
    dadosRevisados: false
  });

  // Local file base64 state for upload simulation
  const [uploadCategory, setUploadCategory] = useState('RG');
  const [dragActive, setDragActive] = useState(false);

  // Inicializar formulário do cliente ativo
  React.useEffect(() => {
    if (activeClient) {
      setPhone(activeClient.telefone || '');
      setWhatsapp(activeClient.whatsapp || activeClient.telefone || '');
      setEmail(activeClient.email || '');
      setObs(activeClient.observacoes || '');
      setPossuiProcurador(activeClient.possuiProcurador || false);
      setProcuradorNome(activeClient.procuradorNome || '');
      setProcuradorCpf(activeClient.procuradorCpf || '');
      setPossuiVistoriadorProprio(activeClient.possuiVistoriadorProprio || false);
      setVistoriadorNome(activeClient.vistoriadorParticularNome || '');
      setVistoriadorCrea(activeClient.vistoriadorParticularCrea || '');
      
      // Default checklist state reset
      setChecklist({
        identidadeOk: activeClient.documentos.some(d => d.category === 'RG' || d.category === 'CPF'),
        procuracaoAssinada: activeClient.possuiProcurador ? activeClient.documentos.some(d => d.category === 'PROCURACAO') : true,
        quitacaoConfirmada: activeClient.statusContratual === 'QUITADO',
        dadosRevisados: false
      });
    }
  }, [activeClient]);

  const handleSaveData = () => {
    if (!activeClient) return;
    onSaveDetails(activeClient.id, {
      telefone: phone,
      whatsapp,
      email,
      possuiProcurador,
      procuradorNome,
      procuradorCpf,
      possuiVistoriadorProprio,
      vistoriadorParticularNome: vistoriadorNome,
      vistoriadorParticularCrea: vistoriadorCrea,
      observacoes: obs
    });
    alert("Dados do comprador atualizados com sucesso!");
  };

  // Simulação de carregamento de arquivo em Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !activeClient) return;
    const file = e.target.files[0];
    
    if (file.size > 20 * 1024 * 1024) {
      alert("O arquivo excede o limite permitido de 20MB!");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      onUploadDoc(activeClient.id, {
        docName: file.name,
        category: uploadCategory,
        base64Content: base64
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFinish = (forceVistoriaFila: boolean) => {
    if (!activeClient) return;
    
    // Validar se precisa salvar antes
    onSaveDetails(activeClient.id, {
      telefone: phone,
      whatsapp,
      email,
      possuiProcurador,
      procuradorNome,
      procuradorCpf,
      possuiVistoriadorProprio,
      vistoriadorParticularNome: vistoriadorNome,
      vistoriadorParticularCrea: vistoriadorCrea,
      observacoes: obs
    });

    onReleaseToInspection(activeClient.id, forceVistoriaFila);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header com Guichê infos */}
      <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-indigo-400 font-mono font-bold text-xxs uppercase tracking-wider">Mesa de Atendimento Ativa</span>
          <h2 className="text-xl font-bold font-sans">{currentOperator.name} — <span className="text-emerald-400">{currentOperator.deskNumber || 'Balcão Geral'}</span></h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-slate-400 text-xs block">Clientes na fila de chamada</span>
            <span className="text-sm font-bold text-amber-400 font-mono">{waitingCount} aguardando</span>
          </div>

          <button
            onClick={() => onCallNext(currentOperator.id, 'ATENDIMENTO')}
            disabled={activeClient !== undefined || waitingCount === 0}
            className={`cursor-pointer px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${
              activeClient !== undefined
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : waitingCount === 0
                ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-extrabold shadow-md'
            }`}
          >
            🔊 Chamada Automática (Roleta)
          </button>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LADO ESQUERDO: Painel do Cliente Ativo */}
        <div className="lg:col-span-8 space-y-6">
          {activeClient ? (
            <div className="bg-white rounded-xl border border-gray-150 shadow-xs p-5 space-y-6">
              
              {/* Box Info Comprador */}
              <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-xxs px-2.5 py-0.5 rounded-full font-bold">
                      {activeClient.priority}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">ID: {activeClient.id}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{activeClient.nome}</h3>
                  <p className="text-xs text-gray-500">{activeClient.empreendimento} • <span className="font-bold text-slate-700">{activeClient.bloco} - {activeClient.unidade}</span></p>
                </div>
                <div className="bg-indigo-50 text-indigo-700 px-3 py-1 bg-opacity-70 rounded text-right font-mono text-xs">
                  <span className="block font-bold">Chegou</span>
                  {activeClient.tempoChegadaRecepcao || 'Aguardando'}
                </div>
              </div>

              {/* Seção 1: Atualização Cadastral */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-2">
                  <span>1.</span> Atualização Cadastrais e Contatos
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600 block">Número do Telefone</label>
                    <input
                      type="text"
                      placeholder="(11) 99999-9999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-350 text-xs rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600 block">WhatsApp de Disparo</label>
                    <input
                      type="text"
                      placeholder="(11) 99999-9999"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-350 text-xs rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600 block">E-mail Principal</label>
                    <input
                      type="email"
                      placeholder="email@cliente.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-350 text-xs rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Procuradores */}
              <div className="pt-2 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span>2.</span> Representação Legal / Procurador
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setPossuiProcurador(!possuiProcurador);
                      if (!possuiProcurador) {
                        setChecklist(prev => ({ ...prev, procuracaoAssinada: false }));
                      }
                    }}
                    className={`text-xxs px-2 py-1 rounded cursor-pointer font-bold ${
                      possuiProcurador ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {possuiProcurador ? '✓ Definido como Procurador' : '+ Definir Procurador'}
                  </button>
                </div>

                {possuiProcurador && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-600 block">Nome Completo do Procurador</label>
                      <input
                        type="text"
                        placeholder="Nome civil do procurador"
                        value={procuradorNome}
                        onChange={(e) => setProcuradorNome(e.target.value)}
                        className="w-full bg-white border border-amber-200 text-xs rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-600 block">CPF do Procurador</label>
                      <input
                        type="text"
                        placeholder="000.000.000-00"
                        value={procuradorCpf}
                        onChange={(e) => setProcuradorCpf(e.target.value)}
                        className="w-full bg-white border border-amber-200 text-xs rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Seção 3: Vistoriador Particular (REGRA OPERACIONAL IMPRESCINDÍVEL) */}
              <div className="pt-2 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-2">
                      <span>3.</span> Vistoriador ou Assessor Particular do Cliente?
                    </h4>
                    <p className="text-[10px] text-gray-500">Obrigatória vistoria conjunta com nossa equipe para evitar travamento da fila principal.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPossuiVistoriadorProprio(!possuiVistoriadorProprio)}
                    className={`text-xxs px-2 py-1 rounded cursor-pointer font-bold transition-all ${
                      possuiVistoriadorProprio ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {possuiVistoriadorProprio ? '★ Ativo (Aguardar Cheg.)' : '+ Configurar Arquiteto'}
                  </button>
                </div>

                {possuiVistoriadorProprio && (
                  <div className="bg-amber-100/50 p-3 rounded-lg border border-amber-300 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-amber-950 block">Nome do Engenheiro/Arquiteto Particular</label>
                        <input
                          type="text"
                          placeholder="Ex: Carlos Toledo Arquiteto"
                          value={vistoriadorNome}
                          onChange={(e) => setVistoriadorNome(e.target.value)}
                          className="w-full bg-white border border-amber-300 text-xs rounded-lg p-2 focus:outline-none font-semibold text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-amber-950 block">CREA ou Registro do profissional (Opcional)</label>
                        <input
                          type="text"
                          placeholder="EX: CREA 123456-SP"
                          value={vistoriadorCrea}
                          onChange={(e) => setVistoriadorCrea(e.target.value)}
                          className="w-full bg-white border border-amber-300 text-xs rounded-lg p-2 focus:outline-none text-slate-800"
                        />
                      </div>
                    </div>
                    
                    <div className="text-xxs text-amber-800 leading-relaxed font-semibold">
                      ⚠️ Ao ativar esta opção, se você finalizar o atendimento ela cairá no status "Aguardando vistoriador próprio" retido, para liberar apenas quando o profissional do cliente de fato chegar e o evento não travar!
                    </div>
                  </div>
                )}
              </div>

              {/* Seção 4: Notas e Observações */}
              <div className="pt-2 border-t border-gray-100 space-y-1.5 animate-fade-in">
                <label className="text-xs font-bold text-gray-700 block">Anotações Internas de Mesa</label>
                <textarea
                  rows={2}
                  placeholder="Registre pendências ou acordos acordados em mesa de atendimento..."
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-350 text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white resize-none"
                />
              </div>

              {/* Ações e Salvamento */}
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-[11px] text-gray-500">Sempre salve antes de encaminhar o comprador.</span>
                <button
                  type="button"
                  onClick={handleSaveData}
                  className="bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 py-1.5 px-3 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xxs"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salvar Rascunho
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-slate-50 p-8 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center h-[500px]">
              <div className="p-4 bg-white rounded-full shadow-xxs border border-gray-100 text-indigo-500 mb-3 animate-bounce">
                <FileText className="w-10 h-10" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Pronto para Chamada da Fila!</h3>
              <p className="text-xxs text-gray-500 max-w-sm mt-1">
                Clique no botão <strong>"Chamada Automática"</strong> na barra preta superior para receber o próximo comprador de acordo com o nível de prioridade legal pré-definido.
              </p>
            </div>
          )}
        </div>


        {/* LADO DIREITO: Checklists de Mesa & Carregamentos */}
        <div className="lg:col-span-4 space-y-6">
          
          {activeClient && (
            <>
              {/* Box Checklist de Documentação */}
              <div className="bg-white rounded-xl border border-gray-150 shadow-xs p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-gray-105 pb-2">
                  ✓ Checklist de Mesa
                </h4>
                
                <div className="space-y-2 text-xs">
                  <label className="flex items-start gap-2.5 cursor-pointer p-1.5 hover:bg-slate-50 rounded">
                    <input
                      type="checkbox"
                      checked={checklist.identidadeOk}
                      onChange={(e) => setChecklist(prev => ({ ...prev, identidadeOk: e.target.checked }))}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">Identidade & CPF Conferidos</span>
                      <span className="text-[10px] text-gray-500 text-xxs">Conferência física do RG/CPF do comprador</span>
                    </div>
                  </label>

                  {possuiProcurador && (
                    <label className="flex items-start gap-2.5 cursor-pointer p-1.5 hover:bg-slate-50 rounded text-amber-900 bg-amber-50/45">
                      <input
                        type="checkbox"
                        checked={checklist.procuracaoAssinada}
                        onChange={(e) => setChecklist(prev => ({ ...prev, procuracaoAssinada: e.target.checked }))}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">Procuração Válida Anexada</span>
                        <span className="text-[10px] text-gray-500 text-xxs">Validade jurídica e assinatura firma reconhecida</span>
                      </div>
                    </label>
                  )}

                  <label className="flex items-start gap-2.5 cursor-pointer p-1.5 hover:bg-slate-50 rounded">
                    <input
                      type="checkbox"
                      checked={checklist.quitacaoConfirmada}
                      onChange={(e) => setChecklist(prev => ({ ...prev, quitacaoConfirmada: e.target.checked }))}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">Quitação Contratual</span>
                      <span className="text-[10px] text-gray-500 text-xxs">Livre de débitos condominiais ou operacionais</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer p-1.5 hover:bg-slate-50 rounded">
                    <input
                      type="checkbox"
                      checked={checklist.dadosRevisados}
                      onChange={(e) => setChecklist(prev => ({ ...prev, dadosRevisados: e.target.checked }))}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">Firma Revisional Salva</span>
                      <span className="text-[10px] text-gray-500 text-xxs">Telefones e WhatsApp de chamados validados</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Anexar Documentos Digitais */}
              <div className="bg-white rounded-xl border border-gray-150 shadow-xs p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  📂 Arquivos do Comprador
                </h4>

                <div className="space-y-3">
                  {/* Categoria */}
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold block mb-1">Categoria do Documento</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 text-xs p-1.5 rounded-lg"
                    >
                      <option value="RG">RG do Titular</option>
                      <option value="CPF">CPF do Titular</option>
                      <option value="PROCURACAO">Mandato de Procuração</option>
                      <option value="COMPROVANTE">Comprovante de Endereço</option>
                      <option value="OUTROS">Outros Documentos Complementares</option>
                    </select>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div className="border border-dashed border-gray-300 hover:border-indigo-500 rounded-lg p-3 text-center transition-all">
                    <input
                      type="file"
                      id="cli-file-up"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".pdf,.png,.jpg,.jpeg"
                    />
                    <label htmlFor="cli-file-up" className="cursor-pointer space-y-1 block">
                      <UploadCloud className="w-7 h-7 mx-auto text-gray-400" />
                      <span className="text-xxs font-bold text-indigo-700 block">Escolher arquivo digital (PDF/PNG/JPG)</span>
                      <span className="text-[9px] text-gray-400 block">Limite de até 20MB</span>
                    </label>
                  </div>

                  {/* Lista de Documentos já anexados pelo comprador */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide block">Anexados ({activeClient.documentos.length})</span>
                    {activeClient.documentos.length === 0 ? (
                      <span className="text-xxs text-gray-400 block bg-slate-50 rounded p-2 text-center italic">Nenhum anexo foi salvo ainda.</span>
                    ) : (
                      activeClient.documentos.map(doc => (
                        <div key={doc.id} className="p-1.5 bg-slate-50 rounded border border-gray-100 flex justify-between items-center text-[11px]">
                          <div className="truncate max-w-[150px]">
                            <span className="font-semibold text-slate-800 block truncate">{doc.name}</span>
                            <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1 py-0.2 rounded">{doc.category}</span>
                          </div>
                          <span className="text-gray-400 text-[10px]">{doc.size}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Botões de Finalização do Atendimento */}
              <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-xl p-4 space-y-3 shadow-xs">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Próxima Etapa Operacional
                </h4>
                
                <p className="text-[11px] text-indigo-200 leading-normal">
                  Selecione o destino adequado para este comprador. O sistema dará baixa na sua mesa imediatamente.
                </p>

                <div className="space-y-2 pt-1.5">
                  {possuiVistoriadorProprio ? (
                    <>
                      {/* Caso tenha vistoriador próprio */}
                      <button
                        onClick={() => handleFinish(false)} // false = vai para "Aguardando Vistoriador Próprio"
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                      >
                        ⏱️ Reter: Aguardar Engenheiro
                      </button>
                      
                      <button
                        onClick={() => handleFinish(true)} // true = burla e manda direto para fila
                        className="w-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-semibold py-1.5 px-3 rounded-lg text-xxs flex items-center justify-center gap-1 transition-all cursor-pointer border border-slate-700"
                      >
                        Ignorar espera e enviar agora
                      </button>
                    </>
                  ) : (
                    /* Caso normal de vistoriador interno do condominio */
                    <button
                      onClick={() => handleFinish(true)}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
                    >
                      <span>Liberar para Fila de Vistoria</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* LISTA DE COMPRADORES RETIDOS: "AGUARDANDO VISTORIADOR PRÓPRIO" */}
          <div className="bg-white rounded-xl border border-gray-150 shadow-xs p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-xs font-bold text-slate-700 block">Espera Particular ({OwnAppraiserWaitingList.length})</span>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded">Retidos</span>
            </div>

            <p className="text-[10px] text-gray-500 leading-normal">
              Compradores com engenheiro particular retidos provisoriamente. Quando o arquiteto chegar, clique em <strong>"Liberar"</strong> para enviar à roleta.
            </p>

            <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
              {OwnAppraiserWaitingList.length === 0 ? (
                <span className="text-xxs text-gray-400 italic block text-center py-4 bg-slate-50 rounded">Não há compradores nesta espera agora.</span>
              ) : (
                OwnAppraiserWaitingList.map(item => (
                  <div key={item.id} className="p-2 bg-amber-50 rounded border border-amber-200/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block truncate max-w-[120px]">{item.nome}</span>
                      <span className="text-[9px] text-amber-800 block">Eng: {item.vistoriadorParticularNome || 'Não info.'}</span>
                      <span className="text-[10px] text-gray-500 mt-1 block">Sala: {item.unidade}</span>
                    </div>
                    
                    <button
                      onClick={() => onReleaseToInspection(item.id, true)} // Libera para fila de fato
                      className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-1 px-2.5 rounded text-xxs transition-colors cursor-pointer shrink-0"
                    >
                      Liberar Fila
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
