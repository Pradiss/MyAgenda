import { redirect } from "next/navigation";
import EscolherCategoria from "@/components/EscolherCategoria";
import { sessaoAtual } from "@/lib/sessao";

export default async function Comecar() {
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/login");
  if (sessao.cat) redirect("/"); // já escolheu: troca só pelo Perfil
  return <EscolherCategoria />;
}
