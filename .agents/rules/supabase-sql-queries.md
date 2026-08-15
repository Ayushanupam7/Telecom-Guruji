# Supabase SQL Queries Directive

Whenever modifying or troubleshooting Supabase database tables, schemas, columns, enums, triggers, RLS policies, or PL/pgSQL functions:
1. Always provide a ready-to-run, copy-pasteable SQL snippet for the user to execute directly in their Supabase Dashboard SQL Editor (`https://supabase.com/dashboard/project/wchaqrfkxnomafwcpiqq/sql/new`).
2. Ensure all SQL snippets use safe, idempotent clauses (`CREATE TABLE IF NOT EXISTS`, `CREATE TYPE ... IF NOT EXISTS` or `DO $$` blocks, `CREATE OR REPLACE FUNCTION`, `DROP TRIGGER IF EXISTS`).
