-- =====================================================================
-- Distribuidora Libertad · esquema Supabase
-- Correr una sola vez en el SQL Editor del proyecto (es idempotente).
-- =====================================================================

-- ---------- productos ----------
create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  art text not null unique,
  nombre text not null,
  precio numeric(14,2),
  categoria text not null default 'general',
  foto_url text,
  activo boolean not null default true,
  destacado boolean not null default false,
  orden integer,
  nota text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists productos_categoria_idx on public.productos (categoria);
create index if not exists productos_nombre_idx on public.productos (nombre);

create or replace function public.tocar_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists productos_updated on public.productos;
create trigger productos_updated before update on public.productos
  for each row execute function public.tocar_updated_at();

alter table public.productos enable row level security;
drop policy if exists "productos lectura publica" on public.productos;
create policy "productos lectura publica" on public.productos
  for select to anon using (activo = true);
drop policy if exists "productos admin" on public.productos;
create policy "productos admin" on public.productos
  for all to authenticated using (true) with check (true);

-- ---------- ajustes del sitio (clave / valor) ----------
create table if not exists public.ajustes (
  clave text primary key,
  valor text,
  updated_at timestamptz not null default now()
);
alter table public.ajustes enable row level security;
drop policy if exists "ajustes lectura publica" on public.ajustes;
create policy "ajustes lectura publica" on public.ajustes
  for select to anon, authenticated using (true);
drop policy if exists "ajustes admin" on public.ajustes;
create policy "ajustes admin" on public.ajustes
  for all to authenticated using (true) with check (true);

-- ---------- pedidos que llegan desde la web ----------
create table if not exists public.pedidos (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  cliente text not null,
  negocio text,
  localidad text,
  telefono text,
  nota text,
  items jsonb not null,
  total numeric(14,2),
  unidades integer,
  estado text not null default 'nuevo'
    check (estado in ('nuevo','confirmado','entregado','cancelado'))
);
alter table public.pedidos enable row level security;
drop policy if exists "pedidos alta publica" on public.pedidos;
create policy "pedidos alta publica" on public.pedidos
  for insert to anon, authenticated
  with check (
    estado = 'nuevo'
    and length(cliente) between 1 and 120
    and jsonb_typeof(items) = 'array'
    and jsonb_array_length(items) between 1 and 400
  );
drop policy if exists "pedidos admin lectura" on public.pedidos;
create policy "pedidos admin lectura" on public.pedidos
  for select to authenticated using (true);
drop policy if exists "pedidos admin cambios" on public.pedidos;
create policy "pedidos admin cambios" on public.pedidos
  for update to authenticated using (true) with check (true);
drop policy if exists "pedidos admin baja" on public.pedidos;
create policy "pedidos admin baja" on public.pedidos
  for delete to authenticated using (true);

-- ---------- fotos (Storage) ----------
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

drop policy if exists "fotos admin alta" on storage.objects;
create policy "fotos admin alta" on storage.objects
  for insert to authenticated with check (bucket_id = 'fotos');
drop policy if exists "fotos admin cambios" on storage.objects;
create policy "fotos admin cambios" on storage.objects
  for update to authenticated using (bucket_id = 'fotos');
drop policy if exists "fotos admin baja" on storage.objects;
create policy "fotos admin baja" on storage.objects
  for delete to authenticated using (bucket_id = 'fotos');

-- Después: Authentication > Users > Add user (email + contraseña) para entrar al Tablero.
