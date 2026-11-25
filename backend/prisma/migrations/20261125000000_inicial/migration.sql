-- Agenda: estrutura inicial do banco (aplicada com `npm run db:migrate`).
-- Cada pessoa tem a sua conta e só vê os próprios compromissos.

-- ─── Tabela ───────────────────────────────────────────────────────────────

create table public.compromissos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  categoria     text not null check (categoria in ('trabalho', 'musico', 'estetica')),
  tipo          text not null,
  titulo        text not null check (length(trim(titulo)) > 0),
  inicio        timestamptz(6) not null,
  fim           timestamptz(6) not null,
  dia_inteiro   boolean not null default false,
  cliente       text,
  telefone      text check (telefone is null or telefone ~ '^[0-9]+$'),
  local         text,
  valor         numeric(10, 2) check (valor is null or valor >= 0),
  status        text not null default 'marcado'
                check (status in ('marcado', 'confirmado', 'pago', 'feito', 'cancelado')),
  observacao    text,
  serie_id      uuid,
  criado_em     timestamptz(6) not null default now(),
  atualizado_em timestamptz(6) not null default now(),
  constraint fim_depois_do_inicio check (fim > inicio)
);

create index "compromissos_user_id_categoria_inicio_idx" on public.compromissos (user_id, categoria, inicio);
create index "compromissos_serie_id_idx" on public.compromissos (serie_id);

-- ─── atualizado_em automático (também para mudanças feitas fora do Prisma) ─

create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger compromissos_atualizado_em
  before update on public.compromissos
  for each row execute function public.tocar_atualizado_em();

-- ─── Segurança (RLS) ──────────────────────────────────────────────────────
-- O backend (Prisma) entra como administrador e filtra pelo user_id em toda consulta.
-- Pela chave pública (o site), cada um só pode LER o que é seu: é o que o tempo real usa.
-- Criar, editar e excluir só pela API, que valida os dados.

alter table public.compromissos enable row level security;

create policy "dono lê" on public.compromissos for select to authenticated using ((select auth.uid()) = user_id);

-- A tabela de controle do Prisma fica no schema public: fecha para a API pública.
alter table public._prisma_migrations enable row level security;

-- ─── Tempo real (celular e computador sincronizados) ──────────────────────

alter publication supabase_realtime add table public.compromissos;
