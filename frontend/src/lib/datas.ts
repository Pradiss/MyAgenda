import { TZDate } from "@date-fns/tz";
import { addDays, addMonths, format, startOfMonth, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

export const TZ = "America/Sao_Paulo";

/** Um dia no calendário de São Paulo, no formato "yyyy-MM-dd". */
export type Dia = string;

export const emSP = (d: Date | string | number) => new TZDate(new Date(d).getTime(), TZ);

export const formatar = (d: Date | string, padrao: string) =>
  format(typeof d === "string" ? emSP(d) : d, padrao, { locale: ptBR });

export const hoje = (): Dia => format(TZDate.tz(TZ), "yyyy-MM-dd");
export const diaDe = (iso: string): Dia => format(emSP(iso), "yyyy-MM-dd");

export function inicioDoDia(dia: Dia): TZDate {
  const [a, m, d] = dia.split("-").map(Number);
  return new TZDate(a, m - 1, d, TZ);
}

export const somarDias = (dia: Dia, n: number): Dia =>
  format(addDays(inicioDoDia(dia), n), "yyyy-MM-dd");

export const inicioDaSemana = (dia: Dia): Dia =>
  format(startOfWeek(inicioDoDia(dia), { weekStartsOn: 0 }), "yyyy-MM-dd");

export const diasDaSemana = (dia: Dia): Dia[] => {
  const primeiro = inicioDaSemana(dia);
  return Array.from({ length: 7 }, (_, i) => somarDias(primeiro, i));
};

export const somarMeses = (dia: Dia, n: number): Dia =>
  format(addMonths(inicioDoDia(dia), n), "yyyy-MM-dd");

export const primeiroDoMes = (dia: Dia): Dia => format(startOfMonth(inicioDoDia(dia)), "yyyy-MM-dd");

/** As 6 semanas (42 dias) que aparecem no calendário do mês. */
export const gradeDoMes = (dia: Dia): Dia[] => {
  const primeiro = inicioDaSemana(primeiroDoMes(dia));
  return Array.from({ length: 42 }, (_, i) => somarDias(primeiro, i));
};

/** Junta dia + "HH:mm" (horário de São Paulo) e devolve ISO em UTC. */
export function paraISO(dia: Dia, hora: string): string {
  const [a, m, d] = dia.split("-").map(Number);
  const [h, min] = hora.split(":").map(Number);
  return new Date(new TZDate(a, m - 1, d, h, min, TZ).getTime()).toISOString();
}

export const isoDoDia = (dia: Dia) => new Date(inicioDoDia(dia).getTime()).toISOString();

export const hora = (iso: string) => formatar(iso, "HH:mm");

/** Minutos desde a meia-noite em São Paulo. */
export function minutosNoDia(iso: string): number {
  const d = emSP(iso);
  return d.getHours() * 60 + d.getMinutes();
}

export function rotuloDia(dia: Dia, padrao = "EEEE, d 'de' MMMM"): string {
  const h = hoje();
  if (dia === h) return "Hoje";
  if (dia === somarDias(h, 1)) return "Amanhã";
  if (dia === somarDias(h, -1)) return "Ontem";
  const texto = formatar(inicioDoDia(dia), padrao);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export const dinheiro = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
