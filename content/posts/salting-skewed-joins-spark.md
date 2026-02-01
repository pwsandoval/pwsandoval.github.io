---
title: "Salting in Spark: fix skewed joins with real evidence"
date: 2026-02-01
tags: ["spark", "databricks", "optimizacion"]
difficulty: "intermedio"
reading_time: "12 min"
slug: "salting-skewed-joins-spark"
cover:
  image: "/images/posts/cover-salting-skew-spark.svg"
  alt: "Cover: Spark Salting for Skewed Joins"
  caption: "Salting to fix skewed joins in Spark"
  relative: false
  hidden: false
---

This post shows a simple, repeatable skew scenario first, then applies the same idea to a more realistic dataset. The goal is to make the performance difference obvious and easy to capture.

## At a glance
- Skewed keys create long-running join tasks and slow stages.
- Salting spreads hot keys across partitions to remove bottlenecks.
- You will capture **before/after** stage time and shuffle metrics.
- Includes a quick synthetic repro and a real dataset example.

---

## Why skew hurts (and how salting helps)
When a single key dominates, Spark sends most of the work to a few tasks. Those stragglers control the total stage time. Salting adds a small random bucket to the skewed key so the heavy rows are split across many partitions, making task times more balanced.

---

## Quick repro you can run now (synthetic)
This is the minimal version you can run anywhere to see the effect clearly.

### Baseline (skewed join)
```python
from pyspark.sql import functions as F

# Skewed events: 90% of rows share the same key
events = (
    spark.range(0, 10_000_000)
         .withColumn("key", F.when(F.col("id") < 9_000_000, F.lit(1)).otherwise(F.col("id")))
)

# Lookup table
lookup = spark.range(0, 10_001).withColumnRenamed("id", "key")

baseline = events.join(lookup, on="key", how="left")
baseline.count()
```

### After salting (same join, balanced tasks)
```python
from pyspark.sql import functions as F

salt_buckets = 16

events_salted = events.withColumn(
    "salt",
    F.when(F.col("key") == 1, (F.rand() * salt_buckets).cast("int")).otherwise(F.lit(0))
)

lookup_salted = (
    lookup.withColumn("salt", F.explode(F.array([F.lit(i) for i in range(salt_buckets)])))
)

optimized = events_salted.join(lookup_salted, on=["key", "salt"], how="left")
optimized.count()
```

---

## A more real example (NYC Taxi + zones)
This example uses a real dataset so you can show a practical case. It still demonstrates the same skew pattern.

### Load data (Local Docker first)
Place the NYC Taxi files under `content/tools/apache-spark/docker/workspace/data/nyc_taxi/` so they map into the container at `/home/jovyan/work/data/nyc_taxi/`.

```python
trips = (
    spark.read.format("csv")
         .option("header", True)
         .option("inferSchema", True)
         .load("/home/jovyan/work/data/nyc_taxi/yellow")
)

zones = (
    spark.read.format("csv")
         .option("header", True)
         .option("inferSchema", True)
         .load("/home/jovyan/work/data/nyc_taxi/taxi_zone_lookup.csv")
)
```

### Load data (Databricks sample data)
```python
trips = (
    spark.read.format("csv")
         .option("header", True)
         .option("inferSchema", True)
         .load("dbfs:/databricks-datasets/nyctaxi/tripdata/yellow")
)

zones = (
    spark.read.format("csv")
         .option("header", True)
         .option("inferSchema", True)
         .load("dbfs:/databricks-datasets/nyctaxi/taxi_zone_lookup.csv")
)
```

### Create a skewed key (simulate a hot pickup zone)
```python
from pyspark.sql import functions as F

trips_skewed = trips.withColumn(
    "PULocationID",
    F.when(F.col("PULocationID").isNull(), F.lit(1)).otherwise(F.col("PULocationID"))
)

baseline_real = trips_skewed.join(zones, trips_skewed.PULocationID == zones.LocationID, "left")
baseline_real.count()
```

### Apply salting
```python
salt_buckets = 16

trips_salted = trips_skewed.withColumn(
    "salt",
    F.when(F.col("PULocationID") == 1, (F.rand() * salt_buckets).cast("int")).otherwise(F.lit(0))
)

zones_salted = (
    zones.withColumn("salt", F.explode(F.array([F.lit(i) for i in range(salt_buckets)])))
)

optimized_real = trips_salted.join(
    zones_salted,
    (trips_salted.PULocationID == zones_salted.LocationID) & (trips_salted.salt == zones_salted.salt),
    "left"
)
optimized_real.count()
```

---

## Before/after: what to capture (and where to place it)
You should add your own measurements here after running the code.

**Add these numbers**
- Total job time (baseline vs salted).
- Join stage duration.
- Shuffle read/write for the join stage.
- Max task time vs median task time.

**Add these screenshots**
- Spark UI: baseline join stage with skewed tasks.
- Spark UI: salted join stage with balanced tasks.
- SQL tab: physical plan (showing salted join).

---

## Notes from practice
- Start with a small `salt_buckets` value (8 or 16) and measure.
- Only salt the heavy keys; do not apply it globally.
- If the skew pattern changes frequently, revisit the logic.

---

## Run it yourself
- **Local Spark (Full Docker):** default path for this blog.
- **Databricks Free Edition:** quick alternative if you do not want Docker.

### Local (Docker) quick start
```bash
docker compose up
```

Links:
- [Apache Spark tool](/tools/apache-spark/)
- [Databricks Free Edition](https://www.databricks.com/try-databricks)
