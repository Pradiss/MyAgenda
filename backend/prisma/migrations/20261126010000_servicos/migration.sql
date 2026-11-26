-- Estética: vários serviços no mesmo horário (ex.: cílios + sobrancelha + unha para a mesma cliente).
-- `tipo` continua sendo o primeiro serviço (cor e compatibilidade); `servicos` guarda todos, na ordem.
alter table public.compromissos add column servicos text[] not null default '{}';
