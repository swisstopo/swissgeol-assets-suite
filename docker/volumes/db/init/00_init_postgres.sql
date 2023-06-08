create user swissgeol_asset;
alter user swissgeol_asset with login superuser inherit nocreatedb nocreaterole noreplication;
alter user swissgeol_asset with password 'swissgeol_asset';

alter database postgres owner to swissgeol_asset;

create schema auth;
