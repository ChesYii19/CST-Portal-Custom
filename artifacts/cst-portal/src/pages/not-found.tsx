import { useLocation } from "wouter";
import { CST, PALETTE } from "@/lib/brand";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden font-sans px-6">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-[0.06]" style={{ backgroundColor: CST.azul }} />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full opacity-[0.06]" style={{ backgroundColor: CST.agua }} />
        <div className="absolute top-1/3 right-1/4 w-16 h-16 rounded-full opacity-10" style={{ backgroundColor: CST.amarelo }} />
      </div>

      <div className="absolute top-0 left-0 right-0 flex h-1.5">
        {PALETTE.map((c, i) => <div key={i} className="flex-1" style={{ background: c }} />)}
      </div>

      <div className="relative z-10 text-center max-w-md">
        <div className="text-[120px] font-black leading-none select-none mb-0" style={{ color: `${CST.azul}18` }}>
          404
        </div>

        <img
          src="/logo-positivo.png"
          alt="Casa Santa Teresinha"
          className="h-12 w-auto object-contain mx-auto mb-6 -mt-4 opacity-80"
        />

        <h1 className="text-2xl font-black text-foreground mb-3">Página não encontrada</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          A página que você está procurando não existe ou foi movida.<br />
          Verifique o endereço ou volte ao início.
        </p>

        <div className="flex gap-3 justify-center">
          <button onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border border-border bg-transparent cursor-pointer hover:bg-muted transition-colors text-foreground">
            <ArrowLeft size={15} /> Voltar
          </button>
          <button onClick={() => setLocation("/")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white border-none cursor-pointer hover:opacity-90 transition-all shadow-sm"
            style={{ backgroundColor: CST.azul }}>
            <Home size={15} /> Início
          </button>
        </div>
      </div>

      <div className="absolute bottom-6">
        <img
          src="/logo-primario.png"
          alt="Casa Santa Teresinha"
          className="h-6 w-auto object-contain opacity-60"
        />
      </div>
    </div>
  );
}
