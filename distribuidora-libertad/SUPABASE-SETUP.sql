-- =====================================================================
-- Distribuidora Libertad · esquema Supabase
-- Correr una sola vez en el SQL Editor del proyecto (es idempotente:
-- se puede volver a correr sin perder datos).
--
-- Seguridad: solo los usuarios cargados en public.admins pueden editar.
-- Un usuario que se registre por su cuenta NO tiene acceso al tablero.
-- =====================================================================

-- ---------- administradores del tablero ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
-- sin políticas: nadie la lee ni la escribe desde la web; se maneja desde el SQL Editor.

create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;
revoke all on function public.es_admin() from public;
grant execute on function public.es_admin() to anon, authenticated;

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
  for select to anon, authenticated using (activo = true);
drop policy if exists "productos admin" on public.productos;
create policy "productos admin" on public.productos
  for all to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));

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
  for all to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));

drop trigger if exists ajustes_updated on public.ajustes;
create trigger ajustes_updated before update on public.ajustes
  for each row execute function public.tocar_updated_at();

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
create index if not exists pedidos_created_idx on public.pedidos (created_at desc);
alter table public.pedidos enable row level security;
drop policy if exists "pedidos alta publica" on public.pedidos;
create policy "pedidos alta publica" on public.pedidos
  for insert to anon, authenticated
  with check (
    estado = 'nuevo'
    and length(cliente) between 1 and 120
    and coalesce(length(negocio), 0) <= 120
    and coalesce(length(localidad), 0) <= 120
    and coalesce(length(telefono), 0) <= 40
    and coalesce(length(nota), 0) <= 1000
    and jsonb_typeof(items) = 'array'
    and jsonb_array_length(items) between 1 and 400
    and pg_column_size(items) <= 200000
    and coalesce(total, 0) >= 0
    and coalesce(unidades, 0) between 0 and 1000000
  );
drop policy if exists "pedidos admin lectura" on public.pedidos;
create policy "pedidos admin lectura" on public.pedidos
  for select to authenticated using ((select public.es_admin()));
drop policy if exists "pedidos admin cambios" on public.pedidos;
create policy "pedidos admin cambios" on public.pedidos
  for update to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));
drop policy if exists "pedidos admin baja" on public.pedidos;
create policy "pedidos admin baja" on public.pedidos
  for delete to authenticated using ((select public.es_admin()));

-- ---------- fotos (Storage): públicas para ver, solo admin sube ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 5242880, array['image/webp','image/jpeg','image/png'])
on conflict (id) do update
  set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "fotos admin lectura" on storage.objects;
create policy "fotos admin lectura" on storage.objects
  for select to authenticated using (bucket_id = 'fotos' and (select public.es_admin()));
drop policy if exists "fotos admin alta" on storage.objects;
create policy "fotos admin alta" on storage.objects
  for insert to authenticated with check (bucket_id = 'fotos' and (select public.es_admin()));
drop policy if exists "fotos admin cambios" on storage.objects;
create policy "fotos admin cambios" on storage.objects
  for update to authenticated using (bucket_id = 'fotos' and (select public.es_admin()));
drop policy if exists "fotos admin baja" on storage.objects;
create policy "fotos admin baja" on storage.objects
  for delete to authenticated using (bucket_id = 'fotos' and (select public.es_admin()));

-- =====================================================================
-- DESPUÉS de crear el usuario del cliente
-- (Authentication > Users > Add user, con email + contraseña),
-- correr esta línea para darle acceso al Tablero. Suma como admin a
-- todos los usuarios que existan en ese momento.
-- =====================================================================
insert into public.admins (user_id, email)
select id, email from auth.users
on conflict (user_id) do nothing;
