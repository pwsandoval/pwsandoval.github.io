---
title: "Your first Delta table, step by step"
summary: "Create your first Delta table, write and read with core, verifiable operations."
description: "End‑to‑end walkthrough: create a Delta table, insert data, read, filter, and validate results with expected outputs. The minimal base before any optimization work."
date: 2026-02-01
draft: true
tags: ["spark", "delta", "databricks", "infra", "testing"]
difficulty: "basico"
reading_time: "9 min"
slug: "delta-table-101-create-read"
paths: ["Spark & Delta 101"]
paths_index: 1
notebook_ipynb: "/notebooks/spark-101/01-delta-table-101.ipynb"
notebook_py: "/notebooks/spark-101/01-delta-table-101.py"
---

{{< paths_nav >}}

If you are new to Delta Lake, this is the first post to run. It focuses on the minimal actions you do in real work: create a Delta table, read it back, and overwrite it safely. Reference: [Delta Lake](https://docs.delta.io/latest/delta-intro.html).

Downloads at the end: [go to Downloads](#downloads).

## Quick takeaways
- Delta tables are regular files + transaction log.
- You can read/write Delta like a normal table, but with reliability.
- This post gives you a minimal, reproducible flow to start.

---

## Run it yourself
- **Local Spark (Docker):** main path for this blog.
- **Databricks Free Edition:** quick alternative if you do not want Docker.

```bash
docker compose up
```

Links:
- [Apache Spark tool](/tools/apache-spark/)
- [Databricks Free Edition](https://www.databricks.com/try-databricks)

---

## Minimal setup
We generate a small dataset, write it as Delta, then read it back. Ref: [Spark range](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.SparkSession.range.html).

```python
from pyspark.sql import functions as F

df = (
    spark.range(0, 100_000)
         .withColumn("group", (F.col("id") % 10).cast("int"))
)
```

---

## Create the Delta table
Persist the DataFrame as Delta in a local path. Ref: [DataFrameWriter](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.DataFrameWriter.html).
```python
delta_path = "/tmp/delta/table_101"

df.write.format("delta").mode("overwrite").save(delta_path)
```

---

## Read it back
Read the same path to validate it. Ref: [DataFrameReader](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.DataFrameReader.html).
```python
read_back = spark.read.format("delta").load(delta_path)
read_back.groupBy("group").count().show()
```

**Expected output (example):**
```
+-----+-----+
|group|count|
+-----+-----+
|    0|10000|
|    1|10000|
...
```

---

## Overwrite safely (same schema)
```python
df_filtered = df.filter("group < 5")
df_filtered.write.format("delta").mode("overwrite").save(delta_path)
```

**Expected output:**
No direct output. The count should drop after reading again.

---

## What to verify
- The table reads without errors.
- Counts change after overwrite.
- The folder contains a `_delta_log` directory.

---

## Notes from practice
- Always use `format("delta")` explicitly to avoid ambiguity.
- Start with a local path so you can inspect files on disk.
- Keep paths simple for beginners.

---

## Downloads {#downloads}
If you want to run this without copying code, download the notebook or the .py export.

{{< notebook_buttons >}}
