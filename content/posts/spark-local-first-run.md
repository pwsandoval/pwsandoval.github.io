---
title: "Spark local, primer arranque"
summary: "Start Spark locally with Docker, validate the setup, and run a first verification job."
description: "Hands‑on guide to bring up the local stack, check UI/health, and run a first job. Includes minimal checks to confirm Master/Workers are healthy and ready for the rest of the posts."
date: 2026-02-01
draft: true
tags: ["spark", "infra", "testing", "databricks", "certificacion"]
difficulty: "basico"
reading_time: "8 min"
slug: "spark-local-first-run"
notebook_ipynb: "/notebooks/spark-101/00-env-check.ipynb"
notebook_py: "/notebooks/spark-101/00-env-check.py"
---

This post is your **first step** before running any notebook. We verify Spark starts, the UI responds, and you can write/read Parquet.

Downloads at the end: [go to Downloads](#downloads).

## At a glance
- Confirm Spark starts without errors.
- Verify Spark UI and version.
- Write/read Parquet on the local volume.

---

## Run it yourself
Use the Spark Docker stack from this blog.

Links:
- [Apache Spark tool](/tools/apache-spark/)

---

## 1) Start Spark and check version
This confirms Spark is alive.

```python
from pyspark.sql import SparkSession

spark = (
    SparkSession.builder
    .appName("pw0 - env check")
    .config("spark.ui.port", "4040")
    .getOrCreate()
)

spark.version
```

**Expected output (example):**
```
'3.5.1'
```

Open the UI at `http://localhost:4040` and confirm the app name.

---

## 2) Simple count
A basic count validates jobs execute correctly.

```python
df = spark.range(0, 1_000_000)
df.count()
```

**Expected output:**
```
1000000
```

---

## 3) Write and read Parquet
This validates that local volumes are mounted correctly.

```python
out_path = "/home/jovyan/work/data/env_check_parquet"
df.write.mode("overwrite").parquet(out_path)

df2 = spark.read.parquet(out_path)
df2.count()
```

**Expected output:**
```
1000000
```

---

## Notes from practice
- If UI does not load, check the port in Docker.
- If the path fails, review volume mounts.
- This post is the base before **Delta Table 101**.

---

## Downloads {#downloads}
If you do not want to copy code, download the notebook or the .py.

{{< notebook_buttons >}}
