---
title: "Spark Data Source API, paso a paso (CoinGecko)"
summary: "Construye un source de streaming en Spark leyendo datos reales desde una API pública."
description: 'Guía didáctica: del enfoque batch a un Data Source streaming en PySpark 3.5.1. Define schema, offsets, reader y registro del provider para usar format("coingecko").'
date: 2026-02-01
draft: true
tags: ["spark", "streaming", "optimizacion", "testing", "databricks"]
difficulty: "basico"
reading_time: "14 min"
slug: "spark-data-source-api-streaming"
notebook_ipynb: "/notebooks/spark/01-spark-data-source-api-streaming.ipynb"
notebook_py: "/notebooks/spark/01-spark-data-source-api-streaming.py"
---

Este post es una guía **paso a paso y pensada para notebook** para construir un source de streaming con la Data Source API en **PySpark 3.5.1**. Leeremos una API pública (CoinGecko) y la expondremos como `format("coingecko")`.

Descargas al final: [ir a Descargas](#descargas).

## Qué vas a construir
Al final podrás hacer esto dentro del notebook:

```python
(df = spark.readStream
       .format("coingecko")
       .option("coins", "bitcoin,ethereum")
       .load())
```

## Paso 0 — ¿Por qué no usar requests en un loop?
Puedes hacer polling y escribir archivos, pero eso **no es** un source de streaming real. Spark espera un reader con **schema + offsets**. Para eso existe la Data Source API.

## Paso 1 — Define el schema de salida
Declaramos la estructura una sola vez para que Spark pueda planificar el stream.

```python
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, LongType

schema = StructType([
    StructField("coin", StringType(), True),
    StructField("usd_price", DoubleType(), True),
    StructField("ts_ingest", LongType(), True),
])
```

## Paso 2 — Implementa el reader de streaming
Un reader necesita 3 métodos:
- `initialOffset()` — dónde empieza el stream
- `latestOffset()` — último offset disponible
- `read(start, end)` — filas entre offsets

```python
import time
import requests
from pyspark.sql.datasource import SimpleDataSourceStreamReader

class CoinGeckoStreamReader(SimpleDataSourceStreamReader):
    def __init__(self, options):
        self.options = options
        self.coins = options.get("coins", "bitcoin").split(",")

    def initialOffset(self):
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
        payload = requests.get(url, timeout=10).json()
        now = int(time.time())
        rows = []
        for coin in self.coins:
            price = payload.get(coin, {}).get("usd")
            rows.append({"coin": coin, "usd_price": float(price), "ts_ingest": now})
        return rows
```

## Paso 3 — Registrar el provider (PySpark 3.5.1)
En notebook debes registrar el provider **antes** de usar `format("coingecko")`.

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

## Paso 4 — Leer como stream
Ahora se comporta como cualquier source de Spark.

```python
df = (spark.readStream
      .format("coingecko")
      .option("coins", "bitcoin,ethereum")
      .load())
```

## Paso 5 — Validar el stream
Consola es suficiente para validar que funciona.

```python
(df.writeStream
   .format("console")
   .outputMode("append")
   .start())
```

Salida esperada (ejemplo):

```text
+--------+---------+----------+
|coin    |usd_price|ts_ingest |
+--------+---------+----------+
|bitcoin | 43125.0 |1707070000|
|ethereum| 2310.2  |1707070000|
+--------+---------+----------+
```

## Notas importantes
- CoinGecko es público y tiene rate limits. No llames muy seguido.
- La Data Source API sigue marcada como **experimental** en Spark 3.5.x.
- Si ves diferencias de firma, revisa la [documentación oficial](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.datasource.DataSource.html).

## Descargas
- Notebook (.ipynb): [Descargar](/notebooks/spark/01-spark-data-source-api-streaming.ipynb)
- Script (.py): [Descargar](/notebooks/spark/01-spark-data-source-api-streaming.py)
