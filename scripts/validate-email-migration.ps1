$ErrorActionPreference = "Stop"

$ContainerName = "focusroute-email-migration-test"
$DbName = "focusroute_validation"
$RepoRoot = Split-Path -Parent $PSScriptRoot

function Remove-TestContainer {
  $previousErrorAction = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  docker rm -f $ContainerName 2>&1 | Out-Null
  $ErrorActionPreference = $previousErrorAction
}

Remove-TestContainer
docker run -d --name $ContainerName -e POSTGRES_PASSWORD=postgres -p 54329:5432 postgres:16-alpine | Out-Null

for ($i = 0; $i -lt 30; $i++) {
  $ready = docker exec $ContainerName pg_isready -U postgres 2>$null
  if ($LASTEXITCODE -eq 0) { break }
  Start-Sleep -Seconds 1
}

if ($LASTEXITCODE -ne 0) {
  throw "Postgres container did not become ready"
}

docker exec $ContainerName psql -U postgres -c "CREATE DATABASE $DbName;" | Out-Null

$bootstrap = @"
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY
);
DO `$`$ BEGIN
  CREATE ROLE anon NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END `$`$;
DO `$`$ BEGIN
  CREATE ROLE authenticated NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END `$`$;
DO `$`$ BEGIN
  CREATE ROLE service_role NOLOGIN BYPASSRLS;
EXCEPTION WHEN duplicate_object THEN NULL;
END `$`$;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS `$`$ SELECT NULL::uuid `$`$;
CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS jsonb
LANGUAGE sql
STABLE
AS `$`$ SELECT '{}'::jsonb `$`$;
"@

$bootstrap | docker exec -i $ContainerName psql -U postgres -d $DbName | Out-Null

$migrations = @(
  "0001_baseline_schema.sql",
  "0002_subscription_plan_key.sql",
  "0003_subscription_schedule_tracking.sql",
  "0004_email_delivery_foundation.sql"
)

foreach ($file in $migrations) {
  $path = Join-Path $RepoRoot "supabase/migrations/$file"
  if (-not (Test-Path $path)) {
    throw "Missing migration file: $path"
  }
  Get-Content $path -Raw | docker exec -i $ContainerName psql -U postgres -d $DbName -v ON_ERROR_STOP=1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Migration failed: $file"
  }
}

Get-Content (Join-Path $RepoRoot "scripts/validate-email-migration.sql") -Raw |
  docker exec -i $ContainerName psql -U postgres -d $DbName -v ON_ERROR_STOP=1

if ($LASTEXITCODE -ne 0) {
  throw "Validation SQL failed"
}

Remove-TestContainer
Write-Output "migration_0004_local_validation_passed"
