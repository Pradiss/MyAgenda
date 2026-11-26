import type { Categoria } from "./categorias";
import { nomeServicos } from "./compromissos";
import type { Compromisso } from "./tipos";

const utc = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");


function descricao(c: Compromisso, cat: Categoria) {
  return [
    `${cat.emoji} ${cat.nome} · ${nomeServicos(cat, c)}`,
    c.cliente && `${cat.cliente ?? "Contato"}: ${c.cliente}`,
    c.telefone && `WhatsApp: ${c.telefone}`,
    c.observacao,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Link que abre o Google Agenda já preenchido (o Google avisa antes, como nos outros eventos). */
export function linkGoogleAgenda(c: Compromisso, cat: Categoria): string {
  // Dia inteiro: o fim no Google é o dia seguinte (exclusivo), igual ao que guardamos.
  const datas = c.dia_inteiro
    ? `${dataPuraSP(c.inicio)}/${dataPuraSP(c.fim)}`
    : `${utc(c.inicio)}/${utc(c.fim)}`;
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: c.titulo,
    dates: datas,
    details: descricao(c, cat),
    ctz: "America/Sao_Paulo",
  });
  if (c.local) p.set("location", c.local);
  return `https://calendar.google.com/calendar/render?${p}`;
}

const escapar = (t: string) => t.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (m) => `\\${m}`);

/** Arquivo .ics com aviso 1 hora antes (ou às 9h do dia, se for dia inteiro). Abre no calendário do iPhone. */
export function baixarICS(c: Compromisso, cat: Categoria) {
  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Agenda//PT-BR",
    "BEGIN:VEVENT",
    `UID:${c.id}@agenda`,
    `DTSTAMP:${utc(new Date().toISOString())}`,
    c.dia_inteiro ? `DTSTART;VALUE=DATE:${dataPuraSP(c.inicio)}` : `DTSTART:${utc(c.inicio)}`,
    c.dia_inteiro ? `DTEND;VALUE=DATE:${dataPuraSP(c.fim)}` : `DTEND:${utc(c.fim)}`,
    `SUMMARY:${escapar(c.titulo)}`,
    `DESCRIPTION:${escapar(descricao(c, cat))}`,
    ...(c.local ? [`LOCATION:${escapar(c.local)}`] : []),
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapar(c.titulo)}`,
    c.dia_inteiro ? "TRIGGER:PT9H" : "TRIGGER:-PT1H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const arquivo = new Blob([linhas.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(arquivo);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${c.titulo.replace(/[^\p{L}\p{N} ]/gu, "").trim() || "compromisso"}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Data (yyyyMMdd) no fuso de São Paulo: o dia inteiro começa à meia-noite daqui, não de Londres. */
function dataPuraSP(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(iso)).replace(/-/g, "");
}
