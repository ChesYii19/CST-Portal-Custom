import { useState } from "react";
import { useGetDocuments, useDeleteDocument, getGetDocumentsQueryKey } from "@workspace/api-client-react";
import { Search, File as FileIcon, Download, Trash2, Folder, X, Save, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const DEPTS = ['Administração', 'RH', 'Financeiro', 'Projetos', 'TI', 'Jurídico'];

export default function Documents() {
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', dept: DEPTS[0], size: '1.5 MB', ext: 'pdf' });
  const [loading, setLoading] = useState(false);

  const { data: docs, isLoading } = useGetDocuments(
    { search: search || undefined },
    { query: { queryKey: getGetDocumentsQueryKey({ search: search || undefined }) } }
  );
  const deleteDoc = useDeleteDocument();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const filteredDocs = filterDept
    ? docs?.filter(d => d.dept === filterDept)
    : docs;

  const handleDelete = (id: number) => {
    if (!confirm('Excluir este documento?')) return;
    deleteDoc.mutate({ id }, {
      onSuccess: () => {
        toast({ description: "Documento excluído" });
        queryClient.invalidateQueries({ queryKey: getGetDocumentsQueryKey() });
      }
    });
  };

  const handleCreate = () => {
    if (!form.name.trim()) return;
    setLoading(true);
    fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    })
      .then(r => r.json())
      .then(() => {
        toast({ description: "Documento adicionado" });
        queryClient.invalidateQueries({ queryKey: getGetDocumentsQueryKey() });
        setShowModal(false);
        setForm({ name: '', dept: DEPTS[0], size: '1.5 MB', ext: 'pdf' });
        setLoading(false);
      })
      .catch(() => {
        toast({ variant: "destructive", description: "Erro ao adicionar" });
        setLoading(false);
      });
  };

  const handleDownload = (doc: any) => {
    const text = `Documento: ${doc.name}\nDepartamento: ${doc.dept}\nData: ${doc.uploadedAt}\nTamanho: ${doc.size}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.name}.txt`;
    a.click();
    toast({ description: `Download de "${doc.name}" iniciado` });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-black text-primary m-0">Documentos</h1>
        <p className="text-muted-foreground text-sm">Repositório de arquivos institucionais</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {DEPTS.slice(0,4).map((dept, i) => (
          <button key={i} onClick={() => setFilterDept(filterDept === dept ? null : dept)} className={`bg-card p-4 rounded-xl border shadow-sm flex items-center gap-3 cursor-pointer transition-colors ${filterDept === dept ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Folder size={20} />
            </div>
            <div className="font-bold text-sm text-foreground">{dept}</div>
          </button>
        ))}
      </div>

      {filterDept && (
        <div className="flex items-center gap-2 text-sm">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
            Filtrando: {filterDept}
            <button onClick={() => setFilterDept(null)} className="ml-2 hover:text-destructive cursor-pointer border-none bg-transparent">x</button>
          </span>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Buscar documentos..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-2 pl-9 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
            />
          </div>
          <button onClick={() => setShowModal(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold border-none cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-2">
            <Plus size={16} /> Novo Documento
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground font-bold">
              <tr>
                <th className="p-3 px-4 w-10"></th>
                <th className="p-3">Nome do Arquivo</th>
                <th className="p-3">Setor</th>
                <th className="p-3">Data</th>
                <th className="p-3">Tamanho</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Carregando...</td></tr>
              ) : filteredDocs?.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Nenhum documento encontrado.</td></tr>
              ) : (
                filteredDocs?.map(doc => (
                  <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="p-3 px-4"><FileIcon size={16} className="text-muted-foreground" /></td>
                    <td className="p-3 font-medium text-foreground">{doc.name} <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground ml-2">{doc.ext}</span></td>
                    <td className="p-3 text-muted-foreground">{doc.dept}</td>
                    <td className="p-3 text-muted-foreground">{doc.uploadedAt}</td>
                    <td className="p-3 text-muted-foreground">{doc.size}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleDownload(doc)} className="p-1.5 rounded bg-transparent border-none text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer transition-colors"><Download size={16} /></button>
                        <button onClick={() => handleDelete(doc.id)} className="p-1.5 rounded bg-transparent border-none text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Documento */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-foreground">Novo Documento</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-muted cursor-pointer border-none bg-transparent text-muted-foreground"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Nome</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full p-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary" placeholder="Nome do arquivo..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Departamento</label>
                  <select value={form.dept} onChange={e => setForm({ ...form, dept: e.target.value })} className="w-full p-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary">
                    {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Extensão</label>
                  <select value={form.ext} onChange={e => setForm({ ...form, ext: e.target.value })} className="w-full p-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary">
                    <option value="pdf">PDF</option>
                    <option value="docx">DOCX</option>
                    <option value="xlsx">XLSX</option>
                    <option value="txt">TXT</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-bold border border-border bg-transparent cursor-pointer hover:bg-muted">Cancelar</button>
              <button onClick={handleCreate} disabled={loading || !form.name.trim()} className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-primary-foreground border-none cursor-pointer hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                <Save size={16} /> {loading ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
