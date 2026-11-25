import { redirect } from "next/navigation";
import AgendaApp from "@/components/AgendaApp";
import { sessaoAtual } from "@/lib/sessao";

export default async function Inicio() {
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/login");
  if (!sessao.cat) redirect("/comecar"); // primeiro acesso: escolher a agenda
  return <AgendaApp key={sessao.cat.id} categoria={sessao.cat.id} email={sessao.email} />;
}
