import type { Categoria } from "./categorias";
import { tipoDe } from "./categorias";
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
  return `https://wa.me/${numero}?text=${encodeURIComponent(cat.mensagem(c, tipoDe(cat, c.tipo), quando))}`;
}
