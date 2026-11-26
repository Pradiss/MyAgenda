import type { CSSProperties } from "react";
import { RAMOS_ESTETICA, SERVICOS_ANTIGOS, type Ramo } from "./ramosEstetica";
import type { Compromisso, Status } from "./tipos";

export type CategoriaId = "trabalho" | "musico" | "estetica";

/** Tipo de compromisso (na Estética, um serviço). `duracao` em minutos ajusta o fim ao escolher. */
export type Tipo = { id: string; nome: string; cor: string; duracao?: number };
export type { Ramo };

export type Categoria = {
  id: CategoriaId;
  nome: string;
  emoji: string;
  descricao: string;
  /** Degradê da agenda: cartão principal, botões e destaques. */
  gradiente: string;
  /** Duas cores da agenda (brilho de fundo e detalhes). */
  acento: [string, string];
  /** O que aparece para escolher ao marcar. */
  tipos: Tipo[];
  /** Agendas com ramos (Estética): cada pessoa escolhe os seus; os tipos vêm dos ramos escolhidos. */
  ramos?: Ramo[];
  /** Todos os tipos já existentes (para mostrar compromissos antigos de ramos não escolhidos). */
  todosTipos?: Tipo[];
  titulo: { rotulo: string; exemplo: string };
  /** Campos extras: só aparecem os que têm rótulo. */
  cliente?: string;
  telefone?: boolean;
  local?: string;
  valor?: string;
  /** Músico: registrar a equipe a pagar em cada compromisso (cachê − equipe = lucro). */
  equipe?: { rotulo: string; item: string };
  status: Status[];
  /** Mensagem pronta do WhatsApp. Sem ela, não aparece o botão. */
  mensagem?: (c: Compromisso, tipo: Tipo, quando: string) => string;
};

const OUTRO: Tipo = { id: "outro", nome: "Outro", cor: "manga", duracao: 60 };

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
      { id: "show", nome: "Show", cor: "uva", duracao: 180 },
      { id: "casamento", nome: "Casamento", cor: "chiclete", duracao: 240 },
      { id: "corporativo", nome: "Evento corporativo", cor: "mirtilo", duracao: 180 },
      { id: "festa", nome: "Festa particular", cor: "tangerina", duracao: 240 },
      { id: "ensaio", nome: "Ensaio", cor: "menta", duracao: 120 },
      { id: "aula", nome: "Aula", cor: "manga", duracao: 60 },
      { id: "gravacao", nome: "Gravação", cor: "morango", duracao: 240 },
      { id: "outro", nome: "Outro", cor: "kiwi", duracao: 60 },
    ],
    titulo: { rotulo: "Nome do evento", exemplo: "Ex.: Show no Bar do Zé" },
    cliente: "Contratante",
    telefone: true,
    local: "Local",
    valor: "Cachê (R$)",
    equipe: { rotulo: "Equipe a pagar", item: "Músico" },
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
    descricao: "Cílios, sobrancelhas, unhas, cabelo…",
    gradiente: "linear-gradient(135deg, #ff5ca8, #ffc145)",
    acento: ["#ff5ca8", "#ffc145"],
    ramos: RAMOS_ESTETICA,
    tipos: [...RAMOS_ESTETICA.flatMap((r) => r.servicos), OUTRO],
    todosTipos: [...RAMOS_ESTETICA.flatMap((r) => r.servicos), ...SERVICOS_ANTIGOS, OUTRO],
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

export const tipoDe = (cat: Categoria, id: string): Tipo => {
  const lista = cat.todosTipos ?? cat.tipos;
  return lista.find((t) => t.id === id) ?? lista[lista.length - 1];
};

/** Ramo a que um serviço pertence (Estética). */
export const ramoDoTipo = (cat: Categoria, tipoId: string) => cat.ramos?.find((r) => r.servicos.some((s) => s.id === tipoId));

/**
 * A agenda como a pessoa vê: com ramos, só os ramos (e serviços) que ela escolheu.
 * Sem escolha ainda, mostra todos.
 */
export function agendaDoUsuario(cat: Categoria, ramosEscolhidos: string[] = []): Categoria {
  if (!cat.ramos) return cat;
  const ramos = cat.ramos.filter((r) => ramosEscolhidos.includes(r.id));
  const usar = ramos.length ? ramos : cat.ramos;
  return { ...cat, ramos: usar, tipos: [...usar.flatMap((r) => r.servicos), OUTRO], todosTipos: cat.todosTipos };
}
