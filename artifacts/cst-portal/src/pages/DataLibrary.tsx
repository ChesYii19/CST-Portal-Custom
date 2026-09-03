import { CheckCircle2, Database, LoaderCircle, XCircle } from "lucide-react";
import { useGetDataLibrary } from "@workspace/api-client-react";

export default function DataLibrary() {
  const { data, isLoading, isError } = useGetDataLibrary();
  const status = isLoading ? "verificando..." : isError ? "indisponível" : "conectado";
  const StatusIcon = isLoading ? LoaderCircle : isError ? XCircle : CheckCircle2;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#00C1D420", color: "#00C1D4" }}>
            <Database size={23} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-primary m-0">Data Library</h1>
            <p className="text-muted-foreground text-sm">Fundação preparada para datasets estruturados</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Status</div>
          <div className="flex items-center gap-2 text-lg font-bold text-foreground">
            <StatusIcon size={18} className={isLoading ? "animate-spin" : ""} style={{ color: isError ? "#B91C1C" : "#486F5C" }} />
            {status}
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Datasets</div>
          <div className="text-2xl font-black text-foreground">{data?.total ?? 0}</div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-lg font-black text-foreground m-0 mb-2">Estrutura preparada para Data Library</h2>
        <p className="text-sm text-muted-foreground m-0">Esta tela valida a rota, a sessão e a conexão com a API. Os recursos ainda serão implementados.</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-lg font-black text-foreground m-0 mb-4">Próximos recursos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
          {['Datasets', 'Arquivos', 'Versões', 'Busca', 'Filtros', 'Importação', 'Visualizer'].map(resource => (
            <div key={resource} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#00C1D4" }} />
              {resource}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}