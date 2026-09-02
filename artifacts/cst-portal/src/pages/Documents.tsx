import { useState } from "react";
import { useGetDocuments, useDeleteDocument, useGetMe, getGetDocumentsQueryKey } from "@workspace/api-client-react";
import { Search, Download, Trash2, Folder, X, Save, Plus, FileText, FileSpreadsheet, FileImage, File } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CST } from "@/lib/brand";

const DEPTS = ['Administração', 'RH', 'Financeiro', 'Projetos', 'TI', 'Jurídico'];

const FOLDER_COLORS = [CST.azul, CST.agua, CST.mata, CST.terracota, CST.rosa, CST.champanhe];

type ExtConf = { icon: typeof File; bg: string; text: string };
const EXT_CONFIG: Record<string, ExtConf> = {
  pdf:  { icon: FileText,        bg: '#FEE2E2', text: '#B91C1C' },
  docx: { icon: FileText,        bg: '#DBEAFE', text: '#1D4ED8' },
  doc:  { icon: FileText,        bg: '#DBEAFE', text: '#1D4ED8' },
  xlsx: { icon: FileSpreadsheet, bg: `${CST.mata}20`, text: CST.mata },
  xls:  { icon: FileSpreadsheet, bg: `${CST.mata}20`, text: CST.mata },
  png:  { icon: FileImage,       bg: `${CST.rosa}20`, text: CST.terracota },
  jpg:  { icon: FileImage,       bg: `${CST.rosa}20`, text: CST.terracota },
  txt:  { icon: File,            bg: 'var(--color-muted)', text: 'var(--color-muted-foreground)' },
};

const getExtConf = (ext: string): ExtConf =>
  EXT_CONFIG[ext?.toLowerCase()] || { icon: File, bg: 'var(--color-muted)', text: 'var(--color-muted-foreground)' };


export default function Documents() {
  const [search,      setSearch]     = useState("");
  const [filterDept,  setFilterDept] = useState<string | null>(null);
  const [showModal,   setShowModal]  = useState(false);
  const [form, setForm] = useState({ name: '', dept: DEPTS[0], size: '1.5 MB', ext: 'pdf' });
  const [loading, setLoading] = useState(false);

  const { data: me }      = useGetMe();
  const canManage         = me?.role === 'admin' || me?.role === 'sector_manager';

  const { data: docs, isLoading } = useGetDocuments(
    { search: search || undefined },
    { query: { queryKey: getGetDocumentsQueryKey({ search: search || undefined }) } }
  );
  const deleteDoc   = useDeleteDocument();
  const queryClient = useQueryClient();
  const { toast }   = useToast();

  const filteredDocs = filterDept ? docs?.filter(d => d.dept === filterDept) : docs;

  const handleDelete = (id: number) => {
    if (!confirm('Excluir este documento?')) return;
    deleteDoc.mutate({ id }, {
      onSuccess: () => { toast({ description: "Documento excluído" }); queryClient.invalidateQueries({ queryKey: getGetDocumentsQueryKey() }); },
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
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "Erro ao adicionar documento");
        return data;
      })
      .then(() => {
        toast({ description: "Documento adicionado" });
        queryClient.invalidateQueries({ queryKey: getGetDocumentsQueryKey() });
        setShowModal(false);
        setForm({ name: '', dept: DEPTS[0], size: '1.5 MB', ext: 'pdf' });
        setLoading(false);
      })
      .catch(() => { toast({ variant: "destructive", description: "Erro ao adicionar" }); setLoading(false); });
  };

  const handleDownload = (doc: any) => {
    const text = `Documento: ${doc.name}\nDepartamento: ${doc.dept}\nData: ${doc.uploadedAt}\nTamanho: ${doc.size}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${doc.name}.txt`; a.click();
    toast({ description: `Download de "${doc.name}" iniciado` });
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  const deptCounts = DEPTS.reduce((acc, dept) => {
    acc[dept] = docs?.filter(d => d.dept === dept).length || 0;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black text-primary m-0">Documentos</h1>
          <p className="text-muted-foreground text-sm">Repositório de arquivos institucionais</p>
        </div>
        {canManage && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white border-none cursor-pointer hover:opacity-90 transition-all shadow-sm"
            style={{ backgroundColor: CST.azul }}>
            <Plus size={16} /> Novo Documento
          </button>
        )}
      </div>

      {/* Pastas de departamento */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {DEPTS.map((dept, i) => {
          const active  = filterDept === dept;
          const fColor  = FOLDER_COLORS[i % FOLDER_COLORS.length];
          const count   = deptCounts[dept] || 0;
          return (
            <button key={dept}
              onClick={() => setFilterDept(active ? null : dept)}
              className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 cursor-pointer transition-all hover:shadow-sm ${active ? 'scale-[1.03]' : 'hover:-translate-y-px'}`}
              style={active
                ? { borderColor: fColor, backgroundColor: `${fColor}15` }
                : { borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${fColor}20` }}>
                <Folder size={18} style={{ color: fColor }} />
              </div>
              <div className="text-center">
                <div className="text-[11px] font-bold text-foreground leading-tight">{dept}</div>
                <div className="text-[10px] text-muted-foreground">{count} doc{count !== 1 ? 's' : ''}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filtro ativo */}
      {filterDept && (
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ backgroundColor: `${CST.azul}15`, color: CST.azul }}>
            <Folder size={12} /> Filtrando: {filterDept}
            <button onClick={() => setFilterDept(null)} className="cursor-pointer border-none bg-transparent p-0 ml-1 hover:opacity-70">
              <X size={12} />
            </button>
          </span>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex gap-3 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Buscar documentos..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors" />
          </div>
          {docs && (
            <span className="text-xs text-muted-foreground font-medium ml-auto shrink-0">
              {filteredDocs?.length || 0} documento{(filteredDocs?.length || 0) !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-muted/60 text-muted-foreground text-xs font-bold uppercase tracking-wide">
                <th className="p-3 px-4">Arquivo</th>
                <th className="p-3">Departamento</th>
                <th className="p-3">Data</th>
                <th className="p-3">Tamanho</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1,2,3,4].map(i => (
                  <tr key={i} className="border-b border-border">
                    {[1,2,3,4,5].map(j => <td key={j} className="p-3"><div className="h-5 bg-muted rounded animate-pulse" /></td>)}
                  </tr>
                ))
              ) : filteredDocs?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Folder size={28} className="text-muted-foreground/30" />
                      <p className="text-muted-foreground text-sm">Nenhum documento encontrado.</p>
                      {canManage && (
                        <button onClick={() => setShowModal(true)} className="text-xs font-bold text-primary hover:underline cursor-pointer border-none bg-transparent mt-1">
                          + Adicionar documento
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                Array.isArray(filteredDocs) && filteredDocs.map(doc => {
                  const conf  = getExtConf(doc.ext);
                  const Icon  = conf.icon;
                  return (
                    <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="p-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: conf.bg }}>
                            <Icon size={16} style={{ color: conf.text }} />
                          </div>
                          <div>
                            <div className="font-semibold text-foreground text-[13px]">{doc.name}</div>
                            <div className="text-[10px] font-bold uppercase" style={{ color: conf.text }}>{doc.ext}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-xs font-semibold text-muted-foreground px-2 py-0.5 rounded-md bg-muted">{doc.dept}</span>
                      </td>
                      <td className="p-3 text-muted-foreground text-[13px]">{formatDate(doc.uploadedAt)}</td>
                      <td className="p-3 text-muted-foreground text-[13px]">{doc.size}</td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleDownload(doc)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent border-none text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer transition-colors">
                            <Download size={15} />
                          </button>
                          {canManage && (
                            <button onClick={() => handleDelete(doc.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent border-none text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors">
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Documento — apenas para admin/gestor */}
      {showModal && canManage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg text-foreground m-0">Novo Documento</h3>
                <p className="text-xs text-muted-foreground">Adicione um registro ao repositório</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted cursor-pointer border-none bg-transparent text-muted-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Nome do Arquivo</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
                  placeholder="Ex: Relatório de Atividades 2025" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Departamento</label>
                  <select value={form.dept} onChange={e => setForm({ ...form, dept: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors">
                    {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Formato</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['pdf','docx','xlsx','txt'].map(ext => {
                      const conf = getExtConf(ext);
                      return (
                        <button key={ext} onClick={() => setForm({ ...form, ext })}
                          className="py-1.5 rounded-lg border-2 text-[11px] font-bold cursor-pointer transition-all"
                          style={form.ext === ext
                            ? { borderColor: conf.text, backgroundColor: conf.bg, color: conf.text }
                            : { borderColor: 'var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-muted-foreground)' }}>
                          {ext.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold border border-border bg-transparent cursor-pointer hover:bg-muted transition-colors text-foreground">
                Cancelar
              </button>
              <button onClick={handleCreate} disabled={loading || !form.name.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-40 flex items-center gap-2 transition-all"
                style={{ backgroundColor: CST.azul }}>
                <Save size={15} /> {loading ? 'Adicionando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
