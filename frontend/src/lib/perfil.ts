import type { CategoriaId } from "./categorias";

/**
 * Guarda a agenda escolhida na própria conta (user_metadata do Supabase)
 * e renova o login para o servidor já enxergar a escolha.
 */
export async function salvarCategoria(categoria: CategoriaId) {
  const { criarClienteNavegador } = await import("./supabase/client");
  const supabase = criarClienteNavegador();
  const { error } = await supabase.auth.updateUser({ data: { categoria } });
  if (error) throw new Error(error.message);
  await supabase.auth.refreshSession();
}

/** Sai da conta e apaga o que o app instalado guardou neste aparelho. */
export async function sair() {
  const { criarClienteNavegador } = await import("./supabase/client");
  await criarClienteNavegador().auth.signOut();
  if ("caches" in window) await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
}
