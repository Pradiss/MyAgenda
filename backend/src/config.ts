function obrigatoria(nome: string): string {
  const valor = process.env[nome];
  if (!valor) throw new Error(`Falta a variável de ambiente ${nome}. Veja o .env.example.`);
  return valor;
}

export const config = {
  porta: Number(process.env.PORT ?? 4000),
  /** Conexão do Prisma com o Postgres do Supabase (pooler "transaction", porta 6543). */
  databaseUrl: obrigatoria("DATABASE_URL"),
  /** Usados só para conferir o login (token) de quem chama a API. */
  supabaseUrl: obrigatoria("SUPABASE_URL"),
  supabaseChave: obrigatoria("SUPABASE_PUBLISHABLE_KEY"),
  origens: (process.env.FRONTEND_URL ?? "http://localhost:3000")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean),
};
