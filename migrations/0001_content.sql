create table if not exists analisis (
  id serial primary key,
  slug text not null unique,
  pair text not null,
  title text not null,
  excerpt text not null,
  body text not null,
  image_url text not null default '',
  accent text not null default 'blue',
  published_at date not null default current_date,
  created_at timestamptz not null default now()
);

alter table analisis add column if not exists timeframe text not null default 'H4';
alter table analisis add column if not exists bias text not null default 'Netral';
alter table analisis add column if not exists support text not null default '';
alter table analisis add column if not exists resistance text not null default '';
alter table analisis add column if not exists target text not null default '';
alter table analisis add column if not exists invalidation text not null default '';
alter table analisis add column if not exists scenario_bullish text not null default '';
alter table analisis add column if not exists scenario_bearish text not null default '';
alter table analisis add column if not exists updated_at timestamptz not null default now();
alter table analisis add column if not exists status text not null default 'PUBLISHED';

update analisis set status = 'PUBLISHED' where status is null or status not in ('DRAFT','PUBLISHED','ARCHIVED');

alter table analisis drop constraint if exists analisis_status_check;
alter table analisis add constraint analisis_status_check check (status in ('DRAFT','PUBLISHED','ARCHIVED'));
create index if not exists analisis_published_idx on analisis (published_at desc);
create index if not exists analisis_status_idx on analisis (status);
create index if not exists analisis_updated_idx on analisis (updated_at desc);

create table if not exists edukasi (
  id serial primary key,
  slug text not null unique,
  level text not null,
  title text not null,
  description text not null,
  body text not null,
  image_url text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists edukasi_level_idx on edukasi (level);

create table if not exists news (
  id serial primary key,
  slug text not null unique,
  category text not null,
  title text not null,
  excerpt text not null,
  body text not null,
  thumb text not null default 'capitol',
  published_at date not null default current_date,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists news_published_idx on news (published_at desc, id desc);
create index if not exists news_category_idx on news (category);
