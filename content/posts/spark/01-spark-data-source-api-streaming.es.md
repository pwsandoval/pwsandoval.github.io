---
title: "Spark Data Source API: streaming desde una API HTTP (CoinGecko)"
summary: "Construye un source de Structured Streaming en PySpark envolviendo una API HTTP real con schema, offsets, reader y registro del provider."
description: 'Guía práctica en PySpark 3.5.1 para convertir una API HTTP en un source de streaming de Spark. Explica schema, offsets, trigger, validación y cierre con ejemplo real escribiendo en Delta con checkpoint.'
date: 2026-02-01
tags: ["spark", "streaming", "optimizacion", "testing", "databricks"]
read_time: "24 min"
slug: "spark-data-source-api-streaming"
cover:
  image: "/images/posts/spark-data-source-api-streaming.es.webp"
  alt: "Spark Data Source API streaming con CoinGecko"
  relative: false
  hidden: false
images:
  - "/images/posts/spark-data-source-api-streaming.es.webp"
notebook_ipynb: "/notebooks/spark/01-spark-data-source-api-streaming.ipynb"
notebook_py: "/notebooks/spark/01-spark-data-source-api-streaming.py"
---

Este post muestra cómo envolver una API HTTP real (CoinGecko) como un source nativo de Spark Structured Streaming usando la Python Data Source API.

Si quieres correrlo local, puedes usar el stack de Spark/Jupyter del sitio: [tool de Apache Spark](/tools/apache-spark/).

Al final del artículo dejo los links del notebook `.ipynb` y script `.py`.

## Qué se está resolviendo aquí

Cuando no hay conector oficial para un sistema externo, un patrón común es:
- llamar `requests.get(...)` cada cierto tiempo,
- guardar JSON en disco,
- volver a leer esos archivos con Spark.

Ese patrón sirve para pruebas, pero no es un source de streaming real por dos motivos:
- Spark necesita una noción de progreso (`offset`) para checkpoint y recuperación consistente.
- Spark necesita que la lectura se haga por rangos (`start -> end`) en cada micro-batch.

La API oficial que define este contrato en PySpark es:
- `DataSource`: https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.datasource.DataSource.html
- `SimpleDataSourceStreamReader`: https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.datasource.SimpleDataSourceStreamReader.html
- Tutorial oficial: https://spark.apache.org/docs/latest/api/python/tutorial/sql/python_data_source.html

## API que vamos a leer

Usamos el endpoint público de precio simple de CoinGecko:

```
https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd
```

Referencia de API:
- Docs generales: https://docs.coingecko.com/
- Endpoint simple price: https://docs.coingecko.com/reference/simple-price

Ejemplo de respuesta HTTP esperada:

```json
{
  "bitcoin": { "usd": 51234 },
  "ethereum": { "usd": 2950.12 }
}
```

## Prerrequisitos mínimos
- Spark / PySpark 3.5.1.
- Acceso a internet desde el entorno donde corre Spark.
- Biblioteca `requests` instalada.

## Flujo completo que vamos a implementar

1. Definir un schema fijo de salida.
2. Implementar un reader streaming con `initialOffset`, `latestOffset` y `read`.
3. Registrar el provider para habilitar `format("coingecko")`.
4. Ejecutar `readStream` con trigger explícito.
5. Validar resultados en consola.
6. Cerrar con un ejemplo más realista escribiendo a Delta con checkpoint.

## Paso 1: entender schema y offset

En este contexto:
- `schema` es el contrato de columnas y tipos que Spark espera siempre.
- `offset` es la posición de progreso del stream.

Si el schema cambia en caliente (por ejemplo un campo deja de ser número y pasa a texto), empiezan errores o nulls inesperados.
Si no hay un offset consistente, Spark no puede saber qué ya procesó y qué falta.

Referencia oficial de modelo de streaming:
- Structured Streaming overview: https://spark.apache.org/docs/latest/streaming/index.html

## Paso 2: definir el schema de salida con detalle

Declaramos tres columnas:
- `coin`: identificador de moneda (`bitcoin`, `ethereum`, etc.).
- `usd_price`: precio en USD como `double`.
- `ts_ingest`: timestamp UNIX (segundos) del momento en que Spark hizo la llamada.

Para alguien que viene de cero: este schema es como la plantilla fija del DataFrame. Cada fila que devuelva el reader debe respetar estos nombres y tipos.

```python
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, LongType

schema = StructType([
    StructField("coin", StringType(), True),
    StructField("usd_price", DoubleType(), True),
    StructField("ts_ingest", LongType(), True),
])
```

## Paso 3: implementar el reader de streaming

Un reader mínimo implementa:
- `initialOffset()`: offset inicial cuando todavía no hay checkpoint.
- `latestOffset()`: offset más nuevo disponible al momento del trigger.
- `read(start, end)`: filas pertenecientes al rango de ese micro-batch.

En este ejemplo el offset será tiempo UNIX por moneda. No es el único enfoque posible, pero para un source HTTP simple es fácil de entender.

Código:

```python
import time
import requests
from pyspark.sql.datasource import SimpleDataSourceStreamReader

class CoinGeckoStreamReader(SimpleDataSourceStreamReader):
    def __init__(self, options):
        self.options = options
        raw_coins = options.get("coins", "bitcoin")
        self.coins = [c.strip() for c in raw_coins.split(",") if c.strip()]

    def initialOffset(self):
        # Arrancamos el stream "ahora".
        now = int(time.time())
        return {c: now for c in self.coins}

    def latestOffset(self):
        now = int(time.time())
        return {c: now for c in self.coins}

    def read(self, start, end):
        coins_csv = ",".join(self.coins)
        url = (
            "https://api.coingecko.com/api/v3/simple/price"
            f"?ids={coins_csv}&vs_currencies=usd"
        )
        payload = requests.get(url, timeout=10)
        payload.raise_for_status()
        body = payload.json()
        now = int(time.time())

        rows = []
        for coin in self.coins:
            price = body.get(coin, {}).get("usd")
            if price is None:
                rows.append({"coin": coin, "usd_price": None, "ts_ingest": now})
            else:
                rows.append({"coin": coin, "usd_price": float(price), "ts_ingest": now})

        return rows
```

Qué esperar de `read`:
- Si CoinGecko responde bien, devuelve una fila por moneda.
- Si una moneda no viene en el payload, `usd_price` queda en `null`.
- Si falla HTTP (4xx/5xx), `raise_for_status()` levanta error y el batch falla.

## Paso 4: registrar el provider

Este paso no es "solo para notebook". En script también debes registrar el provider, salvo que hayas empaquetado tu conector y Spark ya lo descubra por classpath.

Para este caso (código Python inline), se registra en la sesión:

```python
from pyspark.sql.datasource import DataSource

class CoinGeckoDataSource(DataSource):
    name = "coingecko"

    def schema(self):
        return schema

    def reader(self, schema):
        return CoinGeckoStreamReader(self.options)

spark.dataSource.register(CoinGeckoDataSource)
```

## Paso 5: leer como stream y configurar trigger

```python
df = (
    spark.readStream
    .format("coingecko")
    .option("coins", "bitcoin,ethereum")
    .load()
)
```

Ahora arrancamos la query. Con HTTP conviene trigger explícito para no llamar el endpoint sin control:

- Doc de trigger: https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.streaming.DataStreamWriter.trigger.html

```python
query = (
    df.writeStream
    .format("console")
    .outputMode("append")
    .option("truncate", False)
    .trigger(processingTime="30 seconds")
    .start()
)
```

## Paso 6: validar ejecución y detener correctamente

Consulta estado:

```python
query.isActive
query.status
query.lastProgress
```

Ejemplo de salida en consola (micro-batch):

```text
-------------------------------------------
Batch: 1
-------------------------------------------
+--------+---------+----------+
|coin    |usd_price|ts_ingest |
+--------+---------+----------+
|bitcoin |51234.0  |1708400102|
|ethereum|2950.12  |1708400102|
+--------+---------+----------+
```

Ejemplo de `query.lastProgress` resumido:

```json
{
  "batchId": 1,
  "numInputRows": 2,
  "inputRowsPerSecond": 0.06,
  "processedRowsPerSecond": 2.1
}
```

Detener de forma limpia:

```python
query.stop()
```

Si reinicias la query con checkpoint configurado en un sink durable, Spark retoma progreso desde ese estado.

## Ejemplo más real al cierre: escribir en Delta con checkpoint

Este patrón ya se acerca a un job de producción:

```python
target_path = "/tmp/coingecko_prices_delta"
checkpoint_path = "/tmp/checkpoints/coingecko_prices"

(
    df.writeStream
    .format("delta")
    .outputMode("append")
    .option("checkpointLocation", checkpoint_path)
    .trigger(processingTime="30 seconds")
    .start(target_path)
)
```

Qué ganas con esto:
- persistencia durable en Delta,
- recuperación tras reinicio con checkpoint,
- separación clara entre source custom y sink productivo.

Referencia oficial de Delta en Spark:
- https://docs.delta.io/latest/delta-intro.html

## Operación y buenas prácticas

- CoinGecko tiene límites; evita triggers muy cortos.
- Añade retry con backoff para errores transitorios HTTP.
- Instrumenta `query.lastProgress` y logs del driver.
- Mantén schema estable; cambios de tipo deben versionarse.
- Si quieres más contexto de la API Python Data Source, Databricks tiene este post: https://www.databricks.com/blog/announcing-general-availability-python-data-source-api

## Errores frecuentes y solución rápida

1. `format("coingecko") not found`
   No registraste el provider en esta sesión (`spark.dataSource.register(...)`).

2. `429 Too Many Requests`
   Trigger muy agresivo o límite temporal del API; aumenta intervalo y agrega retry.

3. Stream cae por error HTTP
   Agrega `try/except` con logging, o maneja respuesta degradada para no tumbar la query.

4. No salen filas
   Revisa `query.isActive`, `query.status` y conectividad del runtime.

## Descargas
- Notebook (.ipynb): [Descargar](/notebooks/spark/01-spark-data-source-api-streaming.ipynb)
- Script (.py): [Descargar](/notebooks/spark/01-spark-data-source-api-streaming.py)
