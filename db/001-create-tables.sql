create table karma_transactions (
  id bigserial primary key not null,
  karma_target text not null,
  delta integer not null,
  actor text not null,
  karma_date timestamp default now()
);