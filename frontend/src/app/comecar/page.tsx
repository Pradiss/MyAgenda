import { redirect } from "next/navigation";
import EscolherCategoria from "@/components/EscolherCategoria";
import { sessaoAtual } from "@/lib/sessao";

export default async function Comecar() {
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/login");
  const faltaRamos = Boolean(sessao.cat?.ramos && sessao.ramos.length === 0);
  if (sessao.cat && !faltaRamos) redirect("/"); // já escolheu: troca só pelo Perfil
  // Já escolheu a Estética mas ainda não os ramos: abre direto no 2º passo.
  return <EscolherCategoria inicial={faltaRamos ? sessao.cat!.id : null} />;
}
