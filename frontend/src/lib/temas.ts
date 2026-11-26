import type { CSSProperties } from "react";

/**
 * Temas de cor do app. Cada pessoa escolhe o seu no Perfil (fica salvo na conta).
 * Todos são claros: `tinta` é a cor escura dos textos e dos cartões/botões principais,
 * `destaque` é a cor viva dos realces (progresso, "hoje", selecionados).
 * Os textos `suave` têm contraste de pelo menos 4,5:1 sobre o `fundo` (leitura confortável).
 */
export type Tema = {
  id: string;
  nome: string;
  fundo: string;
  superficie: string;
  superficie2: string;
  linha: string;
  tinta: string;
  suave: string;
  destaque: string;
};

export const TEMAS: Tema[] = [
  { id: "grafite", nome: "Grafite", fundo: "#f2f2ef", superficie: "#ffffff", superficie2: "#efefeb", linha: "#e4e4df", tinta: "#111111", suave: "#63635d", destaque: "#d4f55a" },
  { id: "rose", nome: "Rosé", fundo: "#fbf3f4", superficie: "#fffafb", superficie2: "#f6e7ea", linha: "#efdade", tinta: "#4a1f2e", suave: "#7a5965", destaque: "#f7b8c9" },
  { id: "lavanda", nome: "Lavanda", fundo: "#f5f3fb", superficie: "#fdfcff", superficie2: "#ece8f7", linha: "#e1dbf1", tinta: "#2b2145", suave: "#665d82", destaque: "#cbb8ff" },
  { id: "pessego", nome: "Pêssego", fundo: "#fcf5ef", superficie: "#fffcf9", superficie2: "#f5e9de", linha: "#eddccc", tinta: "#3d2a20", suave: "#76665c", destaque: "#ffc8a2" },
  { id: "champanhe", nome: "Champanhe", fundo: "#f8f4ee", superficie: "#fffdf9", superficie2: "#efe7dc", linha: "#e6dacb", tinta: "#33291f", suave: "#71665b", destaque: "#e9d1a6" },
  { id: "salvia", nome: "Sálvia", fundo: "#f1f5f2", superficie: "#fbfdfb", superficie2: "#e4ece6", linha: "#d8e3db", tinta: "#1f3028", suave: "#5a6d63", destaque: "#b5e3c4" },
  { id: "ceu", nome: "Céu", fundo: "#f1f5fa", superficie: "#fbfdff", superficie2: "#e5ecf6", linha: "#d8e2ef", tinta: "#172540", suave: "#5a6880", destaque: "#acd5ff" },
  { id: "chiclete", nome: "Chiclete", fundo: "#fdf1f6", superficie: "#fffafc", superficie2: "#f8e1ec", linha: "#f1d1e0", tinta: "#5a0f3c", suave: "#80546b", destaque: "#ff9ccc" },
];

export const TEMA_PADRAO = TEMAS[0];

export const temaDe = (id: string | undefined | null): Tema => TEMAS.find((t) => t.id === id) ?? TEMA_PADRAO;

/** As variáveis de cor do Tailwind (tema) trocadas para as do tema escolhido. */
export function estiloTema(tema: Tema): CSSProperties {
  return {
    "--color-fundo": tema.fundo,
    "--color-superficie": tema.superficie,
    "--color-superficie-2": tema.superficie2,
    "--color-linha": tema.linha,
    "--color-tinta": tema.tinta,
    "--color-escuro": tema.tinta,
    "--color-suave": tema.suave,
    "--color-lima": tema.destaque,
  } as CSSProperties;
}

/** Aplica o tema também no <html> (fundo ao rolar além da tela) e na barra do navegador. */
export function aplicarTemaNaPagina(tema: Tema) {
  const raiz = document.documentElement;
  for (const [k, v] of Object.entries(estiloTema(tema))) raiz.style.setProperty(k, String(v));
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", tema.fundo);
}
