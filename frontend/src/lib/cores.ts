import type { CSSProperties } from "react";

type Cor = { nome: string; forte: string; texto: string };

// Paleta viva sobre fundo escuro. O banco guarda só a chave (ex.: "uva").
// forte = bolinha do tipo; texto = versão escura legível sobre fundo claro.
export const PALETA: Record<string, Cor> = {
  uva:       { nome: "Uva",       forte: "#8b6cf0", texto: "#5b3fc4" },
  chiclete:  { nome: "Chiclete",  forte: "#ec5a9b", texto: "#a8326b" },
  morango:   { nome: "Morango",   forte: "#e85d4f", texto: "#a83426" },
  tangerina: { nome: "Tangerina", forte: "#ef8a3c", texto: "#a65514" },
  manga:     { nome: "Manga",     forte: "#e3b23c", texto: "#8a6410" },
  kiwi:      { nome: "Kiwi",      forte: "#7cc242", texto: "#3f7a12" },
  menta:     { nome: "Menta",     forte: "#3dbb8c", texto: "#1d7a56" },
  mirtilo:   { nome: "Mirtilo",   forte: "#4a8fe7", texto: "#2459a8" },
};

/** Ordem usada para "intercalar" cores em cartões e gráficos. */
export const INTERCALADAS = ["#d4f55a", "#111111", "#ffffff"];

export const corDe = (chave: string | undefined): Cor => PALETA[chave ?? ""] ?? PALETA.uva;

/**
 * Variáveis CSS da cor, para classes como `bg-(--c)`, `text-(--c-texto)` e `bg-(--c-clara)`.
 * `--c-clara` é a cor bem transparente (fundo de cartão no tema escuro).
 */
export function estiloCor(chave: string | undefined): CSSProperties {
  const c = corDe(chave);
  return { "--c": c.forte, "--c-clara": `${c.forte}1f`, "--c-texto": c.texto } as CSSProperties;
}
