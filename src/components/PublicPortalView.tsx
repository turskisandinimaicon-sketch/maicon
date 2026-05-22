import React, { useState, useEffect } from 'react';
import { Client, DocumentAttachment } from '../types';
import { 
  Building, UploadCloud, CheckCircle, FileSpreadsheet, ShieldAlert, 
  HelpCircle, CheckSquare, Sparkles, Send, MapPin, Building2, UserCheck
} from 'lucide-react';

interface PublicPortalViewProps {
  clients: Client[];
  initialClientId?: string;
  onUploadLaudo: (clientId: string, data: { docName: string, category: 'LAUDO_PARTICULAR', base64Content: string }) => void;
}

export default function PublicPortalView({
  clients,
  initialClientId,
  onUploadLaudo
}: PublicPortalViewProps) {
  // Query / URL Simulation Params
  const [queryClientId, setQueryClientId] = useState(initialClientId || '');
  const [cpfLookup, setCpfLookup] = useState('');
  const [unidadeLookup, setUnidadeLookup] = useState('');
  
  const [clientObj, setClientObj] = useState<Client | null>(null);
  const [obsText, setObsText] = useState('');
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Carregar cliente se estiver definido
  useEffect(() => {
    if (queryClientId) {
      const exist = clients.find(c => c.id === queryClientId);
      if (exist) {
        setClientObj(exist);
      }
    }
  }, [queryClientId, clients]);

  // Busca manual caso acesse cru
  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCpf = cpfLookup.replace(/\D/g, '');
    const found = clients.find(c => 
      c.cpf.replace(/\D/g, '') === cleanCpf && 
      c.unidade.toLowerCase().includes(unidadeLookup.toLowerCase())
    );

    if (found) {
      setClientObj(found);
      setUploadSuccess(false);
    } else {
      alert("Comprador não localizado! Por favor reconfirme o CPF e o Número do Apartamento informados.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (file.size > 20 * 1024 * 1024) {
      alert("Atenção! Seu arquivo excede o limite de 20MB permitido pela incorporadora.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
      setFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handlePortalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientObj || !fileBase64) {
      alert("Por favor, adicione o arquivo em PDF ou Imagem da sua vistoria.");
      return;
    }

    onUploadLaudo(clientObj.id, {
      docName: fileName,
      category: 'LAUDO_PARTICULAR',
      base64Content: fileBase64
    });

    setUploadSuccess(true);
    setFileName('');
    setFileBase64(null);
    setObsText('');
  };

  return (
    <div className="bg-slate-50 min-h-[85vh] p-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-md border border-gray-150 max-w-xl w-full overflow-hidden">
        
        {/* Banner Comercial Incorporadora */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 relative">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded border border-indigo-400/20 uppercase tracking-widest">Portal de Vistoria do Cliente</span>
              <h2 className="text-xl font-bold tracking-tight">Anexar Laudo de Engenharia Particular</h2>
            </div>
            <Building className="w-8 h-8 text-indigo-400 opacity-60" />
          </div>
          <p className="text-xs text-indigo-200 mt-2">
            Disponibilizamos este canal seguro para que proprietários enviem os laudos de assistências técnicas contratadas.
          </p>
        </div>

        {!clientObj ? (
          /* PASSO 1: Autenticação por CPF + Unidade */
          <form onSubmit={handleLookup} className="p-6 space-y-4">
            <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50 text-xxs text-indigo-805 flex gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Para garantir a segurança dos seus dados conforme as políticas da incorporadora, informe suas credenciais de propriedade abaixo para prosseguir.
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 block">CPF do Proprietário Titular</label>
                <input
                  type="text"
                  placeholder="000.000.000-00 (Apenas números)"
                  required
                  value={cpfLookup}
                  onChange={(e) => setCpfLookup(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 block">Número do Apartamento / Unidade</label>
                <input
                  type="text"
                  placeholder="Ex: Apto 203 ou 1205"
                  required
                  value={unidadeLookup}
                  onChange={(e) => setUnidadeLookup(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs cursor-pointer shadow-xs transition-colors"
            >
              Consultar Minha Unidade
            </button>
          </form>
        ) : (
          /* PASSO 2: Upload de arquivos e feedback */
          <div className="p-6 space-y-5">
            {uploadSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="p-4 bg-emerald-50 rounded-full border border-emerald-100 max-w-fit mx-auto text-emerald-600 animate-bounce">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Laudo Enviado com Sucesso!</h3>
                  <p className="text-xxs text-gray-500 max-w-sm mx-auto mt-1">
                    Seu documento de auditoria técnica foi salvo no cadastro. Nossa engenharia fará as devidas retificações do manual antes do fechamento total.
                  </p>
                </div>
                
                <div className="bg-slate-50 rounded-lg p-2.5 text-slate-700 font-bold text-xxs flex items-center justify-center gap-1">
                  <span>UNIDADE: {clientObj.unidade} ({clientObj.empreendimento})</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUploadSuccess(false);
                    setClientObj(null);
                    setCpfLookup('');
                    setUnidadeLookup('');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xxs py-1.5 px-4 rounded cursor-pointer transition-all"
                >
                  Fazer outro envio
                </button>
              </div>
            ) : (
              <form onSubmit={handlePortalSubmit} className="space-y-4 text-xs">
                {/* Cabecalho de Dados Carregados */}
                <div className="bg-slate-50 border border-gray-150 p-3 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>{clientObj.nome}</span>
                    <span className="text-indigo-600">{clientObj.unidade}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 flex justify-between">
                    <span>Empreendimento: {clientObj.empreendimento}</span>
                    <span>CPF: ***.***.{clientObj.cpf.substring(8)}</span>
                  </div>
                </div>

                {/* Upload Section */}
                <div className="space-y-1.5 text-center">
                  <label className="text-[11px] font-bold text-slate-700 block text-left">Carregar Laudo da Assessoria (Até 20MB)</label>
                  
                  <div className="border border-dashed border-gray-300 hover:border-indigo-600 rounded-xl p-6 transition-all bg-slate-50/40 relative">
                    <input
                      type="file"
                      id="cli-portal-upload"
                      className="hidden"
                      onChange={handleFileChange}
                      required
                      accept=".pdf,.png,.jpg,.jpeg"
                    />
                    <label htmlFor="cli-portal-upload" className="cursor-pointer space-y-1 block">
                      <UploadCloud className="w-10 h-10 text-gray-400 mx-auto" />
                      <span className="text-xxs font-extrabold text-indigo-700 block">
                        {fileName ? `✓ ${fileName}` : 'Clique para selecionar seu Laudo PDF/Imagem'}
                      </span>
                      <span className="text-[9px] text-gray-400 block">Serão admitidos PDF, PNG ou JPG de até 20 Megabytes</span>
                    </label>
                  </div>
                </div>

                {/* Notas Opcionais */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Comentários Técnicos Opcionais</label>
                  <textarea
                    rows={3}
                    placeholder="Caso queira, indique observações de acabamento observadas pelo laudo..."
                    value={obsText}
                    onChange={(e) => setObsText(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none text-xxs"
                  />
                </div>

                {/* Submit */}
                <div className="flex gap-2 text-xxs">
                  <button
                    type="button"
                    onClick={() => setClientObj(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-bold cursor-pointer transition-colors"
                  >
                    Trocar Unidade
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-bold cursor-pointer shadow-sm transition-colors"
                  >
                    Enviar Laudo Particular
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
