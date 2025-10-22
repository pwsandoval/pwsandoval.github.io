---
title: "📡 Streaming 101 with Spark: file/Auto Loader → console (no installs)"
date: 2025-10-13
tags: ["streaming", "spark", "databricks", "delta"]
difficulty: "basic"
reading_time: "8 min"
slug: "streaming-file-autoloader-console"
---

**1‑line value:** Spin up Structured Streaming without external services: read **files** (Auto Loader or classic file source), do a tiny transform, and print to **console**.

---

## Executive summary
- Use **file-based streaming** instead of `rate`: either **Auto Loader (`cloudFiles`)** on Databricks or the **built‑in file source** on vanilla Spark.
- Works with **existing public/sample data**—no Kafka, no sockets, no netcat.
- Add a tiny **transform** (filter + derived column) and stream to **`console`** for instant feedback.
- Tune **throughput/latency** with `trigger(availableNow=True)` (one‑shot catch‑up) or `processingTime` (micro‑batches).
- Include **copy‑ready snippets**, plus a minimalist checklist to move toward production.

---

## 1) Problem & context
I want a **minimal streaming skeleton** that anyone can run today—locally or on Databricks—without provisioning brokers or external services. The goal: **read → transform → print** to validate the pipeline shape and metrics.

---

## 2) Minimal reproducible setup / dataset
Choose one path:

**A. Databricks (recommended): Auto Loader**
- Source: **Auto Loader (`cloudFiles`)** reading a directory that already contains files (e.g., sample datasets on DBFS).
- Mode: **`availableNow=True`** to process what exists and finish—great for demos and CI.

**B. Vanilla Spark (local): file source**
- Source: **file streaming** that picks up **new files** appearing under a directory (JSON/CSV).
- We’ll provide a tiny helper to **drop a few files** so the stream has something to read.

> Both options avoid extra installations or networking tools. You can later switch the sink from `console` to **Delta** for durability.

---

## 3) Baseline approach (works, with trade‑offs)

### A. Databricks — Auto Loader (CSV → console, one‑shot)
```python
from pyspark.sql import functions as F

input_path = "dbfs:/databricks-datasets/retail-org/customers"  # example folder with CSVs

df = (
    spark.readStream
         .format("cloudFiles")
         .option("cloudFiles.format", "csv")
         .option("header", True)
         .load(input_path)
)

# Minimal transform: select a few columns, add a derived flag
out = (
    df.select("customer_id", "email", "country")
      .withColumn("is_gmail", F.col("email").contains("@gmail.com"))
)

q = (
    out.writeStream
       .format("console")
       .outputMode("append")
       .option("truncate", False)
       .trigger(availableNow=True)   # process everything once, then stop
       .start()
)

# In Databricks, click Stop if you didn't use availableNow.
# q.awaitTermination()
```

**Trade‑offs:** `console` is for debugging only (no durability). Without checkpoints, there’s no recovery semantics.

---

### B. Vanilla Spark — file source (JSON → console, continuous)
```python
from pyspark.sql import functions as F, types as T

schema = T.StructType([
    T.StructField("id", T.LongType()),
    T.StructField("event_time", T.TimestampType()),
    T.StructField("country", T.StringType()),
])

input_dir = "/tmp/stream_input_json"

df = (
    spark.readStream
         .schema(schema)            # required for file streaming
         .json(input_dir)           # or .csv(input_dir) with header/options
)

out = (
    df.filter("country IS NOT NULL")
      .withColumn("is_latam", F.col("country").isin("PE","MX","CO","AR","CL","BR"))
)

q = (
    out.writeStream
       .format("console")
       .outputMode("append")
       .option("truncate", False)
       .trigger(processingTime="5 seconds")
       .start()
)

# In another shell/notebook cell, drop a few JSON files into input_dir
# to see the stream pick them up.
# q.awaitTermination()
```

**Trade‑offs:** You must place **new files** in `input_dir` for the stream to progress. Use small batches to keep latency predictable.

---

## 4) Optimization (what, why, how to measure)
- **Trigger strategy**
  - `availableNow=True` (Auto Loader): deterministic catch‑up, ideal for demos/tests.
  - `processingTime="N seconds"`: stable micro‑batches; balance latency vs. cost.
- **Schema management**
  - Provide a **schema** for file sources (required)—faster startup and safer parsing.
  - In Auto Loader, consider **`cloudFiles.schemaEvolutionMode`** for evolving data.
- **Throughput & backpressure**
  - Limit input volume by controlling how many files you drop per interval (file source).
  - Watch **processedRowsPerSecond** and **batchDuration** in the Streaming UI.
- **Partitions**
  - For large folders, allow Auto Loader to scale listing efficiently; for file source, control **`maxFilesPerTrigger`**.

---

## 5) Evidence / simple metrics (before vs. after)
- **Before:** `processingTime=5s` or `availableNow=True`, small input set → short batches, stable latency.
- **After:** add more files (or a larger folder) → higher **processedRowsPerSecond**; verify **batchDuration** stays below the trigger target.

> Use the Spark/Databricks **Streaming Query UI** to confirm input rows, batch duration, and recent failures.

---

## 6) Final copy‑ready snippets

**Auto Loader, one‑shot CSV → console**
```python
(spark.readStream.format("cloudFiles")
    .option("cloudFiles.format", "csv").option("header", True)
    .load("dbfs:/databricks-datasets/retail-org/customers")
    .writeStream.format("console").option("truncate", False)
    .trigger(availableNow=True).start())
```

**File source (JSON) with schema → console**
```python
from pyspark.sql import types as T
schema = T.StructType([T.StructField("id", T.LongType()), T.StructField("event_time", T.TimestampType()), T.StructField("country", T.StringType())])
(spark.readStream.schema(schema).json("/tmp/stream_input_json")
    .writeStream.format("console").outputMode("append").start())
```

**Delta sink with checkpoint (recommended)**
```python
(spark.readStream.format("cloudFiles").option("cloudFiles.format","csv").option("header", True)
    .load("dbfs:/databricks-datasets/retail-org/customers")
    .writeStream.format("delta").outputMode("append")
    .option("checkpointLocation", "dbfs:/tmp/chk/auto_loader_demo")
    .option("path", "dbfs:/tmp/out/auto_loader_demo")
    .trigger(availableNow=True)
    .start())
```

---

## 7) Toward production on Databricks (checklist)
- ✅ Use **Delta** sink + **checkpointLocation** for exactly‑once semantics (idempotent writes).
- ✅ Prefer **Auto Loader** for file sources at scale (efficient listing, schema inference/evolution).
- ✅ Add **watermarks** if you do aggregations on time windows.
- ✅ Enable **AQE**; set `spark.sql.shuffle.partitions` based on data size.
- ✅ Add **observability** (metrics, logs, alerts) and **DLT**/Jobs for orchestration.
- ✅ Use `trigger(availableNow=True)` for catch‑up workloads; otherwise schedule micro‑batches or **continuous** if supported.

---

## 8) References
- Spark Structured Streaming Guide — Files & Triggers: https://spark.apache.org/docs/latest/structured-streaming-programming-guide.html
- Databricks Auto Loader (cloudFiles): https://docs.databricks.com/en/ingestion/auto-loader/index.html

---

## LinkedIn material
- Kick‑start **Structured Streaming** without brokers: **file streaming** or **Auto Loader**.
- Add a tiny transform and print to **`console`**; then switch to **Delta** with checkpoint to persist.
- Choose **`availableNow`** for one‑shot demos/tests, or **`processingTime`** for steady micro‑batches.

**CTA:** Want this sample extended with **windowed aggregations + watermarks**? I’ll package it next.
