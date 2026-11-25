# Agenda

Agenda com cara de app (visual neutro, estilo fintech), feita para o celular. Cada pessoa cria a sua conta e escolhe a agenda uma vez:

| Agenda | Tipos (cada um com sua cor) | Campos extras |
| --- | --- | --- |
| 💼 Trabalho | Reunião, Tarefa, Prazo, Visita, Outro | Com quem, Local ou link |
| 🎸 Músico | Show, Ensaio, Aula, Gravação, Outro | Contratante, WhatsApp, Local, Cachê |
| 💅 Estética | Cabelo, Unhas, Sobrancelha, Maquiagem, Pele, Outro | WhatsApp, Valor |

## Como as peças se conectam

```
 celular / computador
        │
        ▼
 ┌──────────────┐   dados (com o token de login)   ┌──────────────┐
 │  frontend    │ ───────────────────────────────▶ │   backend    │
 │  Next.js     │                                  │ Express +    │
 │  (Vercel)    │                                  │ Prisma       │
 │              │                                  │ (Render)     │
 └──────┬───────┘                                  └──────┬───────┘
        │ login + aviso de mudanças em tempo real         │ consultas (Prisma)
        ▼                                                 ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │  Supabase: contas (Auth), banco Postgres, tempo real            │
 └─────────────────────────────────────────────────────────────────┘
```

```
agenda/
├── render.yaml          → configuração do backend no Render
├── backend/             → API (Express + Prisma)
│   ├── prisma/               modelo do banco + migrações (tabela, segurança, tempo real)
│   └── src/                  rotas, login, validação
└── frontend/            → site (Next.js), vai para a Vercel
    ├── src/app/              telas: login, /comecar (escolha única da agenda), / (o app)
    ├── src/components/       Início, Agenda, Lista, Perfil, formulário, busca, resumo
    └── src/lib/categorias.ts as 3 agendas: tipos, cores, campos, mensagens
```

---

## Publicar (Render + Vercel)

Faça na ordem. Tempo total: uns 15 minutos.

### 1. Supabase: pegar a senha do banco

**Project Settings → Database → Database password**. Se não lembrar, clique em **Reset database password** e guarde a nova.

Se a senha tiver caracteres especiais (`@ # / ? % :`), troque-os na URL: `@`→`%40`, `#`→`%23`, `/`→`%2F`, `?`→`%3F`, `%`→`%25`, `:`→`%3A`.

### 2. Render: backend

1. [dashboard.render.com](https://dashboard.render.com) → **New → Blueprint** → escolha o repositório `agenda`.
2. Ele lê o `render.yaml` e cria o **agenda-backend**. Preencha:

   | Variável | Valor |
   | --- | --- |
   | `DATABASE_URL` | `postgresql://postgres.SEU-PROJETO:SENHA@aws-0-sa-east-1.pooler.supabase.com:6543/postgres` |
   | `DIRECT_URL` | `postgresql://postgres.SEU-PROJETO:SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres` |
   | `SUPABASE_URL` | `https://SEU-PROJETO.supabase.co` |
   | `SUPABASE_PUBLISHABLE_KEY` | a chave `sb_publishable_…` |
   | `FRONTEND_URL` | deixe `http://localhost:3000` por enquanto (você troca no passo 4) |

   `SEU-PROJETO` é o código do projeto (o mesmo que aparece na URL do Supabase). Os valores certos para você já estão no `backend/.env` do seu computador: é só copiar de lá.
3. **Apply**. No build, o Render instala tudo e **cria as tabelas no banco sozinho** (`prisma migrate deploy`).
4. Quando ficar verde, abra `https://agenda-backend-XXXX.onrender.com/saude`. Tem que aparecer `{"ok":true}`. **Copie esse endereço** (sem o `/saude`).

### 3. Vercel: site

1. [vercel.com/new](https://vercel.com/new) → importe o repositório `agenda`.
2. **Root Directory**: clique em *Edit* e escolha **`frontend`**. O resto a Vercel detecta sozinha.
3. **Environment Variables**:

   | Variável | Valor |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://SEU-PROJETO.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | a chave `sb_publishable_…` |
   | `NEXT_PUBLIC_API_URL` | o endereço do backend do passo 2 (ex.: `https://agenda-backend-XXXX.onrender.com`) |

4. **Deploy**. Copie o endereço do site (ex.: `https://agenda-xxxx.vercel.app`).

### 4. Ligar uma ponta na outra

1. **Render** → agenda-backend → **Environment** → `FRONTEND_URL` = o endereço do site na Vercel (sem `/` no fim) → **Save** (ele reinicia sozinho).
2. **Supabase** → **Authentication → URL Configuration**:
   - **Site URL**: o endereço do site na Vercel.
   - **Redirect URLs**: adicione o mesmo endereço com `/**` no fim.
3. **Supabase** → **Authentication → Sign In / Providers → Email**:
   - **Allow new users to sign up**: ligado (é assim que as pessoas criam conta).
   - **Confirm email**: ligado = precisa clicar no link do e-mail antes de entrar; desligado = entra direto.

Pronto: abra o site, crie sua conta e use.

### 5. Instalar no celular

- **iPhone:** abra o site no **Safari** → **Compartilhar** → **Adicionar à Tela de Início**.
- **Android:** Chrome → menu ⋮ → **Instalar app**.

> **Plano grátis do Render:** o backend "dorme" depois de 15 minutos sem uso e leva cerca de 1 minuto para acordar. O site já manda um sinal para acordá-lo assim que abre, mas o primeiro carregamento do dia pode demorar. Para uso diário sem espera, troque `plan: free` por `plan: starter` no `render.yaml` (pago).

**Atualizar depois:** faça `git push`. A Vercel e o Render publicam sozinhos, e o Render aplica as migrações novas do banco.

---

## O que a agenda faz

| Onde | O quê |
| --- | --- |
| **Primeiro acesso** | a pessoa escolhe a agenda (Trabalho, Músico ou Estética) **uma vez**; depois o app já abre nela. Trocar só pelo **Perfil** |
| **Início** | painel: a receber no mês (ou concluídos), próximo compromisso com contagem regressiva, números da semana, gráfico e o dia de hoje |
| **Agenda** (Dia · Mês) e **Lista** | o dia com a linha "agora", o calendário do mês e tudo o que vem pela frente |
| **+ Marcar** | tipo, nome, Hoje/Amanhã, 30 min/1h/2h… e **Repetir** (toda semana, a cada 2 semanas, todo mês) |
| 🔍 | busca por nome, cliente, local ou observação |
| 📊 | resumo do mês: recebido, a receber, cancelados e total por tipo |
| Detalhe do compromisso | status com um toque, WhatsApp pronto, **lembrete** (Google Agenda ou calendário do iPhone, avisa 1 hora antes), editar, duplicar, excluir (só este ou os próximos, se for repetido) |
| Clientes | ao digitar um nome já usado, o WhatsApp é preenchido sozinho |

Dicas:
- Toque na **etiqueta de status** de um compromisso para avançar (ex.: marcado → confirmado → pago).
- **Deslize para os lados** para trocar de dia (ou de mês).
- O aviso de **conflito de horário** olha as três agendas: um show não pode bater com uma cliente.
- Se o fim for antes do início (ex.: 22:00 até 02:00), o compromisso termina no dia seguinte.

---

## Rodar no computador

```bash
# Terminal 1: backend (http://localhost:4000)
cd backend
npm install
npm run db:migrate   # cria/atualiza as tabelas (precisa da senha no backend/.env)
npm run dev
```

```bash
# Terminal 2: site (http://localhost:3000)
cd frontend
npm install
npm run dev
```

Configuração: `backend/.env` e `frontend/.env.local` (modelos em `.env.example`). Esses arquivos não vão para o git.

## Mudar as agendas

Os tipos, cores, campos e mensagens do WhatsApp de cada agenda ficam em `frontend/src/lib/categorias.ts`. Se criar ou renomear um **tipo**, atualize também `backend/src/categorias.ts` (o backend recusa tipos que não conhece). Para uma **agenda nova**, mude também o `check (categoria in (...))` no banco, com uma migração nova.

## Mudar o banco (Prisma)

1. Edite `backend/prisma/schema.prisma`.
2. Crie a pasta `backend/prisma/migrations/AAAAMMDDHHMMSS_nome/` e gere o SQL da mudança:
   `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script > prisma/migrations/AAAAMMDDHHMMSS_nome/migration.sql`
3. Aplique com `npm run db:migrate` (no Render isso roda sozinho a cada deploy).

Use sempre `db:migrate` (`prisma migrate deploy`), nunca `prisma migrate dev`: a migração inicial tem regras do Supabase (RLS, tempo real, `auth.users`) que o Prisma não conhece, e o `migrate dev` tentaria apagar o banco.

**Conexão verificada (opcional):** baixe o certificado em *Supabase → Project Settings → Database → SSL Configuration* e salve como `backend/prisma/supabase-ca.crt`. Com ele, o backend verifica o servidor do banco ao conectar.
