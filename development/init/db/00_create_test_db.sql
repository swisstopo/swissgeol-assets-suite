CREATE DATABASE postgres_test;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'assets') THEN
    GRANT CONNECT ON DATABASE postgres_test TO "assets";
  END IF;
END $$;
