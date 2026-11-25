"use client";
// TEMPORÁRIO: só para medir. Apagar depois.
import AgendaApp from "@/components/AgendaApp";
import { hoje, paraISO, somarDias } from "@/lib/datas";

const h = hoje();
const b = { user_id: "u", dia_inteiro: false, observacao: null, criado_em: "", atualizado_em: "", serie_id: null, telefone: "11987654321" };
const linhas: [number, string, string, string, string, number | null, string][] = [
  [0, "09:00", "11:00", "ensaio", "Ensaio da banda", null, "feito"],
  [0, "21:30", "23:30", "show", "Show no Bar do Zé", 600, "confirmado"],
  [1, "15:00", "16:00", "aula", "Aula de violão", 120, "marcado"],
  [2, "14:00", "18:00", "gravacao", "Gravação do EP", 800, "marcado"],
  [-1, "20:00", "23:00", "show", "Casamento Ana & Léo", 1500, "pago"],
];
const MOCK = linhas.map(([d, i, f, tipo, titulo, valor, status], n) => ({
  ...b, id: String(n), categoria: "musico", tipo, titulo, inicio: paraISO(somarDias(h, d), i), fim: paraISO(somarDias(h, d), f), valor, status, local: null, cliente: null,
}));
if (typeof window !== "undefined" && !(window as any).__mock) {
  (window as any).__mock = true;
  const orig = window.fetch;
  window.fetch = async (i, init) => {
    const url = String(i instanceof Request ? i.url : i);
    if (url.includes(":4000/compromissos")) return new Response(JSON.stringify(MOCK), { headers: { "content-type": "application/json" } });
    return orig(i, init);
  };
}
export default function P() {
  return <AgendaApp categoria="musico" email="erick@exemplo.com" />;
}
