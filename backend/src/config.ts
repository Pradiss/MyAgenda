function obrigatoria(nome: string): string {
  const valor = process.env[nome];
  if (!valor) throw new Error(`Falta a variável de ambiente ${nome}. Veja o .env.example.`);
  return valor;
}

// Senha de exemplo esquecida no .env: cada pedido falharia no login do banco, e depois de
// várias falhas o Supabase bloqueia as conexões por alguns minutos (ECIRCUITBREAKER).
for (const nome of ["DATABASE_URL", "DIRECT_URL"]) {
  if (/:SENHA@|\[YOUR-PASSWORD\]/.test(process.env[nome] ?? "")) {
    throw new Error(
      `${nome} ainda está com a senha de exemplo. Troque "SENHA" pela senha do banco ` +
        `(Supabase > Project Settings > Database) no backend/.env e rode de novo.`,
    );
  }
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
