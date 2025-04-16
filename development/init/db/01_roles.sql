DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'assets') THEN
    CREATE USER "assets" WITH PASSWORD 'assets';
  END IF;
END $$;

GRANT CONNECT ON DATABASE postgres TO "assets";
GRANT USAGE ON SCHEMA public TO "assets";
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public TO "assets";
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO "assets";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON TABLES TO "assets";
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO "assets";
