/* ===================================================
   CST Brand Guide — Fonte única de cores e tipografia
   Extraído do Brand Guide CSTL (PDF oficial)
   =================================================== */

export const CST = {
  azul:      '#2E5665',   /* Azul Guardiã    — âncora, 30% */
  rosa:      '#FC9BB3',   /* Rosa Amparo     — primária */
  amarelo:   '#FEDC05',   /* Amarelo Esperança — acento, 10% */
  agua:      '#00C1D4',   /* Verde-água Cura  — primária digital */
  terracota: '#A58877',   /* Terracota Raiz   — secundária */
  mata:      '#486F5C',   /* Verde Mata       — secundária */
  champanhe: '#E3DC97',   /* Champanhe Acolhimento — secundária */
  ceu:       '#88CAE3',   /* Azul Céu        — secundária */
} as const;

export const PALETTE = Object.values(CST);

/* Proporção 60/30/10:
   60% — Branco/Papel (background)
   30% — Azul Guardiã (sidebar, títulos, blocos)
   10% — Amarelo (botões de ação, pontuação visual)  */

export type CSTColor = keyof typeof CST;
