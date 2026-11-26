import type { Categoria } from "./categorias";
import { tipoDe, type Tipo } from "./categorias";
import type { Compromisso } from "./tipos";
import { diaDe, formatar, hora, isoDoDia, somarDias, type Dia } from "./datas";

/** Compromissos que tocam o dia (inclui os que atravessam a meia-noite). */
export function doDia(lista: Compromisso[], dia: Dia): Compromisso[] {
  const ini = Date.parse(isoDoDia(dia));
  const fim = Date.parse(isoDoDia(somarDias(dia, 1)));
  return lista
    .filter((c) => Date.parse(c.inicio) < fim && Date.parse(c.fim) > ini)
    .sort((a, b) => Number(b.dia_inteiro) - Number(a.dia_inteiro) || a.inicio.localeCompare(b.inicio));
}

/** Ids dos serviços do compromisso (vários na Estética; senão, só o tipo). */
export const servicosDe = (c: Pick<Compromisso, "tipo" | "servicos">): string[] => (c.servicos?.length ? c.servicos : [c.tipo]);

/** Os tipos (com nome e cor) de cada serviço do compromisso. */
export const tiposDe = (cat: Categoria, c: Pick<Compromisso, "tipo" | "servicos">): Tipo[] => servicosDe(c).map((id) => tipoDe(cat, id));

/** "Volume russo + Henna" ou, com `max`, "Volume russo + Henna +1". */
export function nomeServicos(cat: Categoria, c: Pick<Compromisso, "tipo" | "servicos">, max = 99): string {
  const nomes = tiposDe(cat, c).map((t) => t.nome);
  return nomes.length > max ? `${nomes.slice(0, max).join(" + ")} +${nomes.length - max}` : nomes.join(" + ");
}

/** "A, B e C" (para frases, como a mensagem do WhatsApp). */
export const listaEmFrase = (nomes: string[]) =>
  nomes.length <= 1 ? (nomes[0] ?? "") : `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;

/** Quanto sai para a equipe (músicos) neste compromisso. */
export const custoEquipe = (c: Pick<Compromisso, "equipe">) => (c.equipe ?? []).reduce((t, m) => t + Number(m.valor || 0), 0);

/** Cachê − equipe. */
export const lucroDe = (c: Pick<Compromisso, "valor" | "equipe">) => Number(c.valor ?? 0) - custoEquipe(c);

export function aReceber(lista: Compromisso[]): number {
  return lista
    .filter((c) => c.valor != null && c.status !== "pago" && c.status !== "cancelado")
    .reduce((soma, c) => soma + Number(c.valor), 0);
}

export function faixaHorario(c: Pick<Compromisso, "inicio" | "fim" | "dia_inteiro">): string {
  if (c.dia_inteiro) return "Dia inteiro";
  const outroDia = diaDe(c.inicio) !== diaDe(c.fim) && hora(c.fim) !== "00:00";
  return `${hora(c.inicio)} – ${hora(c.fim)}${outroDia ? " (+1)" : ""}`;
}

/** Link do WhatsApp com a mensagem de confirmação da agenda. */
export function linkWhatsApp(c: Compromisso, cat: Categoria): string | null {
  const numeros = (c.telefone ?? "").replace(/\D/g, "");
  if (!cat.mensagem || numeros.length < 10) return null;
  const numero = numeros.startsWith("55") && numeros.length >= 12 ? numeros : `55${numeros}`;
  const dia = formatar(c.inicio, "EEEE, d 'de' MMMM");
  const quando = c.dia_inteiro ? dia : `${dia}, às ${hora(c.inicio)}`;
  const tipo = { ...tipoDe(cat, c.tipo), nome: listaEmFrase(tiposDe(cat, c).map((t) => t.nome)) };
  return `https://wa.me/${numero}?text=${encodeURIComponent(cat.mensagem(c, tipo, quando))}`;
}
