import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// Lê o .env no computador; no Render as variáveis já vêm do painel.
if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Migrações usam a conexão "session" (porta 5432).
  datasource: { url: process.env.DIRECT_URL ?? "" },
});
