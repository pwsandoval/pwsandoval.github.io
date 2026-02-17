---
title: "SQL Server"
icon: "sql-server.svg"
summary: "Local SQL Server Docker stack to create a database, create a table, and load sample data."
cover:
  image: "/images/tools/sql-server-docker-local-setup.webp"
  alt: "SQL Server on Docker"
  hiddenInSingle: true
images:
  - "/images/tools/sql-server-docker-local-setup.webp"
---

In this guide, you will run **SQL Server on Docker** and leave it ready for exercises, testing, and queries.

At the end you will have:
- SQL Server listening on `localhost:1433`.
- A `demo` database.
- A `sensor` table.
- Sample records loaded from a file.

If you want to jump straight to the download, go to [Download](#download).

## Folder structure

```text
sql-server/
├─ docker-compose.yml
├─ Dockerfile
├─ mssql.env
├─ sample-data/
│  └─ room-climate.csv
├─ scripts/
│  ├─ db.sql
│  └─ tb.sql
└─ setup/
   ├─ entrypoint.sh
   └─ configure-db.sh
```

What each file is for:
- `Dockerfile`: builds the image that Docker Compose uses to run the service.
- `docker-compose.yml`: defines service, ports, env vars, and healthcheck.
- `mssql.env`: required environment variables for SQL Server startup.
- `setup/entrypoint.sh`: main container startup script.
- `setup/configure-db.sh`: waits for SQL Server and then runs SQL scripts.
- `scripts/db.sql`: creates the `demo` database.
- `scripts/tb.sql`: creates the `sensor` table and loads data.
- `sample-data/room-climate.csv`: sample dataset.

## Full startup flow

1. Docker Compose uses `docker-compose.yml` to start the service.
2. During startup, Compose builds the image from `Dockerfile`.
3. When the container starts, `entrypoint.sh` runs.
4. `entrypoint.sh` launches `configure-db.sh` in background, then starts SQL Server.
5. `configure-db.sh` waits until the engine is ready.
6. Once ready, it runs `db.sql` and then `tb.sql`.
7. Final result: database and table created, data loaded.

## File 1: docker-compose.yml (service and startup)

`docker-compose.yml`:

```yaml
services:
  sql-server:
    container_name: pw0-sql-server
    build:
      context: .
    ports:
      - "1433:1433"
    env_file:
      - ./mssql.env
    healthcheck:
      test: /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$$MSSQL_SA_PASSWORD" -Q "SELECT 1" || exit 1
      interval: 10s
      timeout: 10s
      retries: 6
      start_period: 10s
```

Minimum important parts:
1. `container_name`: container branding (`pw0-sql-server`).
2. `build.context: .`: uses the local `Dockerfile`.
3. `ports`: exposes SQL Server on `localhost:1433`.
4. `env_file`: loads env vars from `mssql.env`.
5. `healthcheck`: verifies SQL Server is responding.

## File 2: Dockerfile (image build)

```dockerfile
FROM mcr.microsoft.com/mssql/server:2017-CU31-GDR2-ubuntu-18.04
RUN mkdir -p /usr/config
WORKDIR /usr/config
COPY . /usr/config
RUN chmod +x /usr/config/setup/entrypoint.sh
RUN chmod +x /usr/config/setup/configure-db.sh
ENTRYPOINT ["./setup/entrypoint.sh"]
```

Quick line-by-line read (execution order):
1. `FROM ...`: starts from an image that already contains SQL Server.
2. `RUN mkdir -p /usr/config`: creates a folder for scripts and data.
3. `WORKDIR /usr/config`: sets the working directory.
4. `COPY . /usr/config`: copies the full project content into the container.
5. `RUN chmod +x ...`: gives execution permission to `.sh` scripts.
6. `ENTRYPOINT [...]`: defines the startup command.

## File 3: mssql.env (environment variables)

```env
ACCEPT_EULA="Y"
MSSQL_SA_PASSWORD="pw0SQLpas$"
MSSQL_PID="Developer"
```

What each variable does:
1. `ACCEPT_EULA="Y"`: accepts SQL Server license terms.
2. `MSSQL_SA_PASSWORD="..."`: sets the `sa` admin password.
3. `MSSQL_PID="Developer"`: selects Developer edition.

## File 4: entrypoint.sh (startup orchestration)

```bash
#!/bin/bash
/usr/config/setup/configure-db.sh &
/opt/mssql/bin/sqlservr
```

Why this order:
1. `configure-db.sh &`: starts the init process in background.
2. `sqlservr`: starts SQL Server as the main container process.
3. `&` lets both run in parallel.

## File 5: configure-db.sh (wait + SQL execution)

```bash
#!/bin/bash

DBSTATUS=1
i=0

while [[ "$DBSTATUS" -ne 0 ]] && [[ "$i" -lt 60 ]] || [[ -z "$DBSTATUS" ]]; do
    i=$((i + 1))
    DBSTATUS=$(/opt/mssql-tools/bin/sqlcmd -h -1 -t 1 -U sa -P "$MSSQL_SA_PASSWORD" -Q "SET NOCOUNT ON; SELECT SUM(STATE) FROM sys.databases")
    ERRCODE=$?
    sleep 1
done

if [[ "$DBSTATUS" -ne 0 ]] || [[ "$ERRCODE" -ne 0 ]]; then
    echo "SQL Server took more than 60 seconds to start up"
    exit 1
fi

echo "SQL Server took $i seconds to start up"

/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P $MSSQL_SA_PASSWORD -i /usr/config/scripts/db.sql &&
/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P $MSSQL_SA_PASSWORD -i /usr/config/scripts/tb.sql
```

This is the key startup step:
1. Waits up to 60 seconds for SQL Server readiness.
2. Runs `db.sql` first (database must exist before table creation).
3. Uses `&&` so `tb.sql` only runs if `db.sql` succeeds.
4. Prevents partial initialization on failures.

## File 6: db.sql (database creation)

```sql
USE master
GO

IF NOT EXISTS (
    SELECT name
    FROM sys.databases
    WHERE name = 'demo'
)
CREATE DATABASE demo
GO

PRINT 'DB demo creada (o ya existia)'
GO
```

This script:
1. Runs from `master`.
2. Checks whether `demo` already exists.
3. Creates `demo` only when missing.

## File 7: tb.sql (table + initial load)

```sql
USE demo
GO

IF NOT EXISTS (
    SELECT name
    FROM sysobjects
    WHERE name = 'sensor'
      AND xtype = 'U'
)
CREATE TABLE sensor (
    created_at DATETIME,
    temperature FLOAT,
    humidity FLOAT,
    pressure FLOAT,
    lux FLOAT
)
GO

IF NOT EXISTS (
    SELECT TOP 1 *
    FROM sensor
)
BULK INSERT sensor
FROM '/usr/config/sample-data/room-climate.csv'
WITH (
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n',
    FIRSTROW = 2,
    TABLOCK
)
GO

PRINT 'Tabla sensor creada y datos cargados (si estaba vacia)'
GO
```

This script:
1. Selects `demo`.
2. Creates `sensor` only if missing.
3. Loads CSV rows when the table is empty.

## Start the stack (step-by-step or zip)

From the folder that contains `docker-compose.yml`:

```bash
docker compose up -d
```

This command applies in both cases:
1. If you followed the step-by-step setup and created files manually.
2. If you downloaded the `.zip` and started from that project folder.

## Load your own data

Recommended formats in this setup:
1. `CSV`: easiest option with `BULK INSERT`.
2. Delimited `TXT`: also valid with the right delimiter.
3. `Excel (.xlsx)`: export to CSV first.

### What to change
1. Put your file in `sample-data/` (for example `my-data.csv`).
2. Update `CREATE TABLE` columns and types in `scripts/tb.sql`.
3. Update the `BULK INSERT` file path:

```sql
FROM '/usr/config/sample-data/my-data.csv'
```

4. If your delimiter is not comma, change `FIELDTERMINATOR`.
5. If your file has no header row, use `FIRSTROW = 1`.

Example for semicolon-separated files:

```sql
WITH (
    FIELDTERMINATOR = ';',
    ROWTERMINATOR = '\n',
    FIRSTROW = 2,
    TABLOCK
)
```

## Quick verification

### Step 1: open `sqlcmd`

```bash
docker compose exec sql-server /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "pw0SQLpas$"
```

### Step 2: check database

```sql
SELECT name
FROM sys.databases
WHERE name = 'demo';
GO
```

Expected output (example):

```text
name
----
demo
```

### Step 3: check loaded row count

```sql
USE demo;
GO
SELECT COUNT(*) AS total_rows FROM sensor;
GO
```

Expected output (example):

```text
total_rows
----------
1500
```

### Step 4: check sample rows

```sql
USE demo;
GO
SELECT TOP 5 * FROM sensor ORDER BY created_at DESC;
GO
```

## Stop and remove the stack

When you finish:

```bash
docker compose down
```

This stops and removes the stack containers.

---

## Download {#download}
If you do not want to copy files manually, download the full stack (optional):

{{< tool_download_button href="/downloads/sql-server-docker-stack.zip" >}}
