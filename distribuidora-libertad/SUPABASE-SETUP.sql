-- =====================================================================
-- Distribuidora Libertad · esquema Supabase
-- Vive en el proyecto compartido "clientes" (gbdqxpatunbgegywtlkd), junto
-- con otras webs. Por eso todo lo de Libertad lleva prefijo lib_ y el
-- bucket de fotos se llama lib-fotos.
-- Es idempotente: se puede volver a correr sin perder datos.
--
-- Seguridad: cada usuario edita solo los sitios que tiene cargados en
-- public.panel_accesos. Un usuario de otra web no puede tocar Libertad.
-- =====================================================================

-- ---------- accesos al panel (compartido entre todas las webs) ----------
create table if not exists public.panel_accesos (
  user_id uuid not null references auth.users (id) on delete cascade,
  sitio text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, sitio)
);
alter table public.panel_accesos enable row level security;
-- sin políticas: se maneja desde el SQL Editor.

create or replace function public.puede_editar(p_sitio text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.panel_accesos a
                 where a.user_id = auth.uid() and a.sitio = p_sitio);
$$;
revoke all on function public.puede_editar(text) from public;
grant execute on function public.puede_editar(text) to anon, authenticated;

create or replace function public.lib_es_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.puede_editar('libertad');
$$;
revoke all on function public.lib_es_admin() from public;
grant execute on function public.lib_es_admin() to anon, authenticated;

-- ---------- productos ----------
create table if not exists public.lib_productos (
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
create index if not exists lib_productos_categoria_idx on public.lib_productos (categoria);
create index if not exists lib_productos_nombre_idx on public.lib_productos (nombre);

create or replace function public.lib_tocar_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists lib_productos_updated on public.lib_productos;
create trigger lib_productos_updated before update on public.lib_productos
  for each row execute function public.lib_tocar_updated_at();

alter table public.lib_productos enable row level security;
drop policy if exists "lib productos lectura publica" on public.lib_productos;
create policy "lib productos lectura publica" on public.lib_productos
  for select to anon, authenticated using (activo = true);
drop policy if exists "lib productos admin" on public.lib_productos;
create policy "lib productos admin" on public.lib_productos
  for all to authenticated
  using ((select public.lib_es_admin())) with check ((select public.lib_es_admin()));

-- ---------- ajustes del sitio (clave / valor) ----------
create table if not exists public.lib_ajustes (
  clave text primary key,
  valor text,
  updated_at timestamptz not null default now()
);
alter table public.lib_ajustes enable row level security;
drop policy if exists "lib ajustes lectura publica" on public.lib_ajustes;
create policy "lib ajustes lectura publica" on public.lib_ajustes
  for select to anon, authenticated using (true);
drop policy if exists "lib ajustes admin" on public.lib_ajustes;
create policy "lib ajustes admin" on public.lib_ajustes
  for all to authenticated
  using ((select public.lib_es_admin())) with check ((select public.lib_es_admin()));

drop trigger if exists lib_ajustes_updated on public.lib_ajustes;
create trigger lib_ajustes_updated before update on public.lib_ajustes
  for each row execute function public.lib_tocar_updated_at();

-- ---------- pedidos que llegan desde la web ----------
create table if not exists public.lib_pedidos (
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
create index if not exists lib_pedidos_created_idx on public.lib_pedidos (created_at desc);
alter table public.lib_pedidos enable row level security;
drop policy if exists "lib pedidos alta publica" on public.lib_pedidos;
create policy "lib pedidos alta publica" on public.lib_pedidos
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
drop policy if exists "lib pedidos admin lectura" on public.lib_pedidos;
create policy "lib pedidos admin lectura" on public.lib_pedidos
  for select to authenticated using ((select public.lib_es_admin()));
drop policy if exists "lib pedidos admin cambios" on public.lib_pedidos;
create policy "lib pedidos admin cambios" on public.lib_pedidos
  for update to authenticated
  using ((select public.lib_es_admin())) with check ((select public.lib_es_admin()));
drop policy if exists "lib pedidos admin baja" on public.lib_pedidos;
create policy "lib pedidos admin baja" on public.lib_pedidos
  for delete to authenticated using ((select public.lib_es_admin()));

-- ---------- fotos (Storage): públicas para ver, solo admin sube ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lib-fotos', 'lib-fotos', true, 5242880, array['image/webp','image/jpeg','image/png'])
on conflict (id) do update
  set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "lib fotos admin lectura" on storage.objects;
create policy "lib fotos admin lectura" on storage.objects
  for select to authenticated using (bucket_id = 'lib-fotos' and (select public.lib_es_admin()));
drop policy if exists "lib fotos admin alta" on storage.objects;
create policy "lib fotos admin alta" on storage.objects
  for insert to authenticated with check (bucket_id = 'lib-fotos' and (select public.lib_es_admin()));
drop policy if exists "lib fotos admin cambios" on storage.objects;
create policy "lib fotos admin cambios" on storage.objects
  for update to authenticated using (bucket_id = 'lib-fotos' and (select public.lib_es_admin()));
drop policy if exists "lib fotos admin baja" on storage.objects;
create policy "lib fotos admin baja" on storage.objects
  for delete to authenticated using (bucket_id = 'lib-fotos' and (select public.lib_es_admin()));

-- =====================================================================
-- Dar acceso al Tablero de Libertad a un usuario (crearlo antes en
-- Authentication > Users > Add user):
--   insert into public.panel_accesos (user_id, sitio)
--   select id, 'libertad' from auth.users where email = 'EMAIL'
--   on conflict do nothing;
-- =====================================================================
