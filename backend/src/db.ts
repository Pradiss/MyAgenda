import { existsSync, readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Compromisso } from "./generated/prisma/client.js";
import { config } from "./config.js";

// `pgbouncer=true` era um parâmetro do Prisma antigo; o driver pg não usa.
const url = new URL(config.databaseUrl);
url.searchParams.delete("pgbouncer");

// Opcional, recomendado: o certificado do Supabase (Project Settings > Database > SSL Configuration
// > Download certificate) salvo em backend/prisma/supabase-ca.crt. Com ele, a conexão é
// criptografada e o servidor é verificado.
const caminhoCA = new URL("../prisma/supabase-ca.crt", import.meta.url);
const ssl = existsSync(caminhoCA) ? { ca: readFileSync(caminhoCA, "utf8") } : undefined;
if (ssl) url.searchParams.delete("sslmode");

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url.toString(), ssl, max: 5 }),
});

/** Formato que a API devolve: `valor` como número (o Prisma usa Decimal). */
export const paraJson = (c: Compromisso) => ({ ...c, valor: c.valor == null ? null : Number(c.valor) });
