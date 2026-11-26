# Agenda: backend (API)

Node + Express + TypeScript + **Prisma** (Postgres do Supabase). Toda rota (menos `/saude`) exige `Authorization: Bearer <access_token do Supabase>`.
O token é conferido com o Supabase Auth; depois, toda consulta do Prisma filtra pelo `user_id` de quem está logado. O RLS do banco continua ligado para o acesso direto pela chave pública (o tempo real do site).

```bash
cp .env.example .env
npm install          # também gera o Prisma Client
npm run db:migrate   # aplica as migrações no banco
npm run dev        # recarrega sozinho ao salvar
npm run build && npm start   # produção (é o que o Render roda)
```

## Rotas

| Método | Rota | O que faz |
| --- | --- | --- |
| GET | `/saude` | Health check do Render: `{ "ok": true }` |
| GET | `/compromissos?categoria=musico&de=ISO&ate=ISO` | Compromissos que tocam o período |
| GET | `/compromissos/proximos?categoria=musico&limite=200` | Os que ainda vão acontecer (sem cancelados) |
| GET | `/compromissos/conflitos?inicio=ISO&fim=ISO&ignorar=ID` | O que bate com esse horário, em qualquer agenda |
| GET | `/resumo?de=ISO&ate=ISO` | Quantos compromissos cada agenda tem no período: `{ "trabalho": 1, "musico": 3, "estetica": 0 }` |
| GET | `/compromissos/busca?categoria=estetica&q=ana` | Busca por título, cliente, local ou observação (até 50) |
| GET | `/contatos?categoria=estetica` | Nomes já usados nesta agenda, com o WhatsApp mais recente |
| POST | `/compromissos` | Cria (o `user_id` vem do token). Com `ocorrencias: [{inicio, fim}, …]` cria uma repetição (2 a 60 vezes) com o mesmo `serie_id` |
| PATCH | `/compromissos/:id` | Edita só os campos enviados (a categoria não muda) |
| DELETE | `/compromissos/:id` | Exclui. Com `?serie=proximos`, exclui também as próximas vezes da repetição |

Campo `equipe` (Músico): `[{ "nome": "Baterista", "valor": 200, "pago": false }]` (até 30; lista vazia = `null`).

Datas em ISO 8601 com fuso, ex.: `2026-11-28T23:00:00.000Z`.
Erros voltam como `{ "erro": "mensagem em português" }`, com status 400 (dados inválidos), 401 (sem login), 404 ou 500.

## Arquivos

- `src/index.ts`: servidor, CORS (só libera o `FRONTEND_URL`) e tratamento de erros
- `src/auth.ts`: confere o token do Supabase e descobre quem é o usuário
- `src/db.ts`: o Prisma Client (conexão pelo pooler do Supabase)
- `src/rotas.ts`: as rotas acima
- `src/validacao.ts`: regras dos dados (zod), incluindo o tipo e o status válidos em cada agenda
- `src/categorias.ts`: os tipos e status permitidos em cada agenda
- `prisma/schema.prisma`: o modelo do banco
- `prisma/migrations/`: o SQL aplicado no banco (tabela, RLS, gatilho de `atualizado_em`, tempo real)
- `prisma.config.ts`: configuração do Prisma (usa o `DIRECT_URL` para migrar)
