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
└─ docker/
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
- `docker/Dockerfile`: crea la imagen final que usarás en `docker build`.
- `docker/mssql.env`: define variables obligatorias para iniciar SQL Server.
- `docker/setup/entrypoint.sh`: script principal de arranque del contenedor.
- `docker/setup/configure-db.sh`: espera a que SQL Server esté listo y luego ejecuta SQL.
- `docker/scripts/db.sql`: crea la base `demo`.
- `docker/scripts/tb.sql`: crea la tabla `sensor` y carga datos.
- `docker/sample-data/room-climate.csv`: dataset de ejemplo.

## Flujo completo de arranque

1. Docker construye una imagen desde `Dockerfile`.
2. Al iniciar el contenedor, se ejecuta `entrypoint.sh`.
3. `entrypoint.sh` lanza `configure-db.sh` en segundo plano y luego arranca SQL Server.
4. `configure-db.sh` espera a que el motor responda.
5. Cuando el motor está listo, ejecuta `db.sql` y después `tb.sql`.
6. Resultado final: base y tabla creadas, datos cargados.

## Archivo 1: Dockerfile (construcción de imagen)

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
4. `COPY . /usr/config`: copia todo el contenido de `docker/` dentro del contenedor.
5. `RUN chmod +x ...`: da permisos de ejecución a los scripts `.sh`.
6. `ENTRYPOINT [...]`: define qué comando correr al iniciar el contenedor.

## Archivo 2: mssql.env (variables de entorno)

```env
ACCEPT_EULA="Y"
MSSQL_SA_PASSWORD="SqlServerP4ss!"
MSSQL_PID="Developer"
```

Para qué sirve cada variable:
1. `ACCEPT_EULA="Y"`: acepta la licencia; sin esto SQL Server no inicia.
2. `MSSQL_SA_PASSWORD="..."`: define la clave del usuario administrador `sa`.
3. `MSSQL_PID="Developer"`: selecciona la edición Developer.

## Archivo 3: entrypoint.sh (orquestación de inicio)

```bash
#!/bin/bash
/usr/config/setup/configure-db.sh &
/opt/mssql/bin/sqlservr
```

Por qué está así:
1. `configure-db.sh &`: lo ejecuta en segundo plano para que comience a esperar disponibilidad.
2. `sqlservr`: arranca el proceso principal del contenedor.
3. El `&` permite que ambos procesos convivan: uno espera y prepara; el otro sirve la base.

## Archivo 4: configure-db.sh (espera + ejecución SQL)

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

/opt/mssql-tools/bin/sqlcmd -S sql-server -U sa -P $MSSQL_SA_PASSWORD -i /usr/config/scripts/db.sql &&
/opt/mssql-tools/bin/sqlcmd -S sql-server -U sa -P $MSSQL_SA_PASSWORD -i /usr/config/scripts/tb.sql
```

Aquí ocurre la parte clave del arranque:
1. Espera hasta 60 segundos a que SQL Server responda.
2. Ejecuta `db.sql` primero, porque la base debe existir antes de crear tabla.
3. Usa `&&` para garantizar orden seguro: `tb.sql` solo corre si `db.sql` fue exitoso.
4. Si algo falla en creación de base, evita que la carga de datos se ejecute en un estado inválido.

## Archivo 5: db.sql (creación de base)

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

## Archivo 6: tb.sql (tabla + carga inicial)

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

## Ejecutar el stack

Desde la carpeta que contiene `docker/`:

```bash
docker build -t sql-server-local ./docker
docker run -d --name sql-server -p 1433:1433 --env-file ./docker/mssql.env sql-server-local
```

Qué hace cada comando:
1. `docker build ...`: crea la imagen con tus scripts y datos.
2. `docker run ...`: levanta el contenedor, expone puerto `1433` y carga variables de `mssql.env`.

## Cómo cargar tus propios datos

Formatos recomendados en este setup:
1. `CSV`: opción más directa con `BULK INSERT`.
2. `TXT` delimitado: también válido ajustando separador.
3. `Excel (.xlsx)`: primero exportar a CSV.

### Qué debes cambiar
1. Copia tu archivo a `docker/sample-data/` (por ejemplo `mis-datos.csv`).
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
docker exec -it sql-server /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "SqlServerP4ss!"
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

## Limpieza

```bash
docker rm -f sql-server
```

---

## Descarga {#descarga}
Si no quieres copiar archivos manualmente, descarga el stack completo:

<div class="notebook-buttons">
  <a class="notebook-btn" href="/downloads/sql-server-docker-stack.zip">Descargar stack completo de SQL Server (Docker)</a>
</div>
