import type { CSSProperties } from "react";
import type { Compromisso, Status } from "./tipos";

export type CategoriaId = "trabalho" | "musico" | "estetica";

export type Tipo = { id: string; nome: string; cor: string };

export type Categoria = {
  id: CategoriaId;
  nome: string;
  emoji: string;
  descricao: string;
  /** Degradê da agenda: cartão principal, botões e destaques. */
  gradiente: string;
  /** Duas cores da agenda (brilho de fundo e detalhes). */
  acento: [string, string];
  tipos: Tipo[];
  titulo: { rotulo: string; exemplo: string };
  /** Campos extras: só aparecem os que têm rótulo. */
  cliente?: string;
  telefone?: boolean;
  local?: string;
  valor?: string;
  status: Status[];
  /** Mensagem pronta do WhatsApp. Sem ela, não aparece o botão. */
  mensagem?: (c: Compromisso, tipo: Tipo, quando: string) => string;
};

const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0];

export const CATEGORIAS: Categoria[] = [
  {
    id: "trabalho",
    nome: "Trabalho",
    emoji: "💼",
    descricao: "Reuniões, tarefas e prazos",
    gradiente: "linear-gradient(135deg, #4cc9f0, #c6f35e)",
    acento: ["#4cc9f0", "#c6f35e"],
    tipos: [
      { id: "reuniao", nome: "Reunião", cor: "mirtilo" },
      { id: "tarefa", nome: "Tarefa", cor: "menta" },
      { id: "prazo", nome: "Prazo", cor: "morango" },
      { id: "visita", nome: "Visita", cor: "tangerina" },
      { id: "outro", nome: "Outro", cor: "uva" },
    ],
    titulo: { rotulo: "O que é?", exemplo: "Ex.: Reunião com a equipe" },
    cliente: "Com quem",
    local: "Local ou link",
    status: ["marcado", "feito", "cancelado"],
  },
  {
    id: "musico",
    nome: "Músico",
    emoji: "🎸",
    descricao: "Shows, ensaios e aulas",
    gradiente: "linear-gradient(135deg, #9b7bff, #ff5ca8)",
    acento: ["#9b7bff", "#ff5ca8"],
    tipos: [
      { id: "show", nome: "Show", cor: "uva" },
      { id: "ensaio", nome: "Ensaio", cor: "chiclete" },
      { id: "aula", nome: "Aula", cor: "manga" },
      { id: "gravacao", nome: "Gravação", cor: "mirtilo" },
      { id: "outro", nome: "Outro", cor: "kiwi" },
    ],
    titulo: { rotulo: "Nome do evento", exemplo: "Ex.: Show no Bar do Zé" },
    cliente: "Contratante",
    telefone: true,
    local: "Local",
    valor: "Cachê (R$)",
    status: ["marcado", "confirmado", "pago", "cancelado"],
    mensagem: (c, _tipo, quando) =>
      `${c.cliente ? `Olá, ${primeiroNome(c.cliente)}!` : "Olá!"} Passando para confirmar: *${c.titulo}*, ${quando}${
        c.local ? `, em ${c.local}` : ""
      }. Tudo certo?`,
  },
  {
    id: "estetica",
    nome: "Estética",
    emoji: "💅",
    descricao: "Clientes e atendimentos",
    gradiente: "linear-gradient(135deg, #ff5ca8, #ffc145)",
    acento: ["#ff5ca8", "#ffc145"],
    tipos: [
      { id: "cabelo", nome: "Cabelo", cor: "chiclete" },
      { id: "unhas", nome: "Unhas", cor: "morango" },
      { id: "sobrancelha", nome: "Sobrancelha", cor: "tangerina" },
      { id: "maquiagem", nome: "Maquiagem", cor: "uva" },
      { id: "pele", nome: "Pele", cor: "menta" },
      { id: "outro", nome: "Outro", cor: "manga" },
    ],
    titulo: { rotulo: "Cliente", exemplo: "Nome da cliente" },
    telefone: true,
    valor: "Valor (R$)",
    status: ["marcado", "confirmado", "pago", "cancelado"],
    mensagem: (c, tipo, quando) =>
      `Olá, ${primeiroNome(c.titulo)}! Passando para confirmar seu horário de *${tipo.nome}*: ${quando}. Te espero! 💖`,
  },
];

/** Variáveis CSS da agenda (degradê e brilho). */
export const estiloCategoria = (cat: Categoria) =>
  ({ "--arco": cat.gradiente, "--acento": cat.acento[0], "--acento-2": cat.acento[1] }) as CSSProperties;

export const categoriaDe = (id: string) => CATEGORIAS.find((c) => c.id === id);

export const tipoDe = (cat: Categoria, id: string): Tipo =>
  cat.tipos.find((t) => t.id === id) ?? cat.tipos[cat.tipos.length - 1];
