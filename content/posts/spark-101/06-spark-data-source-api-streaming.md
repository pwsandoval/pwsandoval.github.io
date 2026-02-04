---
title: "Build a Spark Data Source API (real streaming)"
summary: "Build a Spark Data Source API with real streaming from an external API."
description: "Implement `SimpleDataSourceStreamReader`, define schema and offsets, and expose a custom format to read streaming events with control and observability, without external connectors."
date: 2026-02-01
tags: ["spark", "streaming", "infra", "testing", "databricks"]
difficulty: "basico"
reading_time: "12 min"
slug: "python-api-streaming-basics"
notebook_ipynb: "/notebooks/python-101/01-python-api-streaming-basics.ipynb"
notebook_py: "/notebooks/python-101/01-python-api-streaming-basics.py"
---

This post teaches **how to build a streaming Data Source in PySpark**. First we show the naive batch approach, then we create a real reader using `SimpleDataSourceStreamReader`. Ref: [PySpark Data Source API](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.datasource.SimpleDataSourceStreamReader.html).

Downloads at the end: [go to Downloads](#downloads).

## At a glance
- An external API is not a Spark source by default.
- With `SimpleDataSourceStreamReader` you can make it streaming.
- Result: `spark.readStream.format("weather").load()`.

---

## Run it yourself
Use the Spark Docker tool from this blog. No venv required.

Links:
- [Apache Spark tool](/tools/apache-spark/)

---

## 1) Naive approach (batch)
Works, but it is not real streaming:

```python
import json, requests

url = "https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&current=temperature_2m,relative_humidity_2m"
payload = requests.get(url).json()

with open("/home/jovyan/work/data/weather_stream/batch.json", "w") as f:
    f.write(json.dumps(payload))
```

---

## 2) The correct approach: streaming Data Source
Here we implement a reader that Spark can consume in real time.

### 2.1 Output schema
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
        # initial offset per station
        now = int(time.time())
        return {s: now for s in self.stations}

    def latestOffset(self):
        # latest available offset
        now = int(time.time())
        return {s: now for s in self.stations}

    def read(self, start, end):
        # fetch API data and return rows
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
Goal usage:

```python
df = (spark.readStream
      .format("weather")
      .option("stations", "[{'id':'NYC','lat':40.71,'lon':-74.01}]")
      .load())
```

For this to work, the reader must be **on the classpath** and registered as a provider named `"weather"`. In Spark 3.5+ the Data Source API is experimental, so verify your version.

---

## 3) Run the stream
```python
q = (
    df.writeStream
      .format("console")
      .outputMode("append")
      .option("truncate", False)
      .start()
)
```

**Expected output (example):**
```
+-------+-------------+-------------------+---------+
|station|temperature_2m|relative_humidity_2m|ts_ingest|
+-------+-------------+-------------------+---------+
|NYC    | 12.3        | 56.0              | 17190000|
```

---

## What to verify
- The stream prints new rows.
- The schema matches your expectation.
- You can change stations without breaking the reader.

---

## Notes from practice
- Start with 1 station, then scale.
- Isolate API logic to keep it testable.
- Add retries if the API fails.

---

## Downloads {#downloads}
If you do not want to copy code, download the notebook or the .py.

{{< notebook_buttons >}}
