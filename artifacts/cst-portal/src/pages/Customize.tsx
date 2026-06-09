import { useState, useEffect } from "react";
import { useGetThemeSettings, useUpdateThemeSettings, getGetThemeSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Palette, Type, Layout, Image } from "lucide-react";

export default function Customize() {
  const { data: settings, isLoading } = useGetThemeSettings();
  const updateSettings = useUpdateThemeSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [primary, setPrimary] = useState("#2E5A6A");
  const [accent, setAccent] = useState("#3ECCD0");
  const [font, setFont] = useState("'Inter', sans-serif");
  const [radius, setRadius] = useState(8);

  useEffect(() => {
    if (settings) {
      setPrimary(settings.primaryColor);
      setAccent(settings.accentColor);
      setFont(settings.fontFamily);
      setRadius(settings.borderRadius);
    }
  }, [settings]);

  // Live preview effect could be added here by modifying CSS variables
  // useEffect(() => { ... document.documentElement.style.setProperty(...) }, [primary, accent, radius]);

  const handleSave = () => {
    if (!settings) return;
    updateSettings.mutate({ 
      data: { primaryColor: primary, accentColor: accent, fontFamily: font, borderRadius: radius } 
    }, {
      onSuccess: () => {
        toast({ description: "Tema atualizado. As mudanças foram aplicadas." });
        queryClient.invalidateQueries({ queryKey: getGetThemeSettingsQueryKey() });
      }
    });
  };

  if (isLoading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-black text-primary m-0">Personalização</h1>
        <p className="text-muted-foreground text-sm">Altere as cores e aparência do portal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground border-b border-border pb-3 m-0">
              <Palette size={18} className="text-primary" /> Cores
            </h2>
            
            <div>
              <label className="text-[13px] font-bold text-muted-foreground block mb-2">Cor Primária</label>
              <div className="flex gap-3 items-center">
                <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-none p-0" />
                <input type="text" value={primary} onChange={(e) => setPrimary(e.target.value)} className="flex-1 p-2 rounded-lg border border-border bg-background text-sm outline-none uppercase font-mono" />
              </div>
            </div>

            <div>
              <label className="text-[13px] font-bold text-muted-foreground block mb-2">Cor de Destaque</label>
              <div className="flex gap-3 items-center">
                <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-none p-0" />
                <input type="text" value={accent} onChange={(e) => setAccent(e.target.value)} className="flex-1 p-2 rounded-lg border border-border bg-background text-sm outline-none uppercase font-mono" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground border-b border-border pb-3 m-0">
              <Layout size={18} className="text-primary" /> Estrutura
            </h2>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[13px] font-bold text-muted-foreground">Arredondamento das Bordas</label>
                <span className="text-xs font-mono text-muted-foreground">{radius}px</span>
              </div>
              <input 
                type="range" min="0" max="24" value={radius} onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full accent-primary" 
              />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground border-b border-border pb-3 m-0 mb-6">
            <Image size={18} className="text-primary" /> Pré-visualização
          </h2>
          
          <div className="flex-1 bg-background rounded-lg border border-border p-6 flex flex-col justify-center items-center relative overflow-hidden" style={{ borderRadius: `${radius}px` }}>
            <div className="w-full max-w-[240px] space-y-4">
              <div className="h-10 w-full rounded" style={{ backgroundColor: primary, borderRadius: `${radius}px` }}></div>
              <div className="h-20 w-full bg-card border border-border rounded shadow-sm" style={{ borderRadius: `${radius}px` }}>
                <div className="h-2 w-1/2 mt-4 ml-4 rounded-full bg-muted-foreground/30"></div>
                <div className="h-2 w-3/4 mt-2 ml-4 rounded-full bg-muted-foreground/20"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 flex-1 rounded border border-border bg-background" style={{ borderRadius: `${radius}px` }}></div>
                <div className="h-8 w-16 rounded text-white text-[10px] font-bold flex items-center justify-center" style={{ backgroundColor: accent, borderRadius: `${radius}px` }}>Botão</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
        <button 
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-lg text-sm font-bold border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {updateSettings.isPending ? 'Salvando...' : 'Salvar e Aplicar'}
        </button>
      </div>
    </div>
  );
}