---
title: "SQL Server"
icon: "sql-server.svg"
summary: "Stack local de SQL Server en Docker para crear una base, tabla y cargar datos de ejemplo."
cover:
  image: "/images/tools/sql-server-docker-local-setup.webp"
  alt: "SQL Server en Docker"
  hiddenInSingle: true
images:
  - "/images/tools/sql-server-docker-local-setup.webp"
---

En esta guía vas a levantar **SQL Server en Docker** y dejarlo listo para usar en ejercicios, pruebas y consultas.

Al final tendrás:
- SQL Server escuchando en `localhost:1433`.
- Una base `demo`.
- Una tabla `sensor`.
- Registros de ejemplo cargados desde archivo.

Si quieres saltar directo a la descarga, ve a [Descargar stack](#descarga).

## Estructura de carpetas

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

Qué contiene cada archivo:
- `Dockerfile`: crea la imagen que usará Docker Compose para levantar el servicio.
- `docker-compose.yml`: define el servicio, puertos, variables y healthcheck.
- `mssql.env`: define variables obligatorias para iniciar SQL Server.
- `setup/entrypoint.sh`: script principal de arranque del contenedor.
- `setup/configure-db.sh`: espera a que SQL Server esté listo y luego ejecuta SQL.
- `scripts/db.sql`: crea la base `demo`.
- `scripts/tb.sql`: crea la tabla `sensor` y carga datos.
- `sample-data/room-climate.csv`: dataset de ejemplo.

## Flujo completo de arranque

1. Docker Compose usa `docker-compose.yml` para levantar el servicio.
2. Durante el arranque, Compose construye la imagen con `Dockerfile`.
3. Al iniciar el contenedor, se ejecuta `entrypoint.sh`.
4. `entrypoint.sh` lanza `configure-db.sh` en segundo plano y luego arranca SQL Server.
5. `configure-db.sh` espera a que el motor responda.
6. Cuando el motor está listo, ejecuta `db.sql` y después `tb.sql`.
7. Resultado final: base y tabla creadas, datos cargados.

## Archivo 1: docker-compose.yml (servicio y arranque)

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

Lo mínimo importante aquí:
1. `container_name`: branding del contenedor (`pw0-sql-server`).
2. `build.context: .`: usa el `Dockerfile` de esta carpeta.
3. `ports`: publica SQL Server en `localhost:1433`.
4. `env_file`: carga variables desde `mssql.env`.
5. `healthcheck`: permite validar que el motor responde.

## Archivo 2: Dockerfile (construcción de imagen)

```dockerfile
FROM mcr.microsoft.com/mssql/server:2017-CU31-GDR2-ubuntu-18.04
RUN mkdir -p /usr/config
WORKDIR /usr/config
COPY . /usr/config
RUN chmod +x /usr/config/setup/entrypoint.sh
RUN chmod +x /usr/config/setup/configure-db.sh
ENTRYPOINT ["./setup/entrypoint.sh"]
```

Lectura rápida por líneas (en orden de ejecución):
1. `FROM ...`: toma una imagen base que ya trae SQL Server instalado.
2. `RUN mkdir -p /usr/config`: crea carpeta donde vivirán scripts y datos.
3. `WORKDIR /usr/config`: fija esa carpeta como directorio de trabajo.
4. `COPY . /usr/config`: copia todo el contenido del proyecto dentro del contenedor.
5. `RUN chmod +x ...`: da permisos de ejecución a los scripts `.sh`.
6. `ENTRYPOINT [...]`: define qué comando correr al iniciar el contenedor.

## Archivo 3: mssql.env (variables de entorno)

```env
ACCEPT_EULA="Y"
MSSQL_SA_PASSWORD="pw0SQLpas$"
MSSQL_PID="Developer"
```

Para qué sirve cada variable:
1. `ACCEPT_EULA="Y"`: acepta la licencia; sin esto SQL Server no inicia.
2. `MSSQL_SA_PASSWORD="..."`: define la clave del usuario administrador `sa`.
3. `MSSQL_PID="Developer"`: selecciona la edición Developer.

## Archivo 4: entrypoint.sh (orquestación de inicio)

```bash
#!/bin/bash
/usr/config/setup/configure-db.sh &
/opt/mssql/bin/sqlservr
```

Por qué está así:
1. `configure-db.sh &`: lo ejecuta en segundo plano para que comience a esperar disponibilidad.
2. `sqlservr`: arranca el proceso principal del contenedor.
3. El `&` permite que ambos procesos convivan: uno espera y prepara; el otro sirve la base.

## Archivo 5: configure-db.sh (espera + ejecución SQL)

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

Aquí ocurre la parte clave del arranque:
1. Espera hasta 60 segundos a que SQL Server responda.
2. Ejecuta `db.sql` primero, porque la base debe existir antes de crear tabla.
3. Usa `&&` para garantizar orden seguro: `tb.sql` solo corre si `db.sql` fue exitoso.
4. Si algo falla en creación de base, evita que la carga de datos se ejecute en un estado inválido.

## Archivo 6: db.sql (creación de base)

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

Con este script:
1. Trabaja desde `master`, que es la base administrativa.
2. Verifica existencia de `demo`.
3. Crea la base solo si no existe, para que el script sea reutilizable.

## Archivo 7: tb.sql (tabla + carga inicial)

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

Con este script:
1. Selecciona la base `demo`.
2. Crea `sensor` solo si no existe.
3. Si no hay filas, carga datos del CSV para dejar un entorno funcional desde el primer arranque.

## Iniciar el stack (paso a paso o zip)

Desde la carpeta donde está `docker-compose.yml`:

```bash
docker compose up -d
```

Este comando aplica en ambos casos:
1. Si seguiste el paso a paso y creaste los archivos manualmente.
2. Si descargaste el `.zip` y levantaste el proyecto desde ahí.

## Cómo cargar tus propios datos

Formatos recomendados en este setup:
1. `CSV`: opción más directa con `BULK INSERT`.
2. `TXT` delimitado: también válido ajustando separador.
3. `Excel (.xlsx)`: primero exportar a CSV.

### Qué debes cambiar
1. Copia tu archivo a `sample-data/` (por ejemplo `mis-datos.csv`).
2. Ajusta la tabla en `scripts/tb.sql` para que columnas y tipos coincidan.
3. Cambia la ruta del `BULK INSERT`:

```sql
FROM '/usr/config/sample-data/mis-datos.csv'
```

4. Si el delimitador no es coma, ajusta `FIELDTERMINATOR`.
5. Si tu CSV no tiene encabezado, usa `FIRSTROW = 1` en lugar de `FIRSTROW = 2`.

Ejemplo para archivo separado por `;`:

```sql
WITH (
    FIELDTERMINATOR = ';',
    ROWTERMINATOR = '\n',
    FIRSTROW = 2,
    TABLOCK
)
```

## Verificación rápida

### Paso 1: entrar a `sqlcmd`

```bash
docker compose exec sql-server /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "pw0SQLpas$"
```

Esto abre el cliente SQL dentro del contenedor para ejecutar consultas manualmente.

### Paso 2: validar que la base existe

```sql
SELECT name
FROM sys.databases
WHERE name = 'demo';
GO
```

Qué verifica:
- Que `db.sql` se ejecutó correctamente.

Respuesta esperada (ejemplo):
```text
name
----
demo
```

### Paso 3: validar tabla y cantidad de filas

```sql
USE demo;
GO
SELECT COUNT(*) AS total_rows FROM sensor;
GO
```

Qué verifica:
- Que `tb.sql` creó la tabla.
- Que `BULK INSERT` cargó registros.

Respuesta esperada (ejemplo):
```text
total_rows
----------
1500
```

### Paso 4: revisar muestra de datos

```sql
USE demo;
GO
SELECT TOP 5 * FROM sensor ORDER BY created_at DESC;
GO
```

Qué verifica:
- Que las columnas tienen valores coherentes.
- Que el tipo de dato permite ordenar por fecha.

Respuesta esperada (ejemplo):
```text
created_at               temperature  humidity  pressure  lux
----------------------- ----------- --------- --------- -----
2024-03-01 10:00:00.000 23.4        41.2      1012.7    320
...
```

## Detener y eliminar el stack

Cuando termines:

```bash
docker compose down
```

Esto detiene y elimina los contenedores del stack.

---

## Descarga {#descarga}
Si no quieres copiar archivos manualmente, descarga el stack completo (opcional):

{{< tool_download_button href="/downloads/sql-server-docker-stack.zip" >}}
