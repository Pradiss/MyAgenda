import { redirect } from "next/navigation";
import AgendaApp from "@/components/AgendaApp";
import { sessaoAtual } from "@/lib/sessao";

export default async function Inicio() {
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/login");
  if (!sessao.cat) redirect("/comecar"); // primeiro acesso: escolher a agenda
  if (sessao.cat.ramos && sessao.ramos.length === 0) redirect("/comecar"); // Estética: falta escolher os ramos
  return (
    <AgendaApp
      key={`${sessao.cat.id}-${sessao.ramos.join(",")}`}
      categoria={sessao.cat.id}
      ramos={sessao.ramos}
      tema={sessao.tema}
      email={sessao.email}
      token={sessao.token}
    />
  );
}
