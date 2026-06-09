import { useState } from "react";
import { useGetDocuments, useDeleteDocument, getGetDocumentsQueryKey } from "@workspace/api-client-react";
import { Search, File as FileIcon, Download, Trash2, Folder } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Documents() {
  const [search, setSearch] = useState("");
  const { data: docs, isLoading } = useGetDocuments({ search }, { query: { queryKey: getGetDocumentsQueryKey({ search }) } });
  const deleteDoc = useDeleteDocument();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (id: number) => {
    deleteDoc.mutate({ id }, {
      onSuccess: () => {
        toast({ description: "Documento excluído" });
        queryClient.invalidateQueries({ queryKey: getGetDocumentsQueryKey() });
      }
    });
  };

  const departments = ['Administração', 'RH', 'Financeiro', 'Projetos'];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-black text-primary m-0">Documentos</h1>
        <p className="text-muted-foreground text-sm">Repositório de arquivos institucionais</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {departments.map((dept, i) => (
          <div key={i} className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center gap-3 cursor-pointer hover:border-primary/50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Folder size={20} />
            </div>
            <div className="font-bold text-sm text-foreground">{dept}</div>
          </div>
        ))}
      </div>

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
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold border-none cursor-pointer hover:opacity-90 transition-opacity">
            + Novo Documento
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
              ) : docs?.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Nenhum documento encontrado.</td></tr>
              ) : (
                docs?.map(doc => (
                  <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="p-3 px-4"><FileIcon size={16} className="text-muted-foreground" /></td>
                    <td className="p-3 font-medium text-foreground">{doc.name} <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground ml-2">{doc.ext}</span></td>
                    <td className="p-3 text-muted-foreground">{doc.dept}</td>
                    <td className="p-3 text-muted-foreground">{doc.uploadedAt}</td>
                    <td className="p-3 text-muted-foreground">{doc.size}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1.5 rounded bg-transparent border-none text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer transition-colors"><Download size={16} /></button>
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
    </div>
  );
}