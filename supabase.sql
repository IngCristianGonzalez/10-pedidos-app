-- Gigi Papas — Supabase schema inicial (Render + Supabase)
-- Ejecutar en Supabase SQL Editor
create extension if not exists "uuid-ossp";

create table if not exists mesas (
  id text primary key,
  numero text unique not null,
  estado text not null check (estado in ('disponible','ocupada','reservada')),
  capacidad int not null,
  pedido_activo_ids jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);
create table if not exists productos (
  id text primary key,
  nombre text not null,
  descripcion text not null,
  precio int not null,
  categoria text not null,
  imagen text not null,
  disponible boolean not null default true,
  created_at timestamptz default now()
);
create table if not exists pedidos (
  id text primary key,
  mesa text not null,
  mesa_id text references mesas(id),
  items jsonb not null,
  estado text not null,
  total int not null,
  notas text,
  medio_pago text,
  creado_por text,
  es_qr boolean default false,
  ticket_cocina_id text,
  factura_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists tickets_cocina (
  id text primary key,
  pedido_id text not null references pedidos(id) on delete cascade,
  mesa_id text references mesas(id),
  numero_mesa text not null,
  items jsonb not null,
  notas text,
  impreso_en timestamptz,
  reimpresiones int default 0,
  created_at timestamptz default now()
);
create table if not exists facturas (
  id text primary key,
  consecutivo text unique not null,
  pedido_id text not null references pedidos(id),
  mesa_id text references mesas(id),
  numero_mesa text not null,
  items jsonb not null,
  subtotal int not null,
  iva_incluido int not null,
  total int not null,
  medio_pago text,
  created_at timestamptz default now(),
  impreso boolean default false
);

-- RLS off para MVP (luego activar)
alter table mesas disable row level security;
alter table productos disable row level security;
alter table pedidos disable row level security;
alter table tickets_cocina disable row level security;
alter table facturas disable row level security;

-- Seed mesas 1-3
insert into mesas (id, numero, estado, capacidad) values
('m1','1','disponible',4),
('m2','2','disponible',4),
('m3','3','disponible',6)
on conflict (id) do nothing;
