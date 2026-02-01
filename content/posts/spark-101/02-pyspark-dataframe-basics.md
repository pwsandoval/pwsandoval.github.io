---
title: "PySpark DataFrame basics: select, filter, and write"
date: 2026-02-01
tags: ["spark", "databricks"]
difficulty: "basico"
reading_time: "11 min"
slug: "pyspark-dataframe-basics"
series: ["Spark & Delta 101"]
series_index: 2
cover:
  image: "/images/posts/cover-pyspark-basics.svg"
  alt: "Cover: PySpark DataFrame basics"
  caption: "Core DataFrame operations for beginners"
  relative: false
  hidden: false
---

{{< series_nav >}}

{{< notebook_buttons >}}

If you are new to Spark, learn these three operations first: select, filter, and write. This post is a short, practical tour with a small dataset you can run anywhere.

## Quick takeaways
- DataFrames are the core API you will use every day.
- The basics (select, filter, groupBy) cover most daily tasks.
- Writing data is part of the workflow, not an afterthought.

---

## Run it yourself
- **Local Spark (Full Docker):** default path for this blog.
- **Databricks Free Edition:** quick alternative if you do not want Docker.

```bash
docker compose up
```

Links:
- [Apache Spark tool](/tools/apache-spark/)
- [Databricks Free Edition](https://www.databricks.com/try-databricks)

---

## Create a tiny dataset
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
```python
filtered = df.select("id", "country", "amount").filter("amount > 50")
filtered.show(5)
```

---

## Group and aggregate
```python
summary = filtered.groupBy("country").count()
summary.show()
```

---

## Write the result
```python
out_path = "/tmp/pyspark/basics"
summary.write.mode("overwrite").parquet(out_path)
```

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
