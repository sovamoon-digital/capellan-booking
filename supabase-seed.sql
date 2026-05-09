-- Run this in your Supabase SQL Editor to set up the database

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_hours int not null default 1,
  price int not null,
  icon text default '🔧',
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists availability (
  id uuid primary key default gen_random_uuid(),
  day_of_week text not null unique,
  is_open boolean default true,
  open_time text default '08:00',
  close_time text default '17:00'
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references services(id),
  service_name text,
  date date not null,
  time text not null,
  duration_hours int not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  car_make text,
  car_model text,
  car_year text,
  notes text,
  status text default 'confirmed',
  created_at timestamptz default now()
);

create table if not exists settings (
  key text primary key,
  value text
);

insert into settings (key, value) values
  ('owner_whatsapp', '+1XXXXXXXXXX'),
  ('owner_name', 'Capellan'),
  ('business_name', 'Capellan Auto Solution Express'),
  ('admin_pin', '1234')
on conflict (key) do nothing;

insert into services (name, duration_hours, price, icon) values
  ('Oil Change', 1, 49, '🛢'),
  ('Tire Rotation', 1, 35, '🔄'),
  ('Brake Service', 2, 180, '🔧'),
  ('Full Inspection', 2, 99, '🔍'),
  ('A/C Recharge', 2, 129, '❄️'),
  ('Engine Diagnostics', 1, 89, '⚙️'),
  ('Transmission Service', 3, 220, '🔩'),
  ('Timing Belt', 4, 380, '⛓️')
on conflict do nothing;

insert into availability (day_of_week, is_open, open_time, close_time) values
  ('Mon', true,  '08:00', '17:00'),
  ('Tue', true,  '08:00', '17:00'),
  ('Wed', true,  '08:00', '17:00'),
  ('Thu', true,  '08:00', '17:00'),
  ('Fri', true,  '08:00', '17:00'),
  ('Sat', true,  '09:00', '14:00'),
  ('Sun', false, '09:00', '13:00')
on conflict (day_of_week) do nothing;

create table if not exists whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  from_number text not null,
  message_body text not null,
  status text default 'unread',
  created_at timestamptz default now()
);
