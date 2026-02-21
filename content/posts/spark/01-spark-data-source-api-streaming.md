---
title: "Spark Data Source API, step by step (CoinGecko)"
summary: "Build a streaming source in Spark from a public API."
description: 'Step‑by‑step guide: from a batch approach to a real streaming Data Source in PySpark 3.5.1. Defines schema, offsets, reader, and provider registration to use format("coingecko").'
date: 2026-02-01
tags: ["spark", "streaming", "optimizacion", "testing", "databricks"]
difficulty: "basico"
reading_time: "14 min"
slug: "spark-data-source-api-streaming"
notebook_ipynb: "/notebooks/spark/01-spark-data-source-api-streaming.ipynb"
notebook_py: "/notebooks/spark/01-spark-data-source-api-streaming.py"
---

This post is a **step‑by‑step, notebook‑friendly** guide to building a Spark streaming source using the Data Source API in **PySpark 3.5.1**. We will read a public API (CoinGecko) and expose it as `format("coingecko")`.

Downloads at the end: [go to Downloads](#downloads).

## What you will build
By the end, this works inside a notebook:

```python
(df = spark.readStream
       .format("coingecko")
       .option("coins", "bitcoin,ethereum")
       .load())
```

## Step 0 — Why not just use requests in a loop?
You *can* poll an API and write files, but that is not a streaming source. Spark expects a reader that knows **schema + offsets**. The Data Source API gives you that.

## Step 1 — Define the output schema
We declare the structure once so Spark can plan the stream.

```python
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, LongType

schema = StructType([
    StructField("coin", StringType(), True),
    StructField("usd_price", DoubleType(), True),
    StructField("ts_ingest", LongType(), True),
])
```

## Step 2 — Implement the streaming reader
A streaming reader needs 3 methods:
- `initialOffset()` — where the stream starts
- `latestOffset()` — the newest offset available
- `read(start, end)` — return rows between offsets

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

## Step 3 — Register the provider (PySpark 3.5.1)
In a notebook, you must register the provider **before** `format("coingecko")` works.

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

## Step 4 — Read as a stream
Now it behaves like any Spark source.

```python
df = (spark.readStream
      .format("coingecko")
      .option("coins", "bitcoin,ethereum")
      .load())
```

## Step 5 — Validate the stream
Console output is enough to verify it works.

```python
(df.writeStream
   .format("console")
   .outputMode("append")
   .start())
```

Expected output (example):

```text
+--------+---------+----------+
|coin    |usd_price|ts_ingest |
+--------+---------+----------+
|bitcoin | 43125.0 |1707070000|
|ethereum| 2310.2  |1707070000|
+--------+---------+----------+
```

## Notes you should keep in mind
- CoinGecko is public and rate‑limited. Don’t call it too frequently.
- The Data Source API is still marked **experimental** in Spark 3.5.x.
- If you see signature differences, check the [official DataSource docs](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.datasource.DataSource.html).

## Downloads
- Notebook (.ipynb): [Download](/notebooks/spark/01-spark-data-source-api-streaming.ipynb)
- Script (.py): [Download](/notebooks/spark/01-spark-data-source-api-streaming.py)
