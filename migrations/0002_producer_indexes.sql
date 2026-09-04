create index if not exists analisis_status_published_idx on analisis (status, published_at desc, id desc);
create index if not exists analisis_pair_idx on analisis (pair);
create index if not exists analisis_timeframe_idx on analisis (timeframe);
