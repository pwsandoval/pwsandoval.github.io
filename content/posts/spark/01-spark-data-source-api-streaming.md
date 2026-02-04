---
title: "Build a Spark streaming Data Source"
summary: "Build a custom Spark streaming source backed by an external API."
description: "Implement a minimal Data Source API reader with real offsets, a clear schema, and a usable format. You will compare the naive batch approach vs real streaming and run it end-to-end."
date: 2026-02-01
tags: ["spark", "streaming", "optimizacion", "testing", "databricks"]
difficulty: "basico"
reading_time: "12 min"
slug: "spark-data-source-api-streaming"
notebook_ipynb: "/notebooks/spark/01-spark-data-source-api-streaming.ipynb"
notebook_py: "/notebooks/spark/01-spark-data-source-api-streaming.py"
---

This post shows **how to build a real streaming Data Source in PySpark**. We start with the naive batch pattern, then implement a reader with `SimpleDataSourceStreamReader` from the official [Data Source API](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.datasource.SimpleDataSourceStreamReader.html).

Downloads at the end: [go to Downloads](#downloads).

## At a glance
- External APIs are not Spark sources by default.
- The Data Source API lets you define offsets and read streaming rows.
- Result: `spark.readStream.format("weather").load()`.

## Run it yourself
Use the [Apache Spark tool](/tools/apache-spark/) from this blog. No venv required.

## 1) The naive batch pattern
It works, but it is not streaming. You are just rewriting a file and re-reading it:

```python
import json, requests

url = "https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&current=temperature_2m,relative_humidity_2m"
payload = requests.get(url).json()

with open("/home/jovyan/work/data/weather_stream/batch.json", "w") as f:
    f.write(json.dumps(payload))
```

## 2) The correct approach: a streaming Data Source
A streaming reader must define a schema and an offset model. That is what the Data Source API expects.

### 2.1 Output schema
Define the schema explicitly (see the [DataFrame schema docs](https://spark.apache.org/docs/latest/sql-ref-datatype-schema.html)) so Spark can plan the stream:

```python
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, LongType

schema = StructType([
    StructField("station", StringType(), True),
    StructField("temperature_2m", DoubleType(), True),
    StructField("relative_humidity_2m", DoubleType(), True),
    StructField("ts_ingest", LongType(), True),
])
```

### 2.2 Streaming reader (functional skeleton)
Offsets are the key: `initialOffset` and `latestOffset` define the range, and `read` returns rows between them.

```python
import ast
import requests
import json
import time
from pyspark.sql.datasource import SimpleDataSourceStreamReader

class WeatherSimpleStreamReader(SimpleDataSourceStreamReader):
    def __init__(self, options):
        self.options = options
        self.stations = ast.literal_eval(options.get("stations", "[]"))

    def initialOffset(self):
        now = int(time.time())
        return {s: now for s in self.stations}

    def latestOffset(self):
        now = int(time.time())
        return {s: now for s in self.stations}

    def read(self, start, end):
        rows = []
        for station in self.stations:
            url = (
                "https://api.open-meteo.com/v1/forecast"
                f"?latitude={station['lat']}&longitude={station['lon']}"
                "&current=temperature_2m,relative_humidity_2m"
            )
            payload = requests.get(url).json()
            rows.append({
                "station": station["id"],
                "temperature_2m": payload["current"]["temperature_2m"],
                "relative_humidity_2m": payload["current"]["relative_humidity_2m"],
                "ts_ingest": int(time.time()),
            })
        return rows
```

### 2.3 Register the Data Source (main idea)
You want this usage:

```python
df = (spark.readStream
      .format("weather")
      .option("stations", "[{'id':'NYC','lat':40.71,'lon':-74.01}]")
      .load())
```

For this to work, the reader must be on the classpath and registered as a provider named `weather`. The Data Source API in Spark 3.5+ is still marked experimental, so validate your version in the [official docs](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.datasource.DataSource.html).

## 3) Run the stream
A minimal run to validate the pipeline:

```python
(df.writeStream
   .format("console")
   .outputMode("append")
   .start())
```

Expected output (example):

```text
+-------+---------------+---------------------+----------+
|station|temperature_2m |relative_humidity_2m |ts_ingest |
+-------+---------------+---------------------+----------+
|NYC    | 4.2           | 71.0                |1707070000|
+-------+---------------+---------------------+----------+
```

## Downloads
- Notebook (.ipynb): [Download](/notebooks/spark-101/06-spark-data-source-api-streaming.ipynb)
- Script (.py): [Download](/notebooks/spark-101/06-spark-data-source-api-streaming.py)
