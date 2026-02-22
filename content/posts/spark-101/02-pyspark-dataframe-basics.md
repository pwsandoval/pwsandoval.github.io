---
title: "PySpark basics for everyday work"
summary: "Select, filter, and aggregates: the three daily moves in PySpark."
description: "Practical guide with clear examples and expected outputs to master core DataFrame transformations. Includes readable chaining patterns and quick validations."
date: 2026-02-01
draft: true
tags: ["spark", "databricks", "infra", "testing", "certificacion"]
difficulty: "basico"
reading_time: "11 min"
slug: "pyspark-dataframe-basics"
paths: ["Spark & Delta 101"]
paths_index: 2
notebook_ipynb: "/notebooks/spark-101/02-pyspark-dataframe-basics.ipynb"
notebook_py: "/notebooks/spark-101/02-pyspark-dataframe-basics.py"
---

{{< paths_nav >}}

If you are new to Spark, start with these three operations: select, filter, and write. This is a short, practical tour with a small dataset you can run anywhere. Reference: [select](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.DataFrame.select.html), [filter](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.DataFrame.filter.html).

Downloads at the end: [go to Downloads](#downloads).

## Quick takeaways
- DataFrames are the core API you will use every day.
- The basics (select, filter, groupBy) cover most daily tasks.
- Writing data is part of the workflow, not an afterthought.

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

## Create a tiny dataset
We build a small DataFrame we can explore.
```python
from pyspark.sql import functions as F

df = (
    spark.range(0, 100_000)
         .withColumn("country", F.when(F.col("id") % 3 == 0, "MX").when(F.col("id") % 3 == 1, "PE").otherwise("CO"))
         .withColumn("amount", (F.rand() * 100).cast("double"))
)
```

---

## Select and filter
Pick columns and filter to keep relevant rows.
```python
filtered = df.select("id", "country", "amount").filter("amount > 50")
filtered.show(5)
```

**Expected output (example):**
```
+---+-------+------+
| id|country|amount|
+---+-------+------+
|  1|     PE| 78.21|
...
```

---

## Group and aggregate
Group by country to get a quick summary.
```python
summary = filtered.groupBy("country").count()
summary.show()
```

**Expected output (example):**
```
+-------+-----+
|country|count|
+-------+-----+
|     PE|16667|
|     MX|16666|
|     CO|16667|
```

---

## Write the result
Persist the output to see the on‑disk layout.
```python
out_path = "/tmp/pyspark/basics"
summary.write.mode("overwrite").parquet(out_path)
```

**Expected output:**
The output folder is created with Parquet files.

---

## What to verify
- `filtered.count()` is less than the original count.
- The output folder exists and contains Parquet files.
- The group counts make sense for your distribution.

---

## Notes from practice
- Always start by inspecting a small sample with `show()`.
- Keep paths simple when teaching new users.
- Save outputs to build intuition about file layouts.

---

## Downloads {#downloads}
If you want to run this without copying code, download the notebook or the .py export.

{{< notebook_buttons >}}
