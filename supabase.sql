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

-- Config compartida del negocio (datos transferencia + QR visibles para todos)
create table if not exists negocio_config (
  id text primary key,
  titular text not null default 'Gigi Papas',
  nequi text not null default '3023860980',
  bancolombia text not null default '',
  mensaje text not null default '',
  qr_image text not null default '',
  updated_at timestamptz default now()
);
insert into negocio_config (id) values ('gigi') on conflict (id) do nothing;

-- Bucket público para el QR de Nequi (la subida la hace el servidor con service_role)
insert into storage.buckets (id, name, public)
values ('negocio', 'negocio', true)
on conflict (id) do update set public = true;
drop policy if exists "negocio lectura publica" on storage.objects;
create policy "negocio lectura publica" on storage.objects
  for select using (bucket_id = 'negocio');
drop policy if exists "negocio subida anon" on storage.objects;
drop policy if exists "negocio actualiza anon" on storage.objects;

-- ===== RLS: la app escribe SOLO vía /api (service_role, valida transiciones).
-- La key anónima del frontend solo tiene permiso de LECTURA. =====
alter table mesas enable row level security;
alter table productos enable row level security;
alter table pedidos enable row level security;
alter table tickets_cocina enable row level security;
alter table facturas enable row level security;
alter table negocio_config enable row level security;
alter table negocio_horario enable row level security;

drop policy if exists "lectura anonima" on mesas;
create policy "lectura anonima" on mesas for select to anon using (true);
drop policy if exists "lectura anonima" on productos;
create policy "lectura anonima" on productos for select to anon using (true);
drop policy if exists "lectura anonima" on pedidos;
create policy "lectura anonima" on pedidos for select to anon using (true);
drop policy if exists "lectura anonima" on tickets_cocina;
create policy "lectura anonima" on tickets_cocina for select to anon using (true);
drop policy if exists "lectura anonima" on facturas;
create policy "lectura anonima" on facturas for select to anon using (true);
drop policy if exists "lectura anonima" on negocio_config;
create policy "lectura anonima" on negocio_config for select to anon using (true);
drop policy if exists "lectura anonima" on negocio_horario;
create policy "lectura anonima" on negocio_horario for select to anon using (true);

-- Seed mesas 1-3
insert into mesas (id, numero, estado, capacidad) values
('m1','1','disponible',4),
('m2','2','disponible',4),
('m3','3','disponible',6)
on conflict (id) do nothing;

-- Seed productos (menú inicial; el admin los edita en Productos)
insert into productos (id, nombre, descripcion, precio, categoria, imagen, disponible, created_at) values
('p1','Papas Gigi Clásicas','Papas a la francesa crujientes por fuera, suaves por dentro. Porción familiar.',12000,'papas','https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',true,now()),
('p2','Salchipapa Gigi','Papas + salchicha premium + salsas de la casa + queso.',18000,'salchipapas','https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400',true,now()),
('p3','Hamburguesa Gigi Doble','Doble carne 150g, queso cheddar, tocineta, papas incluidas.',25000,'hamburguesas','https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?w=400',true,now()),
('p4','Perro Gigi Especial','Salchicha alemana, ripio, queso, papas chongo, salsas.',16000,'perros','https://images.unsplash.com/photo-1612392062126-0d6f0f3d8e83?w=400',true,now()),
('p5','Combo Familiar Gigi','2 hamburguesas + papas gigantes + 2 gaseosas 400ml.',48000,'combos','https://images.unsplash.com/photo-1550547660-d9450f859349?w=400',true,now()),
('p6','Gaseosa 400ml','Coca-Cola / Manzana / Naranja - fría.',4000,'bebidas','https://images.unsplash.com/photo-1624552184280-9e9631bbeee9?w=400',true,now()),
('p7','Papas con Queso y Tocineta','Papas cubiertas con queso cheddar fundido y tocineta crocante.',19000,'papas','https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400',false,now()),
('p8','Mazorquita Gigi','Maíz tierno, pollo, queso, papas, salsas - estilo desgranado.',22000,'otros','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',true,now())
on conflict (id) do nothing;

-- Horario compartido del negocio (lo edita el admin en Cuenta, lo ven todos los dispositivos)
create table if not exists negocio_horario (
  id text primary key,
  horarios jsonb not null,
  cerrado_temporal boolean not null default false,
  mensaje_cerrado text not null default '',
  updated_at timestamptz default now()
);
insert into negocio_horario (id, horarios, cerrado_temporal, mensaje_cerrado)
values ('gigi',
  '[{"dia":0,"abre":"18:00","cierra":"23:00","activo":true},{"dia":1,"abre":"18:00","cierra":"23:00","activo":false},{"dia":2,"abre":"18:00","cierra":"23:00","activo":false},{"dia":3,"abre":"18:00","cierra":"23:00","activo":false},{"dia":4,"abre":"18:00","cierra":"23:00","activo":false},{"dia":5,"abre":"18:00","cierra":"22:30","activo":true},{"dia":6,"abre":"18:00","cierra":"23:00","activo":true}]'::jsonb,
  false, 'Estamos cerrados temporalmente. Vuelve pronto.')
on conflict (id) do nothing;
